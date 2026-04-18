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
- Retorne energy, valence e danceability como números inteiros entre 0 e 100 (sem casas decimais e sem símbolo de %)

RETORNE APENAS UM JSON válido (sem markdown, sem explicação) com exatamente essa estrutura:

{
  "stats": {
    "energy": number (0 a 100),
    "valence": number (0 a 100),
    "danceability": number (0 a 100)
  },
  "persona": "texto curto (2-3 frases) escrito como se um amigo estivesse te zuando carinhosamente pelo seu gosto musical. Tom irônico e bem-humorado, linguagem informal e direta — como uma legenda de story, não um relatório. Exemplos de estilo: 'Você ouve Arctic Monkeys a tarde toda e chama isso de produtividade.' / 'Basicamente você é o cara que coloca uma playlist lo-fi e acha que tá meditando.' / 'Seu gosto musical tem mais camadas do que sua planilha de metas de ano novo.' Use os gêneros e o mood real do usuário pra escrever algo específico, não genérico, estilo Spotify Wrapped.",
  "analysis": {
    "main_genres": ["..."],
    "mood": "descrição curta do humor musical",
    "listener_type": "(OBRIGATÓRIO: use EXATAMENTE um destes valores) 'mainstream' | 'alternativo' | 'explorador' | 'eclético' | 'nostálgico' | 'underground' | 'festeiro' | 'melancólico'",
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
- músicas complexas ou lentas → baixo

listener_type (escolha UM):
- mainstream → ouve hits, artistas populares, charts
- alternativo → prefere indie, sons fora do mainstream
- explorador → sempre descobrindo gêneros e artistas novos
- eclético → mistura muitos gêneros diferentes
- nostálgico → gravita para clássicos e músicas de outras décadas
- underground → busca artistas nichados e pouco conhecidos
- festeiro → foco em festa, dança e energia alta
- melancólico → atraído por música emotiva e introspectiva`;

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
