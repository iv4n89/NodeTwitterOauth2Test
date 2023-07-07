import { PrismaClient, User } from '@prisma/client';
import { CookieOptions, Response } from 'express';
import { TwitterUser } from 'oauth2';
import jwt from 'jsonwebtoken';

export const CLIENT_URL = process.env.CLIENT_URL!;
export const SERVER_PORT = process.env.SERVER_PORT!;

export const prisma = new PrismaClient();

// step 3

export function upsertUser(twitterUser: TwitterUser) {
    return prisma.user.upsert({
        create: {
            username: twitterUser.username,
            id: twitterUser.id,
            name: twitterUser.name,
            type: 'twitter',
        },
        update: {
            id: twitterUser.id,
        },
        where: {
            id: twitterUser.id
        }
    });
}

export const JWT_SECRET = process.env.JWT_SECRET!;

export const COOKIE_NAME = 'oauth2_token';

const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
};

// step 4
export function addCookieToRes(res: Response, user: User, accessToken: string) {
    const { id, type } = user;
    const token = jwt.sign({
        id,
        accessToken,
        type,
    }, JWT_SECRET);
    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        expires: new Date(Date.now() + 7200 * 1000),
    });
}