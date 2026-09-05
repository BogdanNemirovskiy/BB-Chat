import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import classes from './Modal.module.sass';

export default function Modal({ title, onClose, children }) {
    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // BS: Portalled to <body> so the dialog escapes the chat header's rounded
    // overflow and its shadow stacking context.
    return createPortal(
        <div
            className={classes.backdrop}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className={classes.dialog} role="dialog" aria-modal="true" aria-label={title}>
                <div className={classes.dialog__head}>
                    <h2>{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close dialog">
                        <Icon icon="lucide:x" />
                    </button>
                </div>
                <div className={classes.dialog__body}>{children}</div>
            </div>
        </div>,
        document.body
    );
}
