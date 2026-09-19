import { avatarPublicId, env, guard, resolveUid, sign } from './_lib.js';

// Issues a short-lived Cloudinary upload signature for the calling user's own
// avatar slot.
//
// Replaces the unsigned upload preset the app used to ship. An unsigned preset
// is a public write credential: its name sits in the JavaScript bundle, so
// anyone who reads the page source can upload anything into the Cloudinary
// account, as often as they like, with no account and no trace. Signing moves
// that decision server-side — the signature only ever covers `bbchat/avatars/
// <uid>`, so a caller can overwrite their own picture and nothing else.
export default async function handler(request, response) {
    if (!guard(request, response)) return;

    const uid = await resolveUid(request.body?.idToken);
    if (!uid) {
        return response.status(401).json({ error: 'Invalid token' });
    }

    // Signed here, not accepted from the caller. Every one of these is a term of
    // the contract the signature covers.
    const params = {
        invalidate: 'true',
        overwrite: 'true',
        public_id: avatarPublicId(uid),
        timestamp: Math.floor(Date.now() / 1000),
    };

    return response.status(200).json({
        ...params,
        signature: sign(params),
        apiKey: env.apiKey,
        cloudName: env.cloudName,
    });
}
