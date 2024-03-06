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
    maxRuns: number;
    aggregateInputs: boolean;
    aggregateDatasets: boolean;
}

export interface InputSchema {
    actorId?: string;
    taskId?: string;
    maxRuns?: number;
    aggregateInputs?: boolean;
    aggregateDatasets?: boolean;
}

export interface OutputItem {
    runId: string;
    input: Record<string, unknown> | null;
    datasetItems: Record<string, unknown>[] | null;
}
