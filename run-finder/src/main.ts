import { Actor } from 'apify';
import { BasicCrawler } from 'crawlee';
import { router } from './routes.js';
import { InputSchema, Labels, ListUserData } from './types.js';
import { createPlaceholderRequest } from './utils.js';

await Actor.init();

const { actorId, taskId, maxRuns, inputPattern, stopOnFound } = (await Actor.getInput<InputSchema>())!;

if (!inputPattern) throw new Error('Missing inputPattern input');
if (!maxRuns) throw new Error('Missing maxRuns input');

const crawler = new BasicCrawler({
    maxConcurrency: 3,
    requestHandler: (context) => router({ ...context, maxRuns, inputPattern, stopOnFound }),
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
