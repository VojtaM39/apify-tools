import { Dictionary, RequestOptions } from 'crawlee';

export const createPlaceholderRequest = <T extends Dictionary>(userData: T, uniqueKey: string): RequestOptions<T> => ({
    url: 'https://placeholder.com',
    userData,
    uniqueKey,
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
