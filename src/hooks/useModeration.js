import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { setUserBlocked, submitUserReport } from '../config/functions';
import { useAuth } from '../context/authContext';

const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL;

/**
 * Block list + reporting for the signed-in user.
 *
 * BS: The demo account is shared by every visitor, so its blocks and reports are
 * kept in this browser session instead of Firestore — otherwise one visitor
 * blocking the demo partner would leave the chat empty for everyone after them.
 */
export function useModeration() {
    const { currentUser } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState([]);

    const isDemo = Boolean(DEMO_EMAIL) && currentUser?.email === DEMO_EMAIL;

    useEffect(() => {
        if (!currentUser?.uid || isDemo) return;

        return onSnapshot(
            doc(db, 'users', currentUser.uid),
            (snapshot) => setBlockedUsers(snapshot.data()?.blockedUsers || []),
            (error) => console.error('Error watching block list:', error)
        );
    }, [currentUser?.uid, isDemo]);

    const isBlocked = useCallback(
        (uid) => Boolean(uid) && blockedUsers.includes(uid),
        [blockedUsers]
    );

    const setBlocked = useCallback(
        async (uid, blocked) => {
            if (isDemo) {
                setBlockedUsers((prev) =>
                    blocked ? [...prev, uid] : prev.filter((id) => id !== uid)
                );
                return;
            }

            await setUserBlocked(uid, blocked);
        },
        [isDemo]
    );

    const reportUser = useCallback(
        async (report) => {
            if (isDemo) return;
            await submitUserReport(report);
        },
        [isDemo]
    );

    return { blockedUsers, isBlocked, setBlocked, reportUser };
}
