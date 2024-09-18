import { Actor } from 'apify';
import { createBasicRouter } from 'crawlee';
import { ExtendedContext, Labels, ListUserData, OutputItem, RunUserData } from './types.js';
import { RUNS_PER_PAGE } from './constants.js';
import { createPlaceholderRequest } from './utils.js';

export const router = createBasicRouter<ExtendedContext>();

router.addHandler<ListUserData>(Labels.List, async ({ request, log, maxRuns, crawler, client, initialOffset, detailQueue }) => {
    const { offset, actorId, taskId } = request.userData;

    const actorOrTaskClient = actorId ? client.actor(actorId) : client.task(taskId!);

    log.info(`[List] - offset: ${offset}, maxRuns: ${maxRuns}`);

    const limit = Math.min(maxRuns - offset + initialOffset, RUNS_PER_PAGE);
    const { items: runs } = await actorOrTaskClient.runs().list({ offset, limit, desc: true });

    // Enqueue next page request
    const nextOffset = offset + limit;
    if (nextOffset - initialOffset < maxRuns) {
        const nextRequest = createPlaceholderRequest<ListUserData>(
            {
                label: Labels.List,
                offset: nextOffset,
                actorId,
                taskId,
            },
            `list-${nextOffset}`,
        );
        await crawler.requestQueue?.addRequest(nextRequest, { forefront: true });
    }

    // Enqueue run requests
    const runRequests = runs
        .map((run) => createPlaceholderRequest<RunUserData>(
            {
                label: Labels.Run,
                id: run.id,
                defaultKeyValueStoreId: run.defaultKeyValueStoreId,
                defaultDatasetId: run.defaultDatasetId,
            },
            `run-${run.id}`,
        ));
    await detailQueue.addRequests(runRequests);
});

router.addHandler<RunUserData>(Labels.Run, async ({
    request,
    log,
    aggregateRunDetails,
    aggregateDatasets,
    aggregateInputs,
    aggregateLogs,
    aggregateDatasetInfo,
    truncateLogs,
    client,
}) => {
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

    let runLog = null;
    if (aggregateLogs) {
        runLog = (await client.log(id).get()) ?? null;
        if (runLog && truncateLogs) runLog.slice(-truncateLogs);
    }

    let datasetInfo = null;
    if (aggregateDatasetInfo) {
        datasetInfo = (await client.dataset(defaultDatasetId).get()) ?? null;
    }

    await Actor.pushData<OutputItem>({
        runId: id,
        run,
        input,
        datasetItems,
        datasetInfo,
        runLog,
    });
});
