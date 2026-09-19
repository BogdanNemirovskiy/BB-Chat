// Shared helpers for the two Cloudinary endpoints. The leading underscore keeps
// Vercel from exposing this file as a route of its own.
import { createHash } from 'node:crypto';

export const env = {
    firebaseApiKey: process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
};

export const isConfigured = () => Object.values(env).every(Boolean);

// BS: Avatars get a deterministic id derived from the uid. Two things fall out
// of that: a new upload overwrites the old one instead of orphaning it in the
// account, and ownership becomes arithmetic rather than a database lookup —
// nobody can sign or delete an image that isn't keyed to their own uid.
export const avatarPublicId = (uid) => `bbchat/avatars/${uid}`;

// Exchanges a Firebase ID token for the uid it was actually issued to. Without
// this the endpoints would have to trust a uid sent by the caller.
export const resolveUid = async (idToken) => {
    if (!idToken) return null;

    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.firebaseApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.users?.[0]?.localId || null;
};

// Cloudinary's scheme: every signed parameter except file/api_key/resource_type,
// sorted by name, joined as k=v pairs, with the API secret appended before SHA-1.
export const sign = (params) => {
    const payload = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    return createHash('sha1').update(`${payload}${env.apiSecret}`).digest('hex');
};

export const guard = (request, response) => {
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return false;
    }
    if (!isConfigured()) {
        console.error('Cloudinary endpoints are not configured — check the env vars.');
        response.status(500).json({ error: 'Not configured' });
        return false;
    }
    return true;
};
