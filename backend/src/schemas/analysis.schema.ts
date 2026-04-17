import { z } from "zod";

export const LISTENER_TYPES = [
    "mainstream",
    "alternativo",
    "explorador",
    "eclético",
    "nostálgico",
    "underground",
    "festeiro",
    "melancólico",
] as const;

export type ListenerType = (typeof LISTENER_TYPES)[number];

export const AnalysisResponseSchema = z.object({
    stats: z.object({
        energy: z.number().min(0).max(100),
        valence: z.number().min(0).max(100),
        danceability: z.number().min(0).max(100),
    }),
    persona: z.string(),
    analysis: z.object({
        main_genres: z.array(z.string()),
        mood: z.string(),
        listener_type: z.enum(LISTENER_TYPES),
        summary: z.string(),
    }),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
