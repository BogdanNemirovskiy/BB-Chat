import React, { useState } from 'react';
import Input from './Input';
import classes from './Signin.module.sass';
import logo from '../../images/logo.png';
import { validateField, validateAllFields } from './functions';
import { doSignInWithEmailAndPassword, doSignInWithGitHub, doSignInWithGoogle, doSignInWithMicrosoft } from '../../config/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/authContex';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from 'react-router-dom';

export default function Signin({ onToggleForm }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [signInError, setSignInError] = useState(null);
    const { setUserLoggedIn } = useAuth();
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

        const { user, error } = await doSignInWithEmailAndPassword(formData.email, formData.password);

        if (error) {
            if (error.code === 'auth/wrong-password') {
                setSignInError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
                setSignInError('No account found with this email.');
            } else if (error.code === 'auth/invalid-credential') {
                setSignInError('Invalid credentials. Please check and try again.');
            } else {
                setSignInError('Error signing in. Please try again later.');
            }
            setIsSigningIn(false);
        } else {
            // setUserLoggedIn(true);
            navigate('/');
        }
    };




    const onGoogleSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        const { user, error } = await doSignInWithGoogle();
        if (error) {
            setSignInError('Error with Google sign-in. Please try again.');
        } else {
            // setUserLoggedIn(true);
            navigate('/');
        }
        setIsSigningIn(false);
    };

    const onGitHubSignIn = async (e) => {
        e.preventDefault();
        const { user, error } = await doSignInWithGitHub();
        if (error) {
            setSignInError('Error with GitHub sign-in. Please try again.');
        } else {
            // setUserLoggedIn(true);
            navigate('/');
        }
        setIsSigningIn(false);
    };

    const onMicrosoftSignIn = async (e) => {
        e.preventDefault();
        const { user, error } = await doSignInWithMicrosoft();
        if (error) {
            setSignInError('Error with GitHub sign-in. Please try again.');
        } else {
            // setUserLoggedIn(true);
            navigate('/');
        }
        setIsSigningIn(false);
    };

    return (
        <>
            <div className={classes.login__menu}>
                <div className={classes.logo}>
                    <img src={logo} alt='Logo' />
                    <h1>BB Chat</h1>
                </div>

                <p className={classes.sign_in__text}>Sign in</p>

                {signInError && <p className={classes.error_text}>{signInError}</p>}

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

                <button onClick={handleSignIn} className={classes.sign_in__btn} disabled={isSigningIn}>
                    {isSigningIn ? 'Signing in...' : 'Sign in'}
                </button>
                <div>
                    <div className={classes.sign_up__with}>
                        <span></span> <p>Sign up with</p> <span></span>
                    </div>
                    <div className={classes.sign_up__withIcons}>
                        <Icon icon="flat-color-icons:google" onClick={onGoogleSignIn} />
                        <Icon icon="simple-icons:github" style={{ color: 'black' }} onClick={onGitHubSignIn} />
                        <Icon icon="logos:microsoft-icon" onClick={onMicrosoftSignIn} />
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
