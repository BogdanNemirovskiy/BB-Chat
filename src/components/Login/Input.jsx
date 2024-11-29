import React, { useState } from 'react';
import classes from './Input.module.sass';

export default function Input({
    type = "text",
    name,
    placeholder,
    value,
    onChange,
    inputRef,
    validate,  // New prop for calling validation from the parent
    error      // New prop for displaying error messages from the parent
}) {
    const [isTouched, setIsTouched] = useState(false);

    const handleBlur = () => {
        setIsTouched(true);
        if (validate) {
            validate(name, value);
        }
    };

    return (
        <div className={classes.input__container}>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={handleBlur} // Validate on blur
                ref={inputRef}
                className={classes.input}
            />
            {isTouched && error && <p className={classes.error}>{error}</p>}
        </div>
    );
}
