import { Actor } from 'apify';
import { createBasicRouter } from 'crawlee';
import { ExtendedContext, Labels, ListUserData, OutputItem, RunUserData } from './types.js';
import { RUNS_PER_PAGE } from './constants.js';
import { createPlaceholderRequest } from './utils.js';

export const router = createBasicRouter<ExtendedContext>();

router.addHandler<ListUserData>(Labels.List, async ({ request, log, maxRuns, crawler, client }) => {
    const { offset, actorId, taskId } = request.userData;

    const actorOrTaskClient = actorId ? client.actor(actorId) : client.task(taskId!);

    log.info(`[List] - offset: ${offset}, maxRuns: ${maxRuns}`);

    const { items: runs } = await actorOrTaskClient.runs().list({ offset, limit: RUNS_PER_PAGE, desc: true });

    // Enqueue next page request
    const nextOffset = offset + RUNS_PER_PAGE;
    if (nextOffset < maxRuns) {
        const nextRequest = createPlaceholderRequest<ListUserData>(
            {
                label: Labels.List,
                offset: nextOffset,
                actorId,
                taskId,
            },
            `list-${nextOffset}`,
        );
        await crawler.requestQueue?.addRequest(nextRequest);
    }

    // Enqueue run requests
    const runRequests = runs
        .slice(0, maxRuns - offset)
        .map((run) => createPlaceholderRequest<RunUserData>(
            {
                label: Labels.Run,
                id: run.id,
                defaultKeyValueStoreId: run.defaultKeyValueStoreId,
                defaultDatasetId: run.defaultDatasetId,
            },
            `run-${run.id}`,
        ));
    await crawler.addRequests(runRequests);
});

router.addHandler<RunUserData>(Labels.Run, async ({ request, log, aggregateRunDetails, aggregateDatasets, aggregateInputs, client }) => {
    const { id, defaultKeyValueStoreId, defaultDatasetId } = request.userData;
    log.info(`[Run] - id: ${id}`);

    let run = null;
    if (aggregateRunDetails) {
        run = await client.run(id).get() ?? null;
    }

    let input = null;
    if (aggregateInputs) {
        const inputRecord = await client.keyValueStore(defaultKeyValueStoreId).getRecord('INPUT');
        if (!inputRecord) log.warning(`[Run] - id: ${id}, defaultKeyValueStoreId: ${defaultKeyValueStoreId} - No INPUT record found`);

        input = inputRecord?.value as Record<string, unknown>;
    }

    let datasetItems = null;
    if (aggregateDatasets) {
        const { items } = await client.dataset(defaultDatasetId).listItems();
        datasetItems = items;
    }

    await Actor.pushData<OutputItem>({
        runId: id,
        run,
        input,
        datasetItems,
    });
});
