import {
    OAuthProvider,
    GithubAuthProvider,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    updatePassword,
    updateProfile,
    getAuth
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";


export const doCreateUserWithEmailAndPassword = async (email, password, userName) => {
    if (!userName) {
        throw new Error("Username is required.");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: userName
        });

        console.log("Attempting to write to Firestore...");

        await setDoc(doc(db, 'users', user.uid), {
            userName: userName,
            email: email,
            createdAt: new Date()
        });

        console.log("User created and additional data saved in Firestore!");
        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};


export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            await setDoc(userRef, {
                userName: user.displayName || "User_" + user.uid,
                email: user.email,
                createdAt: new Date(),
                providerId: user.providerData[0].providerId,
                photoURL: user.photoURL,
            });
            console.log("New Google user added to Firestore.");
        } else {
            console.log("User already exists in Firestore.");
        }

        console.log(user);


        return { user, error: null };
    } catch (error) {
        console.error("GitHub sign-in error:", error.message);
        return { user: null, error };
    }
};

export const doSignInWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            await setDoc(userRef, {
                userName: user.displayName || "User_" + user.uid,
                email: user.email,
                createdAt: new Date(),
                providerId: user.providerData[0].providerId,
                photoURL: user.photoURL,
            });
            console.log("New GitHub user added to Firestore.");
        } else {
            console.log("User already exists in Firestore.");
        }

        return { user, error: null };
    } catch (error) {
        console.error("GitHub sign-in error:", error.message);
        return { user: null, error };
    }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        console.error("Email/password sign-in error:", error.message);
        return { user: null, error };
    }
};

export const doSignOut = async () => {
    return auth.signOut();
};

export const doPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
};

export const doPasswrodChange = async (password) => {
    return updatePassword(auth.currentUser, password)
};

export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/home`
    });
};
