import { Dictionary, RequestOptions } from 'crawlee';
import { v4 } from 'uuid';

export const createPlaceholderRequest = <T extends Dictionary>(userData: T): RequestOptions<T> => ({
    url: 'https://placeholder.com',
    userData,
    uniqueKey: v4(),
});
