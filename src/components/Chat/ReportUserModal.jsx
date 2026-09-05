import { useState } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Modal from '../common/Modal';
import classes from './UserModals.module.sass';

const REASONS = [
    'Spam or scam',
    'Harassment or hate',
    'Inappropriate content',
    'Pretending to be someone else',
    'Something else',
];

export default function ReportUserModal({ user, chatId, onSubmit, onClose }) {
    const [reason, setReason] = useState(REASONS[0]);
    const [details, setDetails] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('sending');
        setError('');

        try {
            await onSubmit({ reportedUserId: user.id, reason, details, chatId });
            setStatus('sent');
        } catch (submitError) {
            console.error('Error submitting report:', submitError);
            setError('Could not send the report. Please try again.');
            setStatus('idle');
        }
    };

    if (status === 'sent') {
        return (
            <Modal title="Report sent" onClose={onClose}>
                <div className={classes.success}>
                    <Icon icon="lucide:check-circle-2" />
                    <p>Thanks — we've received your report about {user.userName || 'this user'}.</p>
                </div>
                <button type="button" className={classes.btn__primary} onClick={onClose}>
                    Done
                </button>
            </Modal>
        );
    }

    return (
        <Modal title={`Report ${user.userName || 'user'}`} onClose={onClose}>
            <form className={classes.form} onSubmit={handleSubmit}>
                <fieldset className={classes.reasons}>
                    <legend>Why are you reporting this account?</legend>
                    {REASONS.map((option) => (
                        <label key={option} className={classes.reason}>
                            <input
                                type="radio"
                                name="report-reason"
                                value={option}
                                checked={reason === option}
                                onChange={() => setReason(option)}
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </fieldset>

                <label className={classes.field}>
                    <span>Anything else we should know? (optional)</span>
                    <textarea
                        rows={3}
                        maxLength={1000}
                        value={details}
                        onChange={(event) => setDetails(event.target.value)}
                        placeholder="Add context for the moderation team…"
                    />
                </label>

                {error && <p className={classes.error}>{error}</p>}

                <div className={classes.actions}>
                    <button type="button" className={classes.btn__ghost} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={classes.btn__danger} disabled={status === 'sending'}>
                        {status === 'sending' ? 'Sending…' : 'Send report'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
