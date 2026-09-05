import { useState } from 'react';
import classes from './Input.module.sass';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function Input({
    type,
    name,
    label,
    placeholder,
    value,
    onChange,
    inputRef,
    validate,
    error,
    icon,
    autoComplete,
    // BS: Submitting without ever leaving a field would otherwise hide the very
    // error that blocked the submit, so the form can force its errors open.
    forceError = false,
}) {
    const [isTouched, setIsTouched] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = type === 'password';
    const showError = Boolean(error) && (isTouched || forceError);
    const errorId = `${name}-error`;

    const handleBlur = () => {
        setIsTouched(true);
        if (validate) {
            validate(name, value);
        }
    };

    return (
        <div className={classes.field}>
            <label className={classes.field__label} htmlFor={name}>
                {label}
            </label>

            <div
                className={[classes.field__control, showError ? classes.field__control_invalid : '']
                    .join(' ')
                    .trim()}
            >
                {icon && <Icon icon={icon} className={classes.field__icon} />}
                <input
                    id={name}
                    type={isPasswordVisible && isPassword ? 'text' : type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    ref={inputRef}
                    autoComplete={autoComplete}
                    aria-invalid={showError}
                    aria-describedby={showError ? errorId : undefined}
                    className={classes.field__input}
                />
                {isPassword && (
                    <button
                        type="button"
                        className={classes.field__toggle}
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                        <Icon icon={isPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'} />
                    </button>
                )}
            </div>

            {showError && (
                <p className={classes.field__error} id={errorId}>
                    <Icon icon="lucide:alert-circle" />
                    {error}
                </p>
            )}
        </div>
    );
}
