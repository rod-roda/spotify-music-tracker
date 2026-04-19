export const callbackQuerySchema = {
    type: 'object',
    properties: {
        code: { type: 'string' },
        error: { type: 'string' },
        state: { type: 'string' },
    },
    required: ['state']
} as const;

export const topItemsQuerySchema = {
    type: 'object',
    properties: {
        limit: { type: 'integer', minimum: 1, maximum: 50 },
        time_range: {
            type: 'string',
            enum: ['short_term', 'medium_term', 'long_term'],
        },
    },
} as const;

// TypeScript interfaces matching the JSON Schemas above
export interface CallbackQuery {
    code?: string;
    error?: string;
    state: string;
}

export interface TopItemsQuery {
    limit?: number;
    time_range?: 'short_term' | 'medium_term' | 'long_term';
}
