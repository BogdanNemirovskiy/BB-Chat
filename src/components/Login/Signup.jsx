import React, { useState } from 'react';
import Input from './Input';
import AuthShell from './AuthShell';
import classes from './Auth.module.sass';
import { validateField } from './functions';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle, doSignInWithGitHub } from '../../config/auth';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link, useNavigate } from 'react-router-dom';
import { validateAllFields } from './functions';



export default function Signup() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [signInError, setSignInError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsRegistering(true);
        setSubmitted(true);

        const validationErrors = validateAllFields(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsRegistering(false);
            return;
        }

        const { error } = await doCreateUserWithEmailAndPassword(formData.email, formData.password, formData.username);

        if (error) {
            console.error("Registration failed:", error.message);

            if (error.code === 'auth/email-already-in-use') {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    email: 'This email is already in use.',
                }));
            } else if (error.code === 'auth/weak-password') {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    password: 'Password is too weak. Use a stronger password.',
                }));
            } else {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    general: 'Registration failed. Please try again later.',
                }));
            }
        } else {
            navigate('/');
        }

        setIsRegistering(false);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: validateField(name, value),
        }));
    };

    const onGoogleSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        const { error } = await doSignInWithGoogle();

        if (error) {
            setSignInError('Error with Google sign-in. Please try again.');
        } else {
            navigate('/');
        }
        setIsSigningIn(false);
    }

    const onGitHubSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        const { error } = await doSignInWithGitHub();

        if (error) {
            setSignInError('Error with GitHub sign-in. Please try again.');
        } else {
            navigate('/');
        }
        setIsSigningIn(false);
    }

    return (
        <AuthShell
            title="Create your account"
            subtitle="It takes less than a minute — then you can start chatting."
            footer={
                <>
                    Already have an account? <Link to="/signin">Sign in</Link>
                </>
            }
        >
            {(signInError || errors?.general) && (
                <p className={classes.error__banner}>
                    <Icon icon="lucide:alert-circle" />
                    {signInError || errors.general}
                </p>
            )}

            <form className={classes.form} onSubmit={handleSignUp}>
                <Input
                    type="text"
                    name="username"
                    label="Username"
                    placeholder="How others will see you"
                    icon="lucide:user-round"
                    autoComplete="username"
                    value={formData?.username || ''}
                    onChange={handleChange}
                    error={errors?.username}
                    forceError={submitted}
                />
                <Input
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    icon="lucide:mail"
                    autoComplete="email"
                    value={formData?.email || ''}
                    onChange={handleChange}
                    error={errors?.email}
                    forceError={submitted}
                />
                <Input
                    type="password"
                    name="password"
                    label="Password"
                    placeholder="At least 8 characters"
                    icon="lucide:lock"
                    autoComplete="new-password"
                    value={formData?.password || ''}
                    onChange={handleChange}
                    error={errors?.password}
                    forceError={submitted}
                />

                <button type="submit" className={classes.submit__btn} disabled={isRegistering}>
                    {isRegistering ? 'Signing up...' : 'Create account'}
                </button>
            </form>

            <div className={classes.divider}>or continue with</div>

            <div className={classes.social}>
                <button
                    type="button"
                    className={classes.social__btn}
                    onClick={onGoogleSignIn}
                    disabled={isSigningIn}
                >
                    <Icon icon="flat-color-icons:google" />
                    Google
                </button>
                <button
                    type="button"
                    className={classes.social__btn}
                    onClick={onGitHubSignIn}
                    disabled={isSigningIn}
                >
                    <Icon icon="simple-icons:github" />
                    GitHub
                </button>
            </div>
        </AuthShell>
    );
}