#! /usr/bin/env node

import { Actor, log } from 'apify';
import { createGitRepoUrl, getCurrentFolder, getCurrentGitStateOrThrow, loadActorConfigOrThrow } from './utils.js';
import { BUILD_TAG, VERSION_NUMBER } from './constants.js';

const client = Actor.apifyClient;

const config = loadActorConfigOrThrow();
const { username } = await client.user().get();

const technicalActorName = `${username}/${config.name}`;

const actorClient = client.actor(technicalActorName);
const versionClient = actorClient.version(VERSION_NUMBER);
const versionsClient = actorClient.versions();

const { remote, branch, rootPath } = await getCurrentGitStateOrThrow();
const currentFolder = getCurrentFolder(rootPath);
const gitRepoUrl = createGitRepoUrl(remote, branch, currentFolder);

const versionExists = !!await versionClient.get();
if (versionExists) {
    await versionClient.update({
        buildTag: 'debug',
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
} else {
    await versionsClient.create({
        buildTag: BUILD_TAG,
        versionNumber: VERSION_NUMBER,
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
}

const build = await actorClient.build(VERSION_NUMBER, { tag: BUILD_TAG });
log.info(`The build is running: ${build.id}`);
await client.build(build.id).waitForFinish();
log.info('Actor build finished');
