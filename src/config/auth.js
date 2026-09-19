import {
    EmailAuthProvider,
    GithubAuthProvider,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    deleteUser,
    getRedirectResult,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    updatePassword,
    updateProfile
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { deleteAvatar, getAvatarPublicId, purgeUserData } from "./functions";

// BS: Firefox's dynamic state partitioning, Safari's ITP and ordinary pop-up
// blockers all reject the sign-in window before it ever reaches the provider.
// For these codes the redirect flow is a working substitute, not a real failure.
const POPUP_FALLBACK_CODES = [
    'auth/popup-blocked',
    'auth/operation-not-supported-in-this-environment',
    'auth/web-storage-unsupported',
];

const AUTH_ERROR_MESSAGES = {
    'auth/account-exists-with-different-credential':
        'An account already exists with this email. Sign in with the provider you used the first time.',
    'auth/email-already-in-use': 'This email is already in use.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for this app.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled before it finished.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled before it finished.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/unauthorized-domain': 'This site is not authorised for sign-in yet.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'app/demo-account': 'The shared demo account cannot be deleted.',
    'app/password-required': 'Enter your password to confirm.',
    'app/not-authenticated': 'You are not signed in.',
};

export const authErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    if (!error) return null;
    return AUTH_ERROR_MESSAGES[error.code] || fallback;
};

const googleProvider = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
};

const githubProvider = () => {
    const provider = new GithubAuthProvider();
    // BS: without this scope GitHub withholds the address of anyone whose email
    // is private, and the profile document lands with email: null.
    provider.addScope('user:email');
    return provider;
};

// BS: The email address is stored in a subcollection only its owner can read.
// The public profile document has to stay readable by every signed-in user —
// chat lists, avatars and user search all need it — so anything that isn't meant
// for them cannot live in it.
export const writeContactEmail = (uid, email) =>
    setDoc(doc(db, 'users', uid, 'private', 'contact'), { email: email || null });

// BS: runs *after* Firebase has already authenticated the user, so it must never
// fail the sign-in — a rejected write here would report "sign-in failed" on a
// session that is actually live.
const ensureUserProfile = async (user) => {
    try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) return;

        await setDoc(userRef, {
            userName: user.displayName || user.email?.split('@')[0] || `User_${user.uid.slice(0, 6)}`,
            createdAt: new Date(),
            providerId: user.providerData[0]?.providerId || null,
            photoURL: user.photoURL || null,
        });

        await writeContactEmail(user.uid, user.email);
    } catch (error) {
        console.error('Could not create the user profile document:', error);
    }
};

const signInWithProvider = async (provider) => {
    try {
        const { user } = await signInWithPopup(auth, provider);
        await ensureUserProfile(user);
        return { user, error: null, redirecting: false };
    } catch (error) {
        if (!POPUP_FALLBACK_CODES.includes(error.code)) {
            console.error('Provider sign-in error:', error.code, error.message);
            return { user: null, error, redirecting: false };
        }

        try {
            await signInWithRedirect(auth, provider);
            // BS: the browser is navigating away — the result is picked up by
            // completeProviderRedirect() on the next load.
            return { user: null, error: null, redirecting: true };
        } catch (redirectError) {
            console.error('Redirect sign-in error:', redirectError.code, redirectError.message);
            return { user: null, error: redirectError, redirecting: false };
        }
    }
};

export const doSignInWithGoogle = () => signInWithProvider(googleProvider());

export const doSignInWithGitHub = () => signInWithProvider(githubProvider());

// BS: must settle before the app decides nobody is signed in, otherwise a user
// coming back from the redirect flow is bounced to /signin.
export const completeProviderRedirect = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (!result) return { user: null, error: null };

        await ensureUserProfile(result.user);
        return { user: result.user, error: null };
    } catch (error) {
        console.error('Redirect sign-in error:', error.code, error.message);
        return { user: null, error };
    }
};

export const doCreateUserWithEmailAndPassword = async (email, password, userName) => {
    if (!userName) {
        return { user: null, error: { code: 'app/username-required', message: 'Username is required.' } };
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: userName
        });

        await setDoc(doc(db, 'users', user.uid), {
            userName: userName,
            createdAt: new Date()
        });

        await writeContactEmail(user.uid, email);

        return { user, error: null };
    } catch (error) {
        console.error("Error creating user:", error);
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

export const doPasswordChange = async (password) => {
    return updatePassword(auth.currentUser, password)
};

const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL;

// BS: Firebase refuses to delete an account on a stale session, and it only says
// so at the very last step. Re-authenticating up front means we never reach the
// state where the data is already gone but the account survives.
const reauthenticate = async (user, password) => {
    const providerId = user.providerData[0]?.providerId || 'password';

    if (providerId === 'google.com') {
        return reauthenticateWithPopup(user, googleProvider());
    }
    if (providerId === 'github.com') {
        return reauthenticateWithPopup(user, githubProvider());
    }

    if (!password) {
        // BS: carries a `code` like every other error on this path, so the one
        // authErrorMessage() lookup in the UI covers it too.
        const error = new Error('Enter your password to confirm.');
        error.code = 'app/password-required';
        throw error;
    }
    return reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
};

export const requiresPasswordToDelete = () => {
    const providerId = auth.currentUser?.providerData[0]?.providerId || 'password';
    return providerId === 'password';
};

export const isDemoAccount = () =>
    Boolean(DEMO_EMAIL) && auth.currentUser?.email === DEMO_EMAIL;

// Erasure (GDPR Art. 17). Order matters and is not cosmetic:
//   1. re-authenticate  — so step 4 cannot fail after the data is gone
//   2. drop the avatar  — best effort, and before the profile doc it is proven against
//   3. purge Firestore  — needs the account still signed in to pass the rules
//   4. delete the account
export const doDeleteAccount = async (password) => {
    const user = auth.currentUser;

    if (!user) {
        return { error: { code: 'app/not-authenticated' } };
    }
    if (isDemoAccount()) {
        return { error: { code: 'app/demo-account' } };
    }

    try {
        await reauthenticate(user, password);
    } catch (error) {
        console.error('Re-authentication before deletion failed:', error.code);
        return { error };
    }

    try {
        await deleteAvatar(await getAvatarPublicId(user.uid));
        await purgeUserData(user.uid);
        await deleteUser(user);
        return { error: null };
    } catch (error) {
        console.error('Account deletion failed:', error.code, error.message);
        return { error };
    }
};
