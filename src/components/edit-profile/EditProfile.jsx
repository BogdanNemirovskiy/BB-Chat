import UserInfo from './UserInfo';
import Avatar from '../common/Avatar';
import classes from './EditProfile.module.sass';
import { useAuth } from '../../context/authContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { updateProfile } from 'firebase/auth';
import { API } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function EditProfile() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [localData, setLocalData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState('');
    const fileInputRef = useRef(null);
    const [cloudName] = useState(API.cloudinary.cloud_name);
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
            setLoading(true);
            const userDoc = doc(db, 'users', currentUser.uid);

            // Persist only the editable fields so we never clobber
            // server-managed data (createdAt, email, photoURL, ...).
            const editableFields = ['userName', 'address', 'userTag', 'DOB'];
            const updates = {};
            editableFields.forEach((field) => {
                if (localData[field] !== undefined) updates[field] = localData[field];
            });

            await updateDoc(userDoc, updates);

            // Keep Firebase Auth displayName in sync so renames show
            // immediately in the header (Sidebar reads displayName).
            if (updates.userName && updates.userName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: updates.userName });
            }

            setUserData((prevData) => ({ ...prevData, ...updates }));
            setError('');
            navigate('/');
        } catch (err) {
            console.error('Error saving user data:', err);
            setError('Failed to save data. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

    const handleImageChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            console.error('No file selected for upload.');
            return;
        }

        // Validate client-side: images only, max 5MB. The upload preset is
        // unsigned, so this is the first line of defense against junk uploads.
        if (!selectedFile.type.startsWith('image/')) {
            setImageError('Please choose an image file.');
            event.target.value = '';
            return;
        }
        if (selectedFile.size > MAX_IMAGE_BYTES) {
            setImageError('Image is too large. Please choose a file under 5MB.');
            event.target.value = '';
            return;
        }
        setImageError('');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', API.cloudinary.upload_preset);

        try {
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData
            );
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
            setLocalData((prevData) => ({
                ...prevData,
                photoURL: uploadedImageUrl,
                photoPublicId: publicId,
            }));
            currentUser.photoURL = uploadedImageUrl;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            setImageError('Failed to upload image. Please try again.');
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
                className={classes.go_back__btn}
            >
                <Icon icon="weui:arrow-filled" />Go back
            </div>
            <div className={classes.edit__profile}>
                <div
                    className={classes.profile__image}
                    onClick={handleImageClick}
                >
                    <div className={classes.user__photo}>
                        <Avatar
                            name={localData?.userName || currentUser?.displayName}
                            photoURL={userData?.photoURL}
                        />
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                </div>
                {imageError && <p className={classes.image_error}>{imageError}</p>}
                <p className={classes.nickname}>@{localData?.userTag || 'No Nickname'}</p>
                <div className={classes.user__info}>
                    <UserInfo
                        info="Username"
                        userInfo={localData?.userName || ''}
                        onSave={(value) => handleFieldChange('userName', value)}
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
