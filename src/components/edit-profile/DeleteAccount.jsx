import { useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from '../common/Modal';
import {
    authErrorMessage,
    doDeleteAccount,
    isDemoAccount,
    requiresPasswordToDelete,
} from '../../config/auth';
import classes from './DeleteAccount.module.sass';

// The user-facing half of GDPR Art. 17. Deliberately self-service: an erasure
// right that requires emailing someone is a right most people never exercise.
export default function DeleteAccount() {
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const needsPassword = requiresPasswordToDelete();
    const isDemo = isDemoAccount();
    // BS: a typed confirmation rather than a second "are you sure" dialog —
    // this is irreversible, and clicking through two buttons is not a decision.
    const canDelete = confirmation.trim().toUpperCase() === 'DELETE' && !isDeleting;

    const close = () => {
        setIsOpen(false);
        setPassword('');
        setConfirmation('');
        setError('');
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');

        const { error: deleteError } = await doDeleteAccount(password);

        if (deleteError) {
            setError(authErrorMessage(deleteError, 'Could not delete the account. Please try again.'));
            setIsDeleting(false);
            return;
        }

        // BS: no navigate() — deleting the account fires onAuthStateChanged,
        // and PrivateRoute sends the (now signed-out) visitor to /signin.
    };

    return (
        <div className={classes.danger}>
            <h2 className={classes.danger__title}>Danger zone</h2>
            <p className={classes.danger__text}>
                Deleting your account removes your profile, email address and profile picture for
                good. Messages you already sent stay in the conversation but are anonymised.
            </p>

            {isDemo ? (
                <p className={classes.danger__note}>
                    <Icon icon="lucide:info" />
                    This is the shared demo account, so it cannot be deleted.
                </p>
            ) : (
                <button
                    type="button"
                    className={classes.danger__btn}
                    onClick={() => setIsOpen(true)}
                >
                    <Icon icon="lucide:trash-2" />
                    Delete account
                </button>
            )}

            {isOpen && (
                <Modal title="Delete your account" onClose={close}>
                    <p className={classes.modal__text}>
                        This cannot be undone. Your profile, email address and profile picture are
                        deleted immediately.
                    </p>

                    {needsPassword ? (
                        <label className={classes.field}>
                            <span>Confirm your password</span>
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                disabled={isDeleting}
                            />
                        </label>
                    ) : (
                        <p className={classes.modal__hint}>
                            You will be asked to sign in with your provider once more to confirm.
                        </p>
                    )}

                    <label className={classes.field}>
                        <span>Type DELETE to confirm</span>
                        <input
                            type="text"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            disabled={isDeleting}
                        />
                    </label>

                    {error && (
                        <p className={classes.modal__error}>
                            <Icon icon="lucide:alert-circle" />
                            {error}
                        </p>
                    )}

                    <div className={classes.modal__actions}>
                        <button type="button" onClick={close} disabled={isDeleting}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={classes.modal__confirm}
                            onClick={handleDelete}
                            disabled={!canDelete}
                        >
                            {isDeleting ? 'Deleting…' : 'Delete my account'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
