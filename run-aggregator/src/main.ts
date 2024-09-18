import { Actor, log } from 'apify';
import { BasicCrawler, BasicCrawlerOptions } from 'crawlee';
import { router } from './routes.js';
import { InputSchema, Labels, ListUserData } from './types.js';
import { createPlaceholderRequest } from './utils.js';

await Actor.init();

const {
    actorId,
    taskId,
    maxRuns,
    runOffset = 0,
    newestDate,
    oldestDate,
    aggregateRunDetails,
    aggregateInputs,
    aggregateDatasets,
    aggregateLogs,
    aggregateDatasetInfo,
    truncateLogs,
    tokenOverride,
    countOnlyMode,
} = (await Actor.getInput<InputSchema>())!;

const isInRunCountLimitMode = !!(maxRuns || runOffset);
const isInDateRangeMode = !!(newestDate || oldestDate);

if (isInRunCountLimitMode === isInDateRangeMode) {
    throw await Actor.fail('You either need to specify a date range (newestDate and oldestDate) or a run count limit (maxRuns and runOffset)');
}

const client = Actor.newClient({ token: tokenOverride || process.env.TOKEN_OVERRIDE || process.env.APIFY_TOKEN });

const listQueue = await Actor.openRequestQueue(`list-queue-${Actor.getEnv().actorRunId}`);
const detailQueue = await Actor.openRequestQueue();

const commonOptions: BasicCrawlerOptions = {
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 120,
    requestHandler: (context) => router({
        ...context,
        client,
        maxRuns,
        initialOffset: runOffset,
        newestDate: newestDate ? new Date(newestDate) : undefined,
        oldestDate: oldestDate ? new Date(oldestDate) : undefined,
        aggregateRunDetails: !!aggregateRunDetails,
        aggregateInputs: !!aggregateInputs,
        aggregateDatasets: !!aggregateDatasets,
        aggregateLogs: !!aggregateLogs,
        aggregateDatasetInfo: !!aggregateDatasetInfo,
        truncateLogs,
        detailQueue,
    }),
};

const listCrawler = new BasicCrawler({
    requestQueue: listQueue,
    ...commonOptions,
});

const detailCrawler = new BasicCrawler({
    requestQueue: detailQueue,
    ...commonOptions,
});

const startRequest = createPlaceholderRequest<ListUserData>(
    {
        offset: runOffset ?? 0,
        actorId,
        taskId,
        label: Labels.List,
    },
    'list-0',
);

await listCrawler.run([startRequest]);
if (countOnlyMode) {
    // allow to refresh the detail queue stats
    await new Promise((resolve) => setTimeout(resolve, 3_000));

    const { pendingRequestCount } = await detailQueue.getInfo() ?? {};
    log.info(`Number of runs found: ${pendingRequestCount}`);

    await listQueue.drop();
    await detailQueue.drop();
    await Actor.exit();
}
await detailCrawler.run();

await listQueue.drop();
await Actor.exit();
