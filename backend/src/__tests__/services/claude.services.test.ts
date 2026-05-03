import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn(function () {
        return { messages: { create: mockCreate } };
    }),
}));

import { analyzeMusicalProfile } from '../../services/claude.services';

const validAnalysis = {
    stats: { energy: 75, valence: 60, danceability: 80 },
    persona: 'Você ouve post-rock e chama isso de produtividade.',
    analysis: {
        main_genres: ['alternative rock', 'indie'],
        mood: 'introspectivo e energético',
        listener_type: 'alternativo',
        summary: 'Ouvinte de indie rock com tendências introspectivas.',
    },
};

const userData = {
    artists: [{ name: 'Radiohead', genres: ['alternative rock'], popularity: 80 }],
    tracks: [{ name: 'Creep', artists: ['Radiohead'] }],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('analyzeMusicalProfile', () => {
    it('returns parsed analysis on success', async () => {
        mockCreate.mockResolvedValue({
            content: [{ type: 'text', text: JSON.stringify(validAnalysis) }],
        });

        const result = await analyzeMusicalProfile(userData);
        expect(result.stats.energy).toBe(75);
        expect(result.analysis.listener_type).toBe('alternativo');
        expect(result.persona).toContain('produtividade');
    });

    it('throws when Claude does not return a text block', async () => {
        mockCreate.mockResolvedValue({ content: [{ type: 'tool_use', id: 'x' }] });

        await expect(analyzeMusicalProfile(userData)).rejects.toThrow(
            'Claude não retornou uma resposta em texto'
        );
    });

    it('throws when JSON is malformed', async () => {
        mockCreate.mockResolvedValue({
            content: [{ type: 'text', text: 'not valid json {{' }],
        });

        await expect(analyzeMusicalProfile(userData)).rejects.toThrow();
    });

    it('throws ZodError when listener_type is not in the enum', async () => {
        const badAnalysis = {
            ...validAnalysis,
            analysis: { ...validAnalysis.analysis, listener_type: 'Mainstream' },
        };
        mockCreate.mockResolvedValue({
            content: [{ type: 'text', text: JSON.stringify(badAnalysis) }],
        });

        await expect(analyzeMusicalProfile(userData)).rejects.toThrow();
    });

    it('throws ZodError when stats are out of range', async () => {
        const badAnalysis = {
            ...validAnalysis,
            stats: { energy: 150, valence: 60, danceability: 80 },
        };
        mockCreate.mockResolvedValue({
            content: [{ type: 'text', text: JSON.stringify(badAnalysis) }],
        });

        await expect(analyzeMusicalProfile(userData)).rejects.toThrow();
    });

    it('instantiates Anthropic with the API key from env', async () => {
        mockCreate.mockResolvedValue({
            content: [{ type: 'text', text: JSON.stringify(validAnalysis) }],
        });

        await analyzeMusicalProfile(userData);

        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test_anthropic_key' });
    });
});
