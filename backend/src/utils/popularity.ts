export function calculatePopularity(listeners: number, playcount: number): number
{
    if (listeners === 0 && playcount === 0) return 0;

    const listenerScore = Math.log10(listeners + 1) * 10;
    const playcountScore = Math.log10(playcount + 1) * 5;

    return Math.min(100, Math.round(listenerScore + playcountScore));
}
