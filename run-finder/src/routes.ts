import { Actor } from 'apify';
import { createBasicRouter } from 'crawlee';
import { ExtendedContext, Labels, ListUserData, OutputItem, RunUserData } from './types.js';
import { RUNS_PER_PAGE } from './constants.js';
import { createPlaceholderRequest, isInputMatchingPattern } from './utils.js';

export const router = createBasicRouter<ExtendedContext>();

router.addHandler<ListUserData>(Labels.List, async ({ request, log, maxRuns, crawler, client, statuses, inputPattern }) => {
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
    const filteredRuns = runs
        .slice(0, maxRuns - offset)
        .filter((run) => {
            if (!statuses) return true;
            return statuses.includes(run.status);
        });

    if (Object.keys(inputPattern).length > 0) {
        const runRequests = filteredRuns
            .map((run) => createPlaceholderRequest<RunUserData>({
                label: Labels.Run,
                id: run.id,
                defaultKeyValueStoreId: run.defaultKeyValueStoreId,
            }));
        await crawler.addRequests(runRequests);
    } else {
        const outputItems: OutputItem[] = filteredRuns.map(({ id, defaultKeyValueStoreId }) => ({ id, defaultKeyValueStoreId }));
        await Actor.pushData(outputItems);
    }
});

router.addHandler<RunUserData>(Labels.Run, async ({ request, log, crawler, inputPattern, stopOnFound, client }) => {
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
