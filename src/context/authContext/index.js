import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../config/firebaseConfig";
import { completeProviderRedirect } from "../../config/auth";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [redirectChecked, setRedirectChecked] = useState(false);
    const [redirectError, setRedirectError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthReady(true);
        });

        return unsubscribe;
    }, []);

    // BS: a user returning from signInWithRedirect is not signed in yet when the
    // first onAuthStateChanged fires, so rendering before this settles would send
    // them straight back to /signin.
    useEffect(() => {
        let active = true;

        completeProviderRedirect()
            .then(({ error }) => {
                if (active && error) setRedirectError(error);
            })
            .finally(() => {
                if (active) setRedirectChecked(true);
            });

        return () => { active = false; };
    }, []);

    const loading = !authReady || !redirectChecked;

    const value = {
        currentUser,
        userLoggedIn: !!currentUser,
        loading,
        redirectError,
        clearRedirectError: () => setRedirectError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
