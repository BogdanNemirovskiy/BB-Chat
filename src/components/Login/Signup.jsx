// Signup.jsx
import React, { useState } from 'react';
import Input from './Input';
import classes from './Signup.module.sass';
import logo from '../../images/logo.png';
import { validateField } from './functions';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle, doSignInWithGitHub } from '../../config/auth';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup({ }) {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isRegistering) {
            setIsRegistering(true);
            try {
                await doCreateUserWithEmailAndPassword(formData.email, formData.password, formData.username);
                console.log("Registration successful");
                navigate('/');
            } catch (error) {
                console.error("Registration failed:", error.message);
            } finally {
                setIsRegistering(false);
            }
        }
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

    return (
        <div className={classes.login__menu}>
            <div className={classes.logo}>
                <img src={logo} alt="Logo" />
                <h1>BB Chat</h1>
            </div>
            <p className={classes.sign_in__text}>Sign up</p>

            <Input
                type="text"
                name="username"
                placeholder="Username"
                value={formData?.username || ''}
                onChange={handleChange}
                error={errors?.username}
            />
            <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData?.email || ''}
                onChange={handleChange}
                error={errors?.email}
            />
            <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData?.password || ''}
                onChange={handleChange}
                error={errors?.password}
            />

            <button onClick={handleSignUp} className={classes.sign_up__btn}>Sign up</button>
            <div>
                <div className={classes.sign_up__with}>
                    <span></span> <p>Sign up with</p> <span></span>
                </div>
                <div className={classes.sign_up__withIcons}>
                    <Icon icon="flat-color-icons:google" />
                    <Icon icon="simple-icons:github" style={{ color: 'black' }} />
                    <Icon icon="logos:microsoft-icon" />
                </div>
            </div>

            <Link className={classes.sign_in_link} to='/signin'>
                Already have an account?{' '}
                <span>Sign in</span>
            </Link>
        </div>
    );
}
