import { prisma } from "../config/prisma";
import { Prisma, User } from "@prisma/client";

export async function findUserById(id: string): Promise<User>
{
    return prisma.user.findUniqueOrThrow({ where: { id } });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User>
{
    return prisma.user.update({ where: { id }, data });
}

export async function upsertUserBySpotifyId(
    spotifyId: string,
    data: Omit<Prisma.UserCreateInput, 'spotifyId'>
): Promise<User>
{
    return prisma.user.upsert({
        where: { spotifyId },
        update: data,
        create: { spotifyId, ...data },
    });
}
