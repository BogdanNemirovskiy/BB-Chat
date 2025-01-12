import React, { useState } from 'react';
import Input from './Input';
import classes from './Signin.module.sass';
import logo from '../../images/logo.png';
import { validateField, validateAllFields } from './functions';
import { doSignInWithEmailAndPassword, doSignInWithGoogle, doSignInWithGitHub } from '../../config/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/authContex';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from 'react-router-dom';
import { db } from '../../config/firebaseConfig';
import { setDoc, getDoc, doc } from 'firebase/firestore';


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



    const onGoogleSignIn = async (e) => {
        e.preventDefault();
        const { user, error } = await doSignInWithGoogle();

        const userData = {

        }

        if (error) {
            setIsSigningIn('Error with Google sign-in. Please try again.')
        } else {
            console.log('user', user);
            navigate('/')
        }
        setIsSigningIn(false);
    }

    const onGitHubSignIn = async (e) => {
        e.preventDefault();

        const { user, error } = await doSignInWithGitHub();

        if (error) {
            setIsSigningIn('Error with GitHub sign-in. Please try again.')
        } else {
            console.log(user);
            navigate('/')
        }
        setIsSigningIn(false);
    }

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