// BS: One-off seeding/reset tool for the public "Try Demo" account. Run with
// `npm run seed:demo` (add --reset to wipe the demo conversation and rebuild it).
// Self-contained rather than importing src/config — that tree is compiled by CRA
// and shouldn't have to stay Node-runnable. It signs in as each demo account in
// turn, because firestore.rules requires message.senderId == request.auth.uid.
import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

const DEMO_USER = {
    email: process.env.REACT_APP_DEMO_EMAIL,
    password: process.env.REACT_APP_DEMO_PASSWORD,
    userName: 'Demo User',
};

// BS: Deliberately not REACT_APP_-prefixed — this account backs the seeded
// conversation and must never be baked into the public frontend bundle.
const DEMO_FRIEND = {
    email: process.env.DEMO_FRIEND_EMAIL,
    password: process.env.DEMO_FRIEND_PASSWORD,
    userName: 'Alex Rivera',
};

const CONVERSATION = [
    { from: 'friend', text: 'Hey! 👋 Welcome to BB Chat.' },
    { from: 'friend', text: 'This is a live demo account — everything you see here is the real app, not a mockup.' },
    { from: 'user', text: 'Nice! What can I try?' },
    { from: 'friend', text: 'Send a message, drop in an emoji 😄, or upload an image. It all syncs in real time.' },
    { from: 'friend', text: 'One heads-up: this account is shared with everyone visiting the demo, so please don\'t post anything personal.' },
];

function requireEnv() {
    const missing = [
        ['REACT_APP_DEMO_EMAIL', DEMO_USER.email],
        ['REACT_APP_DEMO_PASSWORD', DEMO_USER.password],
        ['DEMO_FRIEND_EMAIL', DEMO_FRIEND.email],
        ['DEMO_FRIEND_PASSWORD', DEMO_FRIEND.password],
    ].filter(([, value]) => !value).map(([name]) => name);

    if (missing.length) {
        console.error(`Missing env vars in .env: ${missing.join(', ')}`);
        process.exit(1);
    }
}

const app = initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureAccount({ email, password, userName }) {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: userName });
        await setDoc(doc(db, 'users', user.uid), {
            userName,
            createdAt: new Date(),
        });
        // BS: mirrors src/config/auth.js — the email never goes in the public
        // profile document, which every signed-in user can read.
        await setDoc(doc(db, 'users', user.uid, 'private', 'contact'), { email });
        console.log(`Created ${userName} (${email})`);
        return user.uid;
    } catch (error) {
        if (error.code !== 'auth/email-already-in-use') throw error;
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Reusing existing ${userName} (${email})`);
        return user.uid;
    }
}

async function findDemoChat(userUid, friendUid) {
    const snapshot = await getDocs(
        query(collection(db, 'chats'), where('userIds', 'array-contains', userUid))
    );
    return snapshot.docs.find((chat) => chat.data().userIds?.includes(friendUid)) || null;
}

async function seed() {
    requireEnv();
    const reset = process.argv.includes('--reset');

    const userUid = await ensureAccount(DEMO_USER);
    const friendUid = await ensureAccount(DEMO_FRIEND);

    await signInWithEmailAndPassword(auth, DEMO_USER.email, DEMO_USER.password);
    let chat = await findDemoChat(userUid, friendUid);

    if (chat && reset) {
        // BS: firestore.rules allows deleting a chat but not individual messages, so a
        // reset drops the whole chat doc. Its messages subcollection is orphaned and
        // becomes unreadable (the rules' parent-chat lookup fails), which is good enough.
        await deleteDoc(doc(db, 'chats', chat.id));
        console.log(`Reset: removed chat ${chat.id}`);
        chat = null;
    }

    if (chat) {
        console.log(`Demo chat already exists (${chat.id}) — pass --reset to rebuild it.`);
    } else {
        const created = await addDoc(collection(db, 'chats'), {
            userIds: [userUid, friendUid],
            chat_name: `${DEMO_USER.userName} & ${DEMO_FRIEND.userName}`,
            is_group_chat: false,
            createdAt: new Date(),
        });

        const start = Date.now() - CONVERSATION.length * 60_000;
        let signedInAs = DEMO_USER.email;

        for (const [index, message] of CONVERSATION.entries()) {
            const sender = message.from === 'user' ? DEMO_USER : DEMO_FRIEND;
            if (signedInAs !== sender.email) {
                await signInWithEmailAndPassword(auth, sender.email, sender.password);
                signedInAs = sender.email;
            }

            await addDoc(collection(db, 'chats', created.id, 'messages'), {
                text: message.text,
                createdAt: Timestamp.fromMillis(start + index * 60_000),
                senderId: message.from === 'user' ? userUid : friendUid,
                displayName: sender.userName,
                photoURL: null,
            });
        }

        const last = CONVERSATION[CONVERSATION.length - 1];
        await updateDoc(doc(db, 'chats', created.id), {
            lastMessage: last.text,
            lastMessageTime: Timestamp.fromMillis(start + (CONVERSATION.length - 1) * 60_000),
            lastMessageSenderId: last.from === 'user' ? userUid : friendUid,
        });

        console.log(`Seeded chat ${created.id} with ${CONVERSATION.length} messages.`);
    }

    await signOut(auth);

    console.log('\nPaste these UIDs into firestore.rules (isDemoAccount):');
    console.log(`  DEMO_USER_UID   = ${userUid}`);
    console.log(`  DEMO_FRIEND_UID = ${friendUid}`);
}

seed().then(
    () => process.exit(0),
    (error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
);
