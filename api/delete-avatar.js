import { avatarPublicId, env, guard, resolveUid, sign } from './_lib.js';

// Deletes a user's profile picture from Cloudinary as part of account erasure.
//
// This cannot happen in the browser: destroying an asset requires the API
// secret, and anything shipped to the client is public.
//
// Ownership is checked two ways, because avatar URLs are visible to every
// signed-in user and would otherwise make this endpoint a one-click way to
// vandalise other people's profiles:
//   - the id matches this uid's deterministic avatar slot, or
//   - the uid's own profile document still names it in photoPublicId, which
//     covers pictures uploaded before signed uploads existed.
const ownsLegacyAvatar = async (uid, idToken, publicId) => {
    const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${env.firebaseProjectId}/databases/(default)/documents/users/${uid}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
    );

    if (!response.ok) return false;
    const data = await response.json();
    return data.fields?.photoPublicId?.stringValue === publicId;
};

const destroy = async (publicId) => {
    const params = { invalidate: 'true', public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };

    const form = new URLSearchParams({
        ...params,
        api_key: env.apiKey,
        signature: sign(params),
    });

    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/image/destroy`, {
        method: 'POST',
        body: form,
    });

    const data = await response.json();
    // Cloudinary answers 200 with result:"not found" for an id that is already
    // gone. For erasure that is the desired end state, so it counts as success.
    return response.ok && (data.result === 'ok' || data.result === 'not found');
};

export default async function handler(request, response) {
    if (!guard(request, response)) return;

    const { idToken, publicId } = request.body || {};
    if (!idToken || !publicId) {
        return response.status(400).json({ error: 'Missing idToken or publicId' });
    }

    const uid = await resolveUid(idToken);
    if (!uid) {
        return response.status(401).json({ error: 'Invalid token' });
    }

    const owned =
        publicId === avatarPublicId(uid) || (await ownsLegacyAvatar(uid, idToken, publicId));

    if (!owned) {
        return response.status(403).json({ error: 'Not your image' });
    }

    if (!(await destroy(publicId))) {
        return response.status(502).json({ error: 'Cloudinary rejected the delete' });
    }

    return response.status(200).json({ deleted: true });
}
