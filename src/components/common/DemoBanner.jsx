import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import classes from './DemoBanner.module.sass';

const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL;
const VISIBLE_MS = 4000;
const FADE_MS = 300;

export default function DemoBanner() {
    const { currentUser } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);

    const isDemo = DEMO_EMAIL && currentUser?.email === DEMO_EMAIL;

    useEffect(() => {
        if (!isDemo) return;

        const fade = setTimeout(() => setFadingOut(true), VISIBLE_MS);
        const remove = setTimeout(() => setDismissed(true), VISIBLE_MS + FADE_MS);

        return () => {
            clearTimeout(fade);
            clearTimeout(remove);
        };
    }, [isDemo]);

    if (dismissed || !isDemo) return null;

    return (
        <div className={`${classes.banner} ${fadingOut ? classes.fading_out : ''}`}>
            <p>Shared demo account — please don't post anything personal.</p>
            <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss demo notice">
                ×
            </button>
        </div>
    );
}
