import { ApifyClient } from 'apify';
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
}

export interface ExtendedContext extends BasicCrawlingContext {
    client: ApifyClient;
    maxRuns: number;
    inputPattern: Record<string, string>;
    stopOnFound?: boolean;
}

export interface InputSchema {
    actorId?: string;
    taskId?: string;
    maxRuns?: number;
    inputPattern?: Record<string, string>;
    stopOnFound?: boolean;
    tokenOverride?: string;
}

export interface OutputItem {
    id: string;
    defaultKeyValueStoreId: string;
}
