import { Actor } from 'apify';
import { BasicCrawler } from 'crawlee';
import { router } from './routes.js';
import { InputSchema, Labels, ListUserData } from './types.js';
import { createPlaceholderRequest } from './utils.js';

await Actor.init();

const {
    actorId,
    taskId,
    maxRuns,
    aggregateRunDetails,
    aggregateInputs,
    aggregateDatasets,
    aggregateLogs,
    aggregateDatasetInfo,
    truncateLogs,
    tokenOverride,
} = (await Actor.getInput<InputSchema>())!;

if (!maxRuns) throw new Error('Missing maxRuns input');

const client = Actor.newClient({ token: tokenOverride || process.env.TOKEN_OVERRIDE || process.env.APIFY_TOKEN });

const crawler = new BasicCrawler({
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 120,
    requestHandler: (context) => router({
        ...context,
        client,
        maxRuns,
        aggregateRunDetails: !!aggregateRunDetails,
        aggregateInputs: !!aggregateInputs,
        aggregateDatasets: !!aggregateDatasets,
        aggregateLogs: !!aggregateLogs,
        aggregateDatasetInfo: !!aggregateDatasetInfo,
        truncateLogs,
    }),
});

const startRequest = createPlaceholderRequest<ListUserData>(
    {
        offset: 0,
        actorId,
        taskId,
        label: Labels.List,
    },
    'list-0',
);

await crawler.run([startRequest]);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
