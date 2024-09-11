import { ActorRun, ApifyClient } from 'apify';
import { Dataset } from 'apify-client';
import { BasicCrawlingContext } from 'crawlee';

export enum Labels {
    List = 'List',
    Run = 'Run',
}

interface BaseUserData {
    label: Labels;
}

export interface ListUserData extends BaseUserData {
    offset: number;
    actorId?: string;
    taskId?: string;
}

export interface RunUserData extends BaseUserData {
    id: string;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
}

export interface ExtendedContext extends BasicCrawlingContext {
    client: ApifyClient;
    maxRuns: number;
    runOffset: number;
    aggregateRunDetails: boolean;
    aggregateInputs: boolean;
    aggregateDatasets: boolean;
    aggregateLogs: boolean;
    aggregateDatasetInfo: boolean;
    truncateLogs?: number;
}

export interface InputSchema {
    actorId?: string;
    taskId?: string;
    maxRuns?: number;
    runOffset?: number;
    aggregateInputs?: boolean;
    aggregateDatasets?: boolean;
    aggregateRunDetails?: boolean;
    aggregateLogs?: boolean;
    aggregateDatasetInfo?: boolean;
    truncateLogs?: number;
    tokenOverride?: string;
}

export interface OutputItem {
    runId: string;
    run: ActorRun | null;
    input: Record<string, unknown> | null;
    datasetItems: Record<string, unknown>[] | null;
    datasetInfo: Dataset | null;
    runLog: string | null;
}
