import React, { useState } from 'react';
import Input from './Input';
import AuthShell from './AuthShell';
import classes from './Auth.module.sass';
import { validateField, validateAllFields } from './functions';
import { doSignInWithEmailAndPassword, doSignInWithGoogle, doSignInWithGitHub, authErrorMessage } from '../../config/auth';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from 'react-router-dom';


const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD;

export default function Signin() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [signInError, setSignInError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const { redirectError } = useAuth();

    // BS: a failed redirect sign-in lands back here with no click to report it,
    // so the context error has to be shown alongside the local one.
    const errorBanner = signInError || authErrorMessage(redirectError, 'Could not sign in. Please try again.');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: validateField(name, value),
        }));
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);
        setSubmitted(true);

        const validationErrors = validateAllFields(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSigningIn(false);
            return;
        }

        try {
            const { error } = await doSignInWithEmailAndPassword(formData.email, formData.password);

            if (error) {
                setSignInError(authErrorMessage(error, 'Error signing in. Please try again later.'));
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Sign-in error:', err);
            setSignInError('Unexpected error. Please try again later.');
        } finally {
            setIsSigningIn(false);
        }
    };



    const handleDemoSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        try {
            const { error } = await doSignInWithEmailAndPassword(DEMO_EMAIL, DEMO_PASSWORD);

            if (error) {
                setSignInError('The demo is unavailable right now. Please try again later.');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Demo sign-in error:', err);
            setSignInError('Unexpected error. Please try again later.');
        } finally {
            setIsSigningIn(false);
        }
    }

    const handleProviderSignIn = async (e, signIn) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        let redirecting = false;

        try {
            const result = await signIn();
            redirecting = result.redirecting;

            if (redirecting) return;

            if (result.error) {
                setSignInError(authErrorMessage(result.error, 'Could not sign in. Please try again.'));
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Provider sign-in error:', err);
            setSignInError('Unexpected error. Please try again later.');
        } finally {
            // BS: on the redirect path the page is unloading — keep the button busy
            // instead of flicking back to idle on the way out.
            if (!redirecting) setIsSigningIn(false);
        }
    }

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to pick up your conversations where you left off."
            footer={
                <>
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </>
            }
        >
            {DEMO_EMAIL && (
                <div className={classes.demo}>
                    <button
                        type="button"
                        className={classes.demo__btn}
                        onClick={handleDemoSignIn}
                        disabled={isSigningIn}
                    >
                        <Icon icon="ph:play-circle-fill" />
                        {isSigningIn ? 'Loading...' : 'Try the demo'}
                    </button>
                    <p className={classes.demo__caption}>No account needed — look around instantly</p>
                </div>
            )}

            {errorBanner && (
                <p className={classes.error__banner}>
                    <Icon icon="lucide:alert-circle" />
                    {errorBanner}
                </p>
            )}

            <form className={classes.form} onSubmit={handleSignIn}>
                <Input
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    icon="lucide:mail"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    forceError={submitted}
                />
                <Input
                    type="password"
                    name="password"
                    label="Password"
                    placeholder="Your password"
                    icon="lucide:lock"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    forceError={submitted}
                />

                <button type="submit" className={classes.submit__btn} disabled={isSigningIn}>
                    {isSigningIn ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <div className={classes.divider}>or continue with</div>

            <div className={classes.social}>
                <button
                    type="button"
                    className={classes.social__btn}
                    onClick={(e) => handleProviderSignIn(e, doSignInWithGoogle)}
                    disabled={isSigningIn}
                >
                    <Icon icon="flat-color-icons:google" />
                    Google
                </button>
                <button
                    type="button"
                    className={classes.social__btn}
                    onClick={(e) => handleProviderSignIn(e, doSignInWithGitHub)}
                    disabled={isSigningIn}
                >
                    <Icon icon="simple-icons:github" />
                    GitHub
                </button>
            </div>
        </AuthShell>
    );
}