import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Sentinel that replaces a deleted account's uid on messages it already sent.
// Must stay in sync with firestore.rules, which only permits an anonymising
// update when the new senderId is exactly this value.
export const DELETED_SENDER_ID = 'deleted';
export const DELETED_SENDER_NAME = 'Deleted user';

export const getUserData = async () => {
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            throw new Error("User not authenticated");
        }

        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.error('No such document!');
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
};


export const getUserChats = async () => {
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            console.warn("User is not authenticated.");
            return [];
        }

        const chatsCollection = collection(db, "chats");

        const q = query(chatsCollection, where("userIds", "array-contains", uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        const userChats = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return userChats;
    } catch (error) {
        console.error("Error fetching user chats:", error);
        throw new Error("Unable to fetch user chats. Please try again later.");
    }
};


export const getUserProfile = async (uid) => {
    if (!uid) return null;

    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};


// BS: The block list lives in the owner-only subcollection, not on the profile
// document. On the profile it was readable by every signed-in account —
// including, pointedly, the people on it.
export const moderationRef = (uid) => doc(db, 'users', uid, 'private', 'moderation');

export const setUserBlocked = async (targetUid, blocked) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");
    if (!targetUid) throw new Error("No user to block");

    // setDoc/merge rather than updateDoc: the document does not exist until the
    // first block, and updateDoc would reject that.
    await setDoc(
        moderationRef(uid),
        { blockedUsers: blocked ? arrayUnion(targetUid) : arrayRemove(targetUid) },
        { merge: true }
    );
};


export const submitUserReport = async ({ reportedUserId, reason, details = '', chatId = null }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");
    if (!reportedUserId || !reason) throw new Error("Missing report details");

    await addDoc(collection(db, 'reports'), {
        reporterId: uid,
        reportedUserId,
        reason,
        details: details.trim().slice(0, 1000),
        chatId,
        createdAt: serverTimestamp(),
    });
};


export const handleSaveToFirestore = async (currentUserUid, updatedInfo) => {
    try {
        const userDoc = doc(db, 'users', currentUserUid);
        await updateDoc(userDoc, updatedInfo)

    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// BS: The owner's own email lives outside the public profile document, so it
// needs its own read. Returns null when the document predates that split.
export const getContactEmail = async (uid) => {
    if (!uid) return null;

    const snapshot = await getDoc(doc(db, 'users', uid, 'private', 'contact'));
    return snapshot.exists() ? snapshot.data().email ?? null : null;
};


export const getAvatarPublicId = async (uid) => {
    if (!uid) return null;

    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? snapshot.data().photoPublicId || null : null;
};


// Erasure, Firestore half. Messages are anonymised rather than deleted: the
// other participant's side of the conversation stays readable, but nothing in it
// points back to a person who asked to be forgotten.
export const purgeUserData = async (uid) => {
    if (!uid) throw new Error("User not authenticated");

    const chats = await getDocs(
        query(collection(db, 'chats'), where('userIds', 'array-contains', uid))
    );

    // BS: Firestore caps a batch at 500 writes, and a long-running conversation
    // can hold more than that from one person — chunking is what keeps erasure
    // working on exactly the accounts that most need it.
    const BATCH_LIMIT = 500;

    for (const chat of chats.docs) {
        const sent = await getDocs(
            query(collection(db, 'chats', chat.id, 'messages'), where('senderId', '==', uid))
        );

        for (let index = 0; index < sent.docs.length; index += BATCH_LIMIT) {
            const batch = writeBatch(db);
            sent.docs.slice(index, index + BATCH_LIMIT).forEach((message) => {
                batch.update(message.ref, {
                    senderId: DELETED_SENDER_ID,
                    displayName: DELETED_SENDER_NAME,
                    photoURL: null,
                });
            });
            await batch.commit();
        }

        if (chat.data().lastMessageSenderId === uid) {
            await updateDoc(chat.ref, { lastMessageSenderId: DELETED_SENDER_ID });
        }
    }

    await deleteDoc(doc(db, 'users', uid, 'private', 'contact'));
    await deleteDoc(moderationRef(uid));
    await deleteDoc(doc(db, 'users', uid));
};


// Erasure, Cloudinary half. Destroying an asset needs the API secret, which can
// never reach the browser, so it goes through the /api/delete-avatar function.
// Runs *before* the profile document is purged: the endpoint proves the caller
// owns the image by reading photoPublicId off that very document.
// Deliberately best effort — a missing endpoint (local `npm start`, or the
// Cloudinary env vars not set) must not leave an account half-deleted. Anything
// left behind is reported so it can be cleared by hand.
export const deleteAvatar = async (photoPublicId) => {
    if (!photoPublicId) return true;

    try {
        const response = await fetch('/api/delete-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicId: photoPublicId,
                idToken: await auth.currentUser.getIdToken(),
            }),
        });

        if (!response.ok) throw new Error(`avatar delete failed: ${response.status}`);
        return true;
    } catch (error) {
        console.error('Could not delete the stored avatar:', error.message);
        return false;
    }
};
