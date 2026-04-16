import { z } from "zod";

export const LastfmArtistSchema = z.object({
    name: z.string(),
    stats: z.object({
        listeners: z.string(),
        playcount: z.string()
    }),
    similar: z.object({
        artist: z.array(z.object({
            name: z.string(),
            image: z.array(z.object({ "#text": z.string(), size: z.string() }))
        }))
    }),
    tags: z.object({
        tag: z.array(z.object({ name: z.string() }))
    })
});

export type LastfmArtist = z.infer<typeof LastfmArtistSchema>;
