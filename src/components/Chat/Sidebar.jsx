import { Icon } from '@iconify/react/dist/iconify.js';
import ProfileImage from '../../images/no-profile-picture.png';
import { useAuth } from '../../contex/authContex';

import classes from './Sidebar.module.sass';
import { useEffect } from 'react';

export default function Sidebar() {
    const { currentUser } = useAuth();

    useEffect(() => {
        console.log(currentUser);
        
    }, [])

    return (
        <div className={classes.sidebar}>
            <div className={classes.account__detail}>
                <div className={classes.profile__image}>
                    <img src={ProfileImage} alt='Profile picture' />
                </div>
                <div className={classes.account__info}>
                    <p className={classes.username}>{currentUser?.displayName}</p>
                    <p className={classes.nickname}>@salera_123</p>
                </div>
            </div>
            <p>Messages</p>
            <div className={classes.search}>
                <Icon icon="material-symbols:search" style={{ color: 'black' }} />
                <input type="text" placeholder='Search chats' />
            </div>
            <div className={classes.users__list}>

            </div>
        </div>
    )
}