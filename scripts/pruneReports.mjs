// BS: Storage limitation (GDPR Art. 5(1)(e)) for the `reports` collection.
// The privacy notice promises reports are kept for at most 12 months; this is
// what makes that true rather than aspirational. Reports name both the reporter
// and the reported user, so "keep forever" is the one option that isn't
// defensible.
//
// Runs as an admin: firestore.rules denies every client read and delete on
// reports, deliberately, so this cannot be done from the app.
//
//   node scripts/pruneReports.mjs           # dry run, changes nothing
//   node scripts/pruneReports.mjs --apply   # deletes
//
// Not scheduled anywhere — run it periodically, or wire it to a cron job.
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const RETENTION_DAYS = 365;

const apply = process.argv.includes('--apply');
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file.');
    process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });

const db = getFirestore();

async function prune() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expired = await db
        .collection('reports')
        .where('createdAt', '<', cutoff)
        .get();

    if (expired.empty) {
        console.log(`Nothing older than ${RETENTION_DAYS} days. Nothing to do.`);
        return;
    }

    console.log(`${expired.size} report(s) older than ${cutoff.toISOString().slice(0, 10)}:`);
    expired.docs.forEach((report) => console.log(`  ${report.id}`));

    if (!apply) {
        console.log('\nDry run — nothing was deleted. Re-run with --apply.');
        return;
    }

    // Batched: one round trip per 500 documents rather than per document.
    for (let index = 0; index < expired.docs.length; index += 500) {
        const batch = db.batch();
        expired.docs.slice(index, index + 500).forEach((report) => batch.delete(report.ref));
        await batch.commit();
    }

    console.log(`\nDeleted ${expired.size} expired report(s).`);
}

prune().then(
    () => process.exit(0),
    (error) => {
        console.error('Prune failed:', error);
        process.exit(1);
    }
);
