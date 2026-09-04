import { useState } from 'react';
import classes from './Avatar.module.sass';

// Small, lively palette for initial-based fallback avatars.
// Deliberately avoids the yellow accent so avatars read as their own thing.
const PALETTE = [
    '#5b8def', // blue
    '#2dce98', // green
    '#f5365c', // red
    '#11cdef', // cyan
    '#fb6340', // orange
    '#8965e0', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
];

// Stable hash → palette index, so a given name always gets the same color.
function colorFromString(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length];
}

/**
 * Avatar
 * - Renders the user's photo when `photoURL` is set.
 * - Otherwise renders a colored circle with the first initial of `name`.
 * - Fills its parent by default; pass `size` (px) to size it explicitly.
 *   The initial scales to the circle via `cqmin`, so responsive wrappers work.
 */
export default function Avatar({ name, photoURL, size, className = '' }) {
    // BS: Tracks which src finished loading rather than a boolean, so swapping
    // photoURL re-arms the fade instead of showing the new image instantly.
    const [loadedSrc, setLoadedSrc] = useState(null);

    const label = name ? `${name}'s avatar` : 'User avatar';
    const sizeStyle = size ? { width: size, height: size } : undefined;
    const rootClass = `${classes.avatar} ${className}`.trim();

    if (photoURL) {
        return (
            <div className={rootClass} style={sizeStyle}>
                <img
                    src={photoURL}
                    alt={label}
                    className={loadedSrc === photoURL ? classes.loaded : ''}
                    // BS: A cached image can finish loading before React attaches
                    // onLoad. Without the `complete` check the avatar would sit at
                    // opacity 0 forever, so the ref is the safety net, not a nicety.
                    ref={(node) => {
                        if (node?.complete) setLoadedSrc(photoURL);
                    }}
                    onLoad={() => setLoadedSrc(photoURL)}
                    onError={() => setLoadedSrc(photoURL)}
                />
            </div>
        );
    }

    const initial = (name?.trim()?.[0] || '?').toUpperCase();

    return (
        <div
            className={rootClass}
            style={{ ...sizeStyle, backgroundColor: colorFromString(name || '') }}
            role="img"
            aria-label={label}
        >
            <span className={classes.initial}>{initial}</span>
        </div>
    );
}
