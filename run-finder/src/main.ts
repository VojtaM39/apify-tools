import { Actor } from 'apify';
import { BasicCrawler } from 'crawlee';
import { router } from './routes.js';
import { InputSchema, Labels, ListUserData } from './types.js';
import { createPlaceholderRequest } from './utils.js';

await Actor.init();

const { actorId, taskId, maxRuns, inputPattern, statuses, stopOnFound, tokenOverride } = (await Actor.getInput<InputSchema>())!;

if (!inputPattern && !statuses) throw new Error('Missing inputPattern or statuses input');
if (!maxRuns) throw new Error('Missing maxRuns input');

const client = Actor.newClient({ token: tokenOverride || process.env.TOKEN_OVERRIDE || process.env.APIFY_TOKEN });

const crawler = new BasicCrawler({
    maxConcurrency: 3,
    requestHandler: (context) => router({ ...context, maxRuns, inputPattern, statuses, stopOnFound, client }),
});

const startRequest = createPlaceholderRequest<ListUserData>({
    offset: 0,
    actorId,
    taskId,
    label: Labels.List,
});

await crawler.run([startRequest]);

// Gracefully exit the Actor process. It's recommended to quit all Actors with an exit()
await Actor.exit();
