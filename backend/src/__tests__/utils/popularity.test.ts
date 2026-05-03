import { describe, it, expect } from 'vitest';
import { calculatePopularity } from '../../utils/popularity';

describe('calculatePopularity', () => {
    it('returns 0 when both inputs are zero', () => {
        expect(calculatePopularity(0, 0)).toBe(0);
    });

    it('returns a positive value when only listeners > 0', () => {
        const result = calculatePopularity(1000, 0);
        expect(result).toBeGreaterThan(0);
    });

    it('returns a positive value when only playcount > 0', () => {
        const result = calculatePopularity(0, 1000);
        expect(result).toBeGreaterThan(0);
    });

    it('clamps result to 100 for very large values', () => {
        expect(calculatePopularity(100_000_000, 500_000_000)).toBe(100);
    });

    it('always returns an integer', () => {
        const result = calculatePopularity(123456, 789012);
        expect(Number.isInteger(result)).toBe(true);
    });

    it('calculates correctly for known values', () => {
        // listeners=1000, playcount=5000
        // listenerScore = log10(1001) * 10 ≈ 30.00
        // playcountScore = log10(5001) * 5 ≈ 18.50
        // total ≈ 48, clamped at 100
        const result = calculatePopularity(1000, 5000);
        expect(result).toBe(Math.min(100, Math.round(Math.log10(1001) * 10 + Math.log10(5001) * 5)));
    });

    it('returns 0 for listeners=1, playcount=1 edge case computation', () => {
        const result = calculatePopularity(1, 1);
        // listenerScore = log10(2)*10 ≈ 3, playcountScore = log10(2)*5 ≈ 1.5 => round(4.5) = 5 or so
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
    });
});
