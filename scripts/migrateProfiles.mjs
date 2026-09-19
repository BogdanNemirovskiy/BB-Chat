// BS: One-off migration for profile documents written before the data
// minimisation pass. It does three things to every document in `users`:
//
//   1. moves `email` into users/{uid}/private/contact, which only its owner can
//      read — in the public profile it was visible to every signed-in account;
//   2. moves `blockedUsers` into users/{uid}/private/moderation, for the same
//      reason: a block list on a world-readable document is visible to the
//      people on it;
//   3. deletes `address` and `DOB`, which the app no longer collects;
//   4. resolves the legacy `photoUrl` key (lowercase "u"). The app has always
//      read `photoURL`, so a profile carrying only the typo has had an
//      invisible avatar — promote it. Where both exist the typo is stale
//      leftover, so drop it;
//   5. leaves everything else untouched.
//
// RUN THIS BEFORE DEPLOYING firestore.rules. The new rules whitelist the fields
// a profile may contain, so any document still carrying the old ones is frozen —
// its owner cannot save their profile until this has run.
//
// Runs as an admin, because no signed-in user may touch another user's profile.
// Set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file
// (Firebase console > Project settings > Service accounts > Generate new key).
//
//   npm install                       # picks up firebase-admin
//   node scripts/migrateProfiles.mjs          # dry run, changes nothing
//   node scripts/migrateProfiles.mjs --apply  # writes
import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const apply = process.argv.includes('--apply');
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file.');
    process.exit(1);
}

initializeApp({
    credential: keyPath ? cert(JSON.parse(readFileSync(keyPath, 'utf8'))) : applicationDefault(),
});

const db = getFirestore();

const STALE_FIELDS = ['address', 'DOB'];

// BS: the new rules whitelist profile fields, so this key is not merely untidy —
// left in place it would freeze these documents against every future write.
const LEGACY_PHOTO_FIELD = 'photoUrl';

async function migrate() {
    const snapshot = await db.collection('users').get();

    let moved = 0;
    let stripped = 0;
    let skipped = 0;

    for (const profile of snapshot.docs) {
        const data = profile.data();
        const hasEmail = typeof data.email === 'string' && data.email.length > 0;
        const hasBlocks = Array.isArray(data.blockedUsers);
        const stale = STALE_FIELDS.filter((field) => field in data);
        const legacyPhoto = data[LEGACY_PHOTO_FIELD];
        const hasLegacyPhoto = typeof legacyPhoto === 'string' && legacyPhoto.length > 0;
        // Only promote when the correct key is empty; otherwise it is stale.
        const promotePhoto = hasLegacyPhoto && !data.photoURL;

        if (!hasEmail && !hasBlocks && !hasLegacyPhoto && stale.length === 0) {
            skipped += 1;
            continue;
        }

        const changes = [];
        if (hasEmail) changes.push('email → private/contact');
        if (hasBlocks) changes.push('blockedUsers → private/moderation');
        if (promotePhoto) changes.push('photoUrl → photoURL (avatar was not rendering)');
        else if (hasLegacyPhoto) changes.push('drop stale photoUrl');
        if (stale.length) changes.push(`drop ${stale.join(', ')}`);
        console.log(`${profile.id}: ${changes.join('; ')}`);

        if (!apply) continue;

        // merge: never clobber a private document that is already correct.
        if (hasEmail) {
            await profile.ref
                .collection('private')
                .doc('contact')
                .set({ email: data.email }, { merge: true });
            moved += 1;
        }

        if (hasBlocks) {
            await profile.ref
                .collection('private')
                .doc('moderation')
                .set({ blockedUsers: data.blockedUsers }, { merge: true });
            moved += 1;
        }

        const updates = {};
        if (hasEmail) updates.email = FieldValue.delete();
        if (hasBlocks) updates.blockedUsers = FieldValue.delete();
        if (promotePhoto) updates.photoURL = legacyPhoto;
        if (hasLegacyPhoto) updates[LEGACY_PHOTO_FIELD] = FieldValue.delete();
        stale.forEach((field) => { updates[field] = FieldValue.delete(); });

        await profile.ref.update(updates);
        if (stale.length || hasLegacyPhoto) stripped += 1;
    }

    console.log(
        apply
            ? `\nDone. ${moved} field(s) moved to private, ${stripped} profile(s) stripped, ${skipped} already clean.`
            : `\nDry run — nothing was written. ${skipped} profile(s) already clean. Re-run with --apply.`
    );
}

migrate().then(
    () => process.exit(0),
    (error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }
);
