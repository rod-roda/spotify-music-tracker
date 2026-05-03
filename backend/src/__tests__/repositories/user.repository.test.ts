import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/prisma', () => ({
    prisma: {
        user: {
            findUniqueOrThrow: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

import { prisma } from '../../config/prisma';
import { findUserById, updateUser, upsertUserBySpotifyId } from '../../repositories/user.repository';

const mockPrisma = vi.mocked(prisma);

const fakeUser = {
    id: 'user-uuid',
    spotifyId: 'spotify123',
    displayName: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    accessToken: 'enc_access',
    refreshToken: 'enc_refresh',
    tokenExpiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('findUserById', () => {
    it('calls findUniqueOrThrow with correct where clause', async () => {
        mockPrisma.user.findUniqueOrThrow.mockResolvedValue(fakeUser);

        const result = await findUserById('user-uuid');

        expect(mockPrisma.user.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
        expect(result).toEqual(fakeUser);
    });

    it('propagates Prisma errors', async () => {
        mockPrisma.user.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        await expect(findUserById('bad-id')).rejects.toThrow('Not found');
    });
});

describe('updateUser', () => {
    it('calls update with correct where and data', async () => {
        const data = { displayName: 'Updated' };
        mockPrisma.user.update.mockResolvedValue({ ...fakeUser, displayName: 'Updated' });

        await updateUser('user-uuid', data);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-uuid' }, data });
    });

    it('propagates Prisma errors', async () => {
        mockPrisma.user.update.mockRejectedValue(new Error('DB error'));

        await expect(updateUser('bad-id', {})).rejects.toThrow('DB error');
    });
});

describe('upsertUserBySpotifyId', () => {
    it('calls upsert with where.spotifyId and correct create/update shapes', async () => {
        const data = {
            displayName: 'New User',
            email: 'new@example.com',
            avatarUrl: null,
            accessToken: 'enc_a',
            refreshToken: 'enc_r',
            tokenExpiresAt: new Date(),
        };
        mockPrisma.user.upsert.mockResolvedValue({ ...fakeUser, ...data });

        await upsertUserBySpotifyId('spotify123', data);

        expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
            where: { spotifyId: 'spotify123' },
            update: data,
            create: { spotifyId: 'spotify123', ...data },
        });
    });
});
