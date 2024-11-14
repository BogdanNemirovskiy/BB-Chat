import ProfileImg from '../../images/no-profile-picture.png';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useState } from 'react';
import { useAuth } from '../../contex/authContex/index';

import classes from './MessageBoard.module.sass';

export default function MessageBoard() {
    const { currentUser } = useAuth();
    const [isChatSelected, setIsChatSelected] = useState(false);

    return (
        <div className={classes.message__board}>
            {isChatSelected && (
                <div className={classes.chat__header}>
                    <div className={classes.header__profile}>
                        <img
                            src={currentUser?.photoURL || ProfileImg}
                            alt="User profile"
                            className={classes.profile__image}
                        />
                        <p className={classes.profile__name}>
                            {currentUser?.displayName || 'User'}
                        </p>
                    </div>
                    <Icon icon="mingcute:more-2-fill" style={{ color: 'black' }} />
                </div>
            )}
            <div className={classes.chat}>
                {!isChatSelected ? (
                    <div className={classes.not_selected__chat}>
                        <div className={classes.select__chat}>
                            Select a chat to start messaging
                        </div>
                    </div>
                ) : (
                    <div className={classes.selected__chat}>
                        <div className={classes.messages}>
                            {/* messages */}
                        </div>
                        <div className={classes.chat__input}>
                            <Icon icon="icon-park-outline:link" style={{ color: 'black' }} className={classes.link} />
                            <input type="text" className={classes.chat__inputField} placeholder="Type a message..." />
                            <Icon icon="ic:baseline-send" style={{ color: 'black' }} className={classes.baseline__send} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
