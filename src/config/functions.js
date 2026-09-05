import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const getUserData = async () => {
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            throw new Error("User not authenticated");
        }

        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log('Document data:', docSnap.data());
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
            console.log("No chats found for the user.");
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


// BS: The block list lives on the blocker's own profile document, which is the
// only user document Firestore rules let them write.
export const setUserBlocked = async (targetUid, blocked) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");
    if (!targetUid) throw new Error("No user to block");

    await updateDoc(doc(db, 'users', uid), {
        blockedUsers: blocked ? arrayUnion(targetUid) : arrayRemove(targetUid),
    });
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