import { ActorRun, ApifyClient } from 'apify';
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
    aggregateRunDetails: boolean;
    aggregateInputs: boolean;
    aggregateDatasets: boolean;
}

export interface InputSchema {
    actorId?: string;
    taskId?: string;
    maxRuns?: number;
    aggregateInputs?: boolean;
    aggregateDatasets?: boolean;
    aggregateRunDetails?: boolean;
    tokenOverride?: string;
}

export interface OutputItem {
    runId: string;
    run: ActorRun | null;
    input: Record<string, unknown> | null;
    datasetItems: Record<string, unknown>[] | null;
}
