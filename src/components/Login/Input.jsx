import React, { useState } from 'react';
import classes from './Input.module.sass';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function Input({
    type,
    name,
    placeholder,
    value,
    onChange,
    inputRef,
    validate,
    error
}) {
    const [isTouched, setIsTouched] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleBlur = () => {
        setIsTouched(true);
        if (validate) {
            validate(name, value);
        }
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prevState) => !prevState);
    };
    return (
        <div className={classes.input__container}>
            <input
                type={isPasswordVisible && type === 'password' ? 'text' : type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={handleBlur}
                ref={inputRef}
                className={classes.input}
            />
            {type === 'password' ? <Icon
                onClick={togglePasswordVisibility}
                icon={isPasswordVisible ? 'mdi:eye' : 'mdi:eye-off'}
                className={classes.eye__icon}
            /> : null}
            {isTouched && error && (
                <p className={`${classes.error} ${type === 'password' ? classes['has-eye-icon'] : ''}`}>
                    {error}
                </p>
            )}
        </div>
    );
}
