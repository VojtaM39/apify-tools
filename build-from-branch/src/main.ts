#! /usr/bin/env node

import { Actor, log } from 'apify';
import commandLineArgs from 'command-line-args';
import { createGitRepoUrl, getCurrentFolder, getCurrentGitStateOrThrow, loadActorConfigOrThrow } from './utils.js';
import { BUILD_TAG, VERSION_NUMBER, OPTION_DEFINITIONS } from './constants.js';

const client = Actor.apifyClient;

const config = loadActorConfigOrThrow();
const { username } = await client.user().get();

const options = commandLineArgs(OPTION_DEFINITIONS);

const versionNumber = options.version ?? VERSION_NUMBER;
const buildTag = options.tag ?? BUILD_TAG;

const technicalActorName = `${username}/${config.name}`;

const actorClient = client.actor(technicalActorName);
const versionClient = actorClient.version(versionNumber);
const versionsClient = actorClient.versions();

const { remote, branch, rootPath } = await getCurrentGitStateOrThrow();
const currentFolder = getCurrentFolder(rootPath);
const gitRepoUrl = createGitRepoUrl(remote, branch, currentFolder);

const versionExists = !!await versionClient.get();
if (versionExists) {
    await versionClient.update({
        buildTag,
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
} else {
    await versionsClient.create({
        buildTag,
        versionNumber,
        // @ts-expect-error - will be fixed
        sourceType: 'GIT_REPO',
        gitRepoUrl,
    });
}

const build = await actorClient.build(versionNumber, { tag: buildTag });
log.info(`The build is running: ${build.id} - version: ${versionNumber} - tag: ${buildTag}.`);
await client.build(build.id).waitForFinish();
log.info('Actor build finished');
