import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import UserProfileModal from './UserProfileModal';
import ReportUserModal from './ReportUserModal';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';
import classes from './ChatHeader.module.sass';
import modalClasses from './UserModals.module.sass';

// BS: The pre-redesign header is kept intact under the 'v1' variant — switch
// this constant back to 'v1' to restore the old bar without touching anything
// else. Both variants carry the same menu actions.
const HEADER_VARIANT = 'v2';

// Must match $duration-exit in styles/_tokens.sass.
const MENU_EXIT_MS = 170;

export default function ChatHeader({
    user,
    chatId,
    isMobile,
    isBlocked,
    onBack,
    onToggleBlock,
    onReport,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialog, setDialog] = useState(null);
    const menuRef = useRef(null);

    const menuPanel = useDelayedUnmount(menuOpen, MENU_EXIT_MS);
    const name = user?.userName || 'User';

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [menuOpen]);

    const openDialog = (next) => {
        setMenuOpen(false);
        setDialog(next);
    };

    const handleBlockAction = () => {
        setMenuOpen(false);
        if (isBlocked) {
            onToggleBlock(false);
        } else {
            setDialog('block');
        }
    };

    const menu = (
        <div className={classes.menu__wrap} ref={menuRef}>
            <button
                type="button"
                className={classes.icon__btn}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Chat options"
            >
                <Icon icon="mingcute:more-2-fill" />
            </button>

            {menuPanel.mounted && (
                <div
                    className={[classes.menu, menuPanel.closing ? classes.menu_closing : '']
                        .join(' ')
                        .trim()}
                    role="menu"
                >
                    <button type="button" role="menuitem" onClick={() => openDialog('profile')}>
                        <Icon icon="lucide:user-round" />
                        View profile
                    </button>
                    <button type="button" role="menuitem" onClick={() => openDialog('report')}>
                        <Icon icon="lucide:flag" />
                        Report user
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={classes.menu__item_danger}
                        onClick={handleBlockAction}
                    >
                        <Icon icon={isBlocked ? 'lucide:user-round-check' : 'lucide:ban'} />
                        {isBlocked ? 'Unblock user' : 'Block user'}
                    </button>
                </div>
            )}
        </div>
    );

    const dialogs = (
        <>
            {dialog === 'profile' && (
                <UserProfileModal user={user} isBlocked={isBlocked} onClose={() => setDialog(null)} />
            )}
            {dialog === 'report' && (
                <ReportUserModal
                    user={user}
                    chatId={chatId}
                    onSubmit={onReport}
                    onClose={() => setDialog(null)}
                />
            )}
            {dialog === 'block' && (
                <Modal title={`Block ${name}?`} onClose={() => setDialog(null)}>
                    <div className={modalClasses.confirm}>
                        <p>
                            <strong>{name}</strong> won't be able to reach you here, and their
                            messages stay hidden until you unblock them. You can undo this any time
                            from the same menu.
                        </p>
                        <div className={modalClasses.actions}>
                            <button
                                type="button"
                                className={modalClasses.btn__ghost}
                                onClick={() => setDialog(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={modalClasses.btn__danger}
                                onClick={() => {
                                    onToggleBlock(true);
                                    setDialog(null);
                                }}
                            >
                                Block
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );

    if (HEADER_VARIANT === 'v1') {
        return (
            <div className={classes.header_v1}>
                {isMobile ? (
                    <div className={classes.header__profile}>
                        <p className={classes.profile__name}>{name}</p>
                        <div className={classes.profile__image}>
                            <Avatar name={name} photoURL={user?.photoURL} size={56} />
                        </div>
                    </div>
                ) : (
                    <div className={classes.header__profile}>
                        <div className={classes.profile__image}>
                            <Avatar name={name} photoURL={user?.photoURL} size={56} />
                        </div>
                        <p className={classes.profile__name}>{name}</p>
                    </div>
                )}
                <div className={classes.header__icons}>
                    {isMobile ? <Icon onClick={onBack} icon="stash:angle-left" /> : menu}
                </div>
                {dialogs}
            </div>
        );
    }

    return (
        <div className={classes.header}>
            {isMobile && (
                <button
                    type="button"
                    className={classes.icon__btn}
                    onClick={onBack}
                    aria-label="Back to chats"
                >
                    <Icon icon="lucide:arrow-left" />
                </button>
            )}

            <button
                type="button"
                className={classes.identity}
                onClick={() => setDialog('profile')}
                aria-label={`View ${name}'s profile`}
            >
                <span className={classes.identity__avatar}>
                    <Avatar name={name} photoURL={user?.photoURL} size={isMobile ? 42 : 48} />
                </span>
                <span className={classes.identity__text}>
                    <span className={classes.identity__name}>{name}</span>
                    <span className={classes.identity__meta}>
                        {isBlocked ? 'Blocked' : `@${name.toLowerCase()}`}
                    </span>
                </span>
            </button>

            {menu}
            {dialogs}
        </div>
    );
}
