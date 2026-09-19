import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { getUserProfile } from '../../config/functions';
import classes from './UserModals.module.sass';

const formatDate = (value) => {
    if (!value) return null;
    const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function UserProfileModal({ user, isBlocked, onClose }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        getUserProfile(user?.id)
            .then((data) => {
                if (active) setProfile(data);
            })
            .catch((error) => console.error('Error loading profile:', error))
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user?.id]);

    const name = profile?.userName || user?.userName || 'User';
    const details = [
        ['Username', profile?.userTag ? `@${profile.userTag}` : `@${name.toLowerCase()}`],
        ['Member since', formatDate(profile?.createdAt)],
    ].filter(([, value]) => Boolean(value));

    return (
        <Modal title="Profile" onClose={onClose}>
            <div className={classes.profile}>
                <Avatar name={name} photoURL={profile?.photoURL || user?.photoURL} size={96} />
                <p className={classes.profile__name}>{name}</p>
                {isBlocked && <span className={classes.profile__badge}>Blocked</span>}
            </div>

            {loading ? (
                <p className={classes.hint}>Loading profile…</p>
            ) : (
                <dl className={classes.details}>
                    {details.map(([label, value]) => (
                        <div key={label} className={classes.details__row}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </Modal>
    );
}
