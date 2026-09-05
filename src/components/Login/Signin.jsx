import React, { useState } from 'react';
import Input from './Input';
import classes from './Signin.module.sass';
import logo from '../../images/logo.png';
import { validateField, validateAllFields } from './functions';
import { doSignInWithEmailAndPassword, doSignInWithGoogle, doSignInWithGitHub } from '../../config/auth';
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
    const navigate = useNavigate();

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

        const validationErrors = validateAllFields(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSigningIn(false);
            return;
        }

        try {
            const { user, error } = await doSignInWithEmailAndPassword(formData.email, formData.password);

            if (error) {
                if (error.code === 'auth/wrong-password') {
                    setSignInError('Incorrect password. Please try again.');
                } else if (error.code === 'auth/user-not-found') {
                    setSignInError('No account found with this email.');
                } else {
                    setSignInError('Error signing in. Please try again later.');
                }
            } else {
                console.log('user', user);
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

    const onGoogleSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        try {
            const { user, error } = await doSignInWithGoogle();

            if (error) {
                setSignInError('Error with Google sign-in. Please try again.');
            } else {
                console.log('user', user);
                navigate('/');
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            setSignInError('Unexpected error. Please try again later.');
        } finally {
            setIsSigningIn(false);
        }
    }

    const onGitHubSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        setSignInError(null);

        try {
            const { user, error } = await doSignInWithGitHub();

            if (error) {
                setSignInError('Error with GitHub sign-in. Please try again.');
            } else {
                console.log(user);
                navigate('/');
            }
        } catch (err) {
            console.error('GitHub sign-in error:', err);
            setSignInError('Unexpected error. Please try again later.');
        } finally {
            setIsSigningIn(false);
        }
    }

    return (
        <>
            <div className={classes.login__menu}>
                <div className={classes.logo}>
                    <img src={logo} alt='Logo' />
                    <h1>BB Chat</h1>
                </div>

                <p className={classes.sign_in__text}>Sign in</p>

                {DEMO_EMAIL && (
                    <div className={classes.demo__container}>
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

                {signInError && <p className={classes.error_text}>{signInError}</p>}

                <form onSubmit={handleSignIn}>
                    <Input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                    />
                    <Input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                    />

                    <button type="submit" className={classes.sign_in__btn} disabled={isSigningIn}>
                        {isSigningIn ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <div>
                    <div className={classes.sign_up__with}>
                        <span></span> <p>Sign up with</p> <span></span>
                    </div>
                    <div className={classes.sign_up__withIcons}>
                        <button type="button" aria-label="Sign in with Google" onClick={onGoogleSignIn} disabled={isSigningIn}>
                            <Icon icon="flat-color-icons:google" />
                        </button>
                        <button type="button" aria-label="Sign in with GitHub" onClick={onGitHubSignIn} disabled={isSigningIn}>
                            <Icon icon="simple-icons:github" style={{ color: 'black' }} />
                        </button>
                    </div>
                </div>
                <Link className={classes.sign_in_link} to='/signup'>
                    Don't have an account?{' '}
                    <span>Sign up</span>
                </Link>
            </div>
        </>
    );
}