import { ActorRun, ApifyClient, RequestQueue } from 'apify';
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
    maxRuns?: number;
    initialOffset: number;
    newestDate?: Date;
    oldestDate?: Date;
    aggregateRunDetails: boolean;
    aggregateInputs: boolean;
    aggregateDatasets: boolean;
    aggregateLogs: boolean;
    aggregateDatasetInfo: boolean;
    truncateLogs?: number;
    detailQueue: RequestQueue;
}

export interface InputSchema {
    actorId?: string;
    taskId?: string;
    maxRuns?: number;
    runOffset?: number;
    newestDate?: string;
    oldestDate?: string;
    aggregateInputs?: boolean;
    aggregateDatasets?: boolean;
    aggregateRunDetails?: boolean;
    aggregateLogs?: boolean;
    aggregateDatasetInfo?: boolean;
    truncateLogs?: number;
    tokenOverride?: string;
    countOnlyMode?: boolean;
}

export interface OutputItem {
    runId: string;
    run: ActorRun | null;
    input: Record<string, unknown> | null;
    datasetItems: Record<string, unknown>[] | null;
    datasetInfo: Dataset | null;
    runLog: string | null;
}
