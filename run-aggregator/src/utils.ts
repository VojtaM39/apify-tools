import { Dictionary, RequestOptions } from 'crawlee';
import { v4 } from 'uuid';

export const createPlaceholderRequest = <T extends Dictionary>(userData: T, uniqueKey: string | null = null): RequestOptions<T> => ({
    url: 'https://placeholder.com',
    userData,
    uniqueKey: uniqueKey ?? v4(),
});
