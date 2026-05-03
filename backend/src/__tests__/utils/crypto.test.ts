import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../utils/crypto';

describe('encrypt', () => {
    it('returns a string with format iv:tag:encrypted (two colons)', () => {
        const result = encrypt('hello');
        const parts = result.split(':');
        expect(parts).toHaveLength(3);
        expect(parts[0]).toMatch(/^[0-9a-f]+$/);
        expect(parts[1]).toMatch(/^[0-9a-f]+$/);
        expect(parts[2]).toMatch(/^[0-9a-f]+$/);
    });

    it('produces different ciphertext on each call (random IV)', () => {
        const a = encrypt('same text');
        const b = encrypt('same text');
        expect(a).not.toBe(b);
    });
});

describe('decrypt', () => {
    it('round-trips a plain string', () => {
        expect(decrypt(encrypt('hello world'))).toBe('hello world');
    });

    it('round-trips an empty string', () => {
        expect(decrypt(encrypt(''))).toBe('');
    });

    it('round-trips unicode characters', () => {
        const text = 'música 🎵 eclético';
        expect(decrypt(encrypt(text))).toBe(text);
    });

    it('throws when given tampered data', () => {
        const encrypted = encrypt('secret');
        const parts = encrypted.split(':');
        parts[2] = parts[2].replace(/[0-9a-f]/, 'x'); // corrupt hex
        expect(() => decrypt(parts.join(':'))).toThrow();
    });
});

describe('encrypt / decrypt with missing ENCRYPTION_KEY', () => {
    it('throws at module load when ENCRYPTION_KEY is missing', async () => {
        const original = process.env.ENCRYPTION_KEY;
        delete process.env.ENCRYPTION_KEY;

        await expect(
            new Promise((resolve, reject) => {
                try {
                    const mod = require('../../utils/crypto');
                    resolve(mod);
                } catch (e) {
                    reject(e);
                }
            })
        ).rejects.toThrow();

        process.env.ENCRYPTION_KEY = original;
    });
});
