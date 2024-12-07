import UserInfo from './UserInfo';
import noProfileImage from '../../images/no-profile-picture.png';
import classes from './EditProfile.module.sass';
import { useAuth } from '../../contex/authContex';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Image } from 'cloudinary-react';
import { API } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function EditProfile() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [localData, setLocalData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const [cloudName] = useState(API.cloudinary.clould_name);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const userDoc = doc(db, 'users', currentUser.uid);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData(data);
                    setLocalData(data);
                } else {
                    console.error('No such user document!');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data.');
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchUserData();
    }, [currentUser]);


    const handleFieldChange = (field, value) => {
        setLocalData((prevData) => ({ ...prevData, [field]: value }));
    };

    const handleSaveToFirestore = async () => {
        try {
            const userDoc = doc(db, 'users', currentUser.uid);
            await updateDoc(userDoc, localData);
            setUserData(localData);
            setError('');
            navigate(-1);
        } catch (err) {
            console.error('Error saving user data:', err);
            setError('Failed to save data. Please try again.');
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            console.error("No file selected for upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", "bbchat");

        try {
            const response = await axios.post("https://api.cloudinary.com/v1_1/dwszo0b7b/image/upload", formData);
            console.log('Upload success:', response.data);

            const publicId = response.data.public_id;
            const uploadedImageUrl = response.data.secure_url;

            const userDoc = doc(db, 'users', currentUser.uid);
            await updateDoc(userDoc, { photoURL: uploadedImageUrl, photoPublicId: publicId });

            setUserData((prevData) => ({
                ...prevData,
                photoURL: uploadedImageUrl,
                photoPublicId: publicId,
            }));
            currentUser.photoURL = uploadedImageUrl;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
        }
    };

    if (loading) {
        return <div className={classes.loading}>Loading...</div>;
    }

    if (error) {
        return <div className={classes.error}>{error}</div>;
    }

    if (!cloudName) {
        console.error('Cloudinary cloud_name is missing. Check your environment variables.');
    }

    return (
        <>
            <div
                onClick={() => navigate(-1)}
                className={classes.go_back__btn}> <Icon icon="weui:arrow-filled" />Go back</div>
            <div className={classes.edit__profile}>
                <div className={cloudName && userData?.photoURL ? classes.profile__image : classes.no_profile__image} onClick={handleImageClick}>
                    {cloudName && userData?.photoURL ? (
                        <div style={{ width: "14rem", height: "14rem", overflow: "hidden", borderRadius: "50%", paddingDown: '1rem' }}>
                            <Image
                                cloudName={cloudName}
                                publicId={userData.photoURL}
                                alt="Profile Image"
                                crop="thumb"
                                gravity="face"
                                width="100%"
                                height="100%"
                            />
                        </div>
                    ) : (
                        <img src={noProfileImage} alt="Default Profile" />
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                </div>
                <p className={classes.nickname}>@{localData?.userTag || 'No Nickname'}</p>
                <div className={classes.user__info}>
                    <UserInfo
                        info="Username"
                        userInfo={localData?.userName || ''}
                        onSave={(value) => handleFieldChange('userName', value)}
                    />
                    <UserInfo
                        info="Email"
                        userInfo={currentUser.email || ''}
                    />
                    <UserInfo
                        info="Address"
                        userInfo={localData?.address || ''}
                        onSave={(value) => handleFieldChange('address', value)}
                    />
                    <UserInfo
                        info="UserTag"
                        userInfo={localData?.userTag || ''}
                        onSave={(value) => handleFieldChange('userTag', value)}
                    />
                    <UserInfo
                        info="DOB"
                        userInfo={localData?.DOB || ''}
                        onSave={(value) => handleFieldChange('DOB', value)}
                    />
                </div>

                <button className={classes.save__button} onClick={handleSaveToFirestore}>
                    Save
                </button>
            </div>
        </>

    );
}
