import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "../config/env";
import { AnalysisResponseSchema, type AnalysisResponse } from "../schemas/analysis.schema";

const SYSTEM_PROMPT = `Você é um sistema especialista em análise de gosto musical estilo "Spotify Wrapped".

Vou te enviar dados de um usuário contendo:
- artistas mais ouvidos (com gêneros e popularidade)
- músicas mais ouvidas (nome + artistas)

Sua tarefa é analisar esses dados e gerar um perfil musical completo.

REGRAS IMPORTANTES:
- Use os GÊNEROS como principal fonte de verdade
- Use os NOMES DAS MÚSICAS como contexto secundário (para inferir vibe/mood)
- Não invente artistas ou dados externos
- Seja consistente: os números devem refletir o texto
- Os valores devem ser REALISTAS (baseados nos gêneros)

RETORNE APENAS UM JSON válido (sem markdown, sem explicação) com exatamente essa estrutura:

{
  "stats": {
    "energy": number (0 a 100),
    "valence": number (0 a 100),
    "danceability": number (0 a 100)
  },
  "persona": "texto curto (2-3 frases), criativo, moderno e levemente irônico, estilo Spotify Wrapped",
  "analysis": {
    "main_genres": ["..."],
    "mood": "descrição curta do humor musical",
    "listener_type": "ex: 'mainstream', 'alternativo', 'explorador', etc",
    "summary": "resumo técnico curto do gosto musical"
  }
}

DICAS DE INTERPRETAÇÃO:

Energy:
- Funk, eletrônica, trap → alto
- Indie, lo-fi → médio
- acústico, ambient → baixo

Valence (humor):
- músicas felizes/festa → alto
- melancólicas/introvertidas → baixo

Danceability:
- ritmos fortes e repetitivos → alto
- músicas complexas ou lentas → baixo`;

interface UserMusicData {
    artists: { name: string; genres: string[]; popularity: number }[];
    tracks: { name: string; artists: string[] }[];
}

export async function analyzeMusicalProfile(data: UserMusicData): Promise<AnalysisResponse> {
    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

    const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: `DADOS DO USUÁRIO:\n\n${JSON.stringify(data, null, 2)}`,
            },
        ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
        throw new Error("Claude did not return a text response");
    }

    const parsed = JSON.parse(textBlock.text);
    return AnalysisResponseSchema.parse(parsed);
}
