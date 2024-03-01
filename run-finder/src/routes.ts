import { Actor } from 'apify';
import { createBasicRouter } from 'crawlee';
import { ExtendedContext, Labels, ListUserData, OutputItem, RunUserData } from './types.js';
import { RUNS_PER_PAGE } from './constants.js';
import { createPlaceholderRequest, isInputMatchingPattern } from './utils.js';

const client = Actor.newClient({ token: process.env.TOKEN_OVERRIDE || process.env.APIFY_TOKEN });

export const router = createBasicRouter<ExtendedContext>();

router.addHandler<ListUserData>(Labels.List, async ({ request, log, maxRuns, crawler }) => {
    const { offset, actorId, taskId } = request.userData;
    const actorOrTaskClient = actorId ? client.actor(actorId) : client.task(taskId!);

    log.info(`[List] - offset: ${offset}, maxRuns: ${maxRuns}`);

    const { items: runs } = await actorOrTaskClient.runs().list({ offset, limit: RUNS_PER_PAGE, desc: true });

    // Enqueue next page request
    const nextOffset = offset + RUNS_PER_PAGE;
    if (nextOffset < maxRuns) {
        const nextRequest = createPlaceholderRequest<ListUserData>({
            label: Labels.List,
            offset: nextOffset,
            actorId,
            taskId,
        });
        await crawler.requestQueue?.addRequest(nextRequest);
    }

    // Enqueue run requests
    const runRequests = runs
        .slice(0, maxRuns - offset)
        .map((run) => createPlaceholderRequest<RunUserData>({
            label: Labels.Run,
            id: run.id,
            defaultKeyValueStoreId: run.defaultKeyValueStoreId,
        }));
    await crawler.addRequests(runRequests);
});

router.addHandler<RunUserData>(Labels.Run, async ({ request, log, crawler, inputPattern, stopOnFound }) => {
    const { id, defaultKeyValueStoreId } = request.userData;
    log.info(`[Run] - id: ${id}`);

    const inputRecord = await client.keyValueStore(defaultKeyValueStoreId).getRecord('INPUT');
    if (!inputRecord) {
        log.warning(`[Run] - id: ${id}, defaultKeyValueStoreId: ${defaultKeyValueStoreId} - No INPUT record found`);
        return;
    }

    const patternMatch = isInputMatchingPattern(inputRecord!.value as Record<string, unknown>, inputPattern);
    if (patternMatch) {
        log.info(`[Run] - id: ${id}, defaultKeyValueStoreId: ${defaultKeyValueStoreId} - Match found`);
        await Actor.pushData<OutputItem>({ id, defaultKeyValueStoreId });

        if (stopOnFound) await crawler.autoscaledPool?.abort();
    }
});
