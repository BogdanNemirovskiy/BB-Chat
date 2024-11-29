import React, { useState } from 'react';
import Signin from './Signin';
import Signup from './Signup';

export default function LoginPage() {
    const [activeForm, setActiveForm] = useState('signin');

    const toggleForm = () => {
        setActiveForm(prevForm => (prevForm === 'signin' ? 'signup' : 'signin'));
    };

    return (
        <div
        // className={classes.auth__container}
        >
            {activeForm === 'signin' ? (
                <Signin onToggleForm={toggleForm} />
            ) : (
                <Signup onToggleForm={toggleForm} />
            )}
        </div>
    );
}
