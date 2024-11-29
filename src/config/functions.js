import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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


