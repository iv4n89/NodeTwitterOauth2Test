import axios from "axios";
import { CLIENT_URL, prisma, addCookieToRes, upsertUser } from "./config";
import { Request, Response } from "express";

const TWITTER_OAUTH_CLIENT_ID = 'al9oamFqdldzRjFrTXRrak56dm06MTpjaQ';
const TWITTER_OAUTH_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

const TWITTER_OAUTH_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

const BasicAuthToken = Buffer.from(`${TWITTER_OAUTH_CLIENT_ID}:${TWITTER_OAUTH_CLIENT_SECRET}`, 'utf-8').toString('base64');

export const twitterOauthTokenParams = {
    client_id: TWITTER_OAUTH_CLIENT_ID,
    code_verifier: '8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA',
    redirect_uri: 'http://www.localhost:3001/oauth/twitter',
    grant_type: 'authorization_code',
};

type TwitterTokenResponse = {
    token_type: 'bearer';
    expires_in: 7200;
    access_token: string;
    scope: string;
}

export async function getTwitterOAuthToken(code: string) {
    try {
        const res = await axios.post<TwitterTokenResponse>(
            TWITTER_OAUTH_TOKEN_URL,
            new URLSearchParams({ ...twitterOauthTokenParams, code }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${BasicAuthToken}`,
                }
            }
        );

        return res.data;
    } catch (err) {
        return null;
    }
}

export interface TwitterUser {
    id: string;
    name: string;
    username: string;
}

export async function getTwitterUser(accessToken: string): Promise<TwitterUser | null> {
    try {
        const res = await axios.get<{ data: TwitterUser }>('https://api.twitter.com/2/users/me', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return res.data.data ?? null;
    } catch (err) {
        return null;
    }
}

export async function twitterOauth(req: Request<any, any, any, {code: string}>, res: Response) {
    const code = req.query.code;

    // 1. Get the access token with code
    const TwitterOAuthToken = await getTwitterOAuthToken(code);
    console.log('token', TwitterOAuthToken);

    if (!TwitterOAuthToken) {
        return res.redirect(CLIENT_URL);
    }

    // 2. Get the twitter user using the access token
    const twitterUser = await getTwitterUser(TwitterOAuthToken.access_token);
    console.log('user', twitterUser);

    if (!twitterUser) {
        return res.redirect(CLIENT_URL);
    }

    // 3. Upsert the user in our db
    const user = await upsertUser(twitterUser);

    // 4. Create cookie so that the server can validate the user
    addCookieToRes(res, user, TwitterOAuthToken.access_token);

    // 5. Finally redirect to the client
    return res.redirect(CLIENT_URL);
}