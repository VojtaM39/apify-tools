import { Dictionary, RequestOptions } from 'crawlee';
import { v4 } from 'uuid';

export const createPlaceholderRequest = <T extends Dictionary>(userData: T): RequestOptions<T> => ({
    url: 'https://placeholder.com',
    userData,
    uniqueKey: v4(),
});

export const isInputMatchingPattern = (input: Record<string, unknown>, pattern: Record<string, unknown>): boolean => {
    for (const key of Object.keys(pattern)) {
        if (!(key in input)) {
            return false;
        }

        if (typeof input[key] === 'object' && typeof pattern[key] === 'object') {
            if (!isInputMatchingPattern(input[key] as Record<string, unknown>, pattern[key] as Record<string, unknown>)) {
                return false;
            }
        } else if (input[key] !== pattern[key]) {
            return false;
        }
    }

    return true;
};
