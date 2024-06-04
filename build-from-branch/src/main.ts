#! /usr/bin/env node

import { Actor, log } from 'apify';
import { createGitRepoUrl, getCurrentFolder, getCurrentGitStateOrThrow, loadActorConfigOrThrow, parseCommandLineArguments } from './utils.js';
import { BUILD_TAG, VERSION_NUMBER } from './constants.js';

const client = Actor.apifyClient;

const config = loadActorConfigOrThrow();
const { username } = await client.user().get();

const commandLineArguments = parseCommandLineArguments();

const technicalActorName = `${username}/${config.name}`;

const actorClient = client.actor(technicalActorName);
const versionNumber = commandLineArguments.version ?? VERSION_NUMBER;
const versionClient = actorClient.version(versionNumber);
const versionsClient = actorClient.versions();

const { remote, branch, rootPath } = await getCurrentGitStateOrThrow();
const currentFolder = getCurrentFolder(rootPath);
const gitRepoUrl = createGitRepoUrl(remote, branch, currentFolder);

const versionExists = !!await versionClient.get();
if (versionExists) {
    await versionClient.update({
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
} else {
    const buildTag = versionNumber === '0.0' ? 'latest' : BUILD_TAG;
    await versionsClient.create({
        buildTag,
        versionNumber,
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
}

const build = await actorClient.build(versionNumber);
log.info(`The build is running: ${build.id}, version: ${versionNumber}`);
const buildRun = await client.build(build.id).waitForFinish();

if (buildRun.status === 'SUCCEEDED') log.info('Actor build finished');
else log.error('Actor build failed');
