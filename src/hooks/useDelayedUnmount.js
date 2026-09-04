import { useEffect, useState } from 'react';

/**
 * Keeps a node in the DOM long enough for its exit animation to finish.
 *
 * BS: React unmounts on the same tick the condition flips, so `{open && <X/>}`
 * can never animate out — the element is already gone. This holds the node for
 * `exitMs` after `isOpen` goes false and flags it as closing meanwhile.
 *
 * @param {boolean} isOpen  desired visibility
 * @param {number}  exitMs  must match the exit duration in the stylesheet
 * @returns {{ mounted: boolean, closing: boolean }}
 */
export function useDelayedUnmount(isOpen, exitMs) {
    const [mounted, setMounted] = useState(isOpen);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setClosing(false);
            return;
        }

        if (!mounted) return;

        setClosing(true);
        const timer = setTimeout(() => {
            setMounted(false);
            setClosing(false);
        }, exitMs);

        return () => clearTimeout(timer);
    }, [isOpen, mounted, exitMs]);

    return { mounted, closing };
}
