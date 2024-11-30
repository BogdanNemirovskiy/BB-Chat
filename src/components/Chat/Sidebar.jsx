import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '../../contex/authContex';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import noProfileImage from '../../images/no-profile-picture.png';
import classes from './Sidebar.module.sass';
import { getUserChats } from '../../config/functions';
import { doSignOut } from '../../config/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Image } from 'cloudinary-react';
import { API } from '../../config/api';


const db = getFirestore();

export default function Sidebar({ handleSelectChat }) {
    const { currentUser } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [foundUser, setFoundUser] = useState([]);
    const [error, setError] = useState('');
    const [chats, setChats] = useState([]);
    const [cloudName] = useState(API.cloudinary.clould_name);
    const [userData, setUserData] = useState(null);

    const navigate = useNavigate();


    useEffect(() => {
        const fetchChatsWithUsernames = async () => {
            const userChats = await getUserChats();

            const updatedChats = await Promise.all(
                userChats.map(async (chat) => {
                    const otherUserId = chat.userIds.find((id) => id !== currentUser.uid);
                    const otherUserRef = doc(db, 'users', otherUserId);
                    const otherUserSnap = await getDoc(otherUserRef);


                    if (otherUserSnap.exists()) {
                        const otherUserData = otherUserSnap.data();

                        return {
                            ...chat,
                            user: {
                                id: otherUserId,
                                userName: otherUserData.userName,
                                photoURL: otherUserData.photoUrl || noProfileImage,
                            },
                        };
                    } else {
                        return { ...chat, user: null };
                    }
                })
            );

            setChats(updatedChats);

        };

        const fetchUserData = async () => {
            try {
                const userDoc = doc(db, 'users', currentUser?.uid);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData(data);
                } else {
                    console.error('No such user document!');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data.');
            }
        };

        if (currentUser) {
            fetchUserData();
            fetchChatsWithUsernames();
        }
    }, [currentUser]);


    const handleSearchChange = (e) => {
        setSearchInput(e.target.value);
        setError('');
    };

    const handleSearchUser = async () => {
        if (!searchInput) return;

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('userName', '==', searchInput));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                setFoundUser({ id: querySnapshot.docs[0].id, ...userData });
            } else {
                setFoundUser(null);
                setError('User not found');
            }
        } catch (error) {
            console.error("Error searching user:", error);
            setError('Error searching user');
        }
    };



    const handleOpenChat = async (user) => {
        try {
            const existingChat = chats.find((chat) => chat.user?.id === user.id);
            let chatId;

            if (existingChat) {
                chatId = existingChat.id;
            } else {
                const chatsRef = collection(db, 'chats');
                const newChat = await addDoc(chatsRef, {
                    userIds: [currentUser.uid, user.id],
                    chat_name: `${currentUser.displayName} & ${user.userName}`,
                    is_group_chat: false,
                    createdAt: new Date(),
                });
                chatId = newChat.id;

                setChats((prevChats) => [
                    ...prevChats,
                    {
                        id: chatId,
                        name: user.userName,
                        user: user,
                        photoUrl: user.photoURL,
                    },
                ]);
            }

            handleSelectChat({ chatId, selectedUser: user });

            setFoundUser(null);
            setSearchInput('');
        } catch (error) {
            console.error("Error opening chat:", error);
            setError('Error opening chat');
        }
    };

    const handleSignOut = () => {
        navigate('/signin')
        doSignOut();
    }



    return (
        <div className={classes.sidebar}>
            <Link to='edit-profile'>
                <div className={classes.account__detail}>
                    <div className={classes.currentUser_profile__image}>
                        {cloudName && userData?.photoUrl ? (
                            <div className={classes.user__img}>
                                <Image
                                    cloudName={cloudName}
                                    publicId={userData.photoUrl}
                                    alt="Profile Image"
                                    crop="thumb"
                                    gravity="face"
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <img className={classes.no_profile__image} src={noProfileImage} alt="Default Profile" />
                        )}
                    </div>
                    <div className={classes.account__info}>
                        <p className={classes.username}>{currentUser.displayName}</p>
                        <p className={classes.nickname}>
                            @{currentUser.displayName.toLowerCase()}
                        </p>
                    </div>
                </div>

            </Link>
            <p>Messages</p>
            <div className={classes.search}>
                <Icon icon="material-symbols:search" style={{ color: 'black' }} />
                <input
                    type="text"
                    placeholder="Search username"
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
            </div>
            {error && <p className={classes.error}>{error}</p>}
            <div>
                {foundUser && foundUser.userName ? (
                    <div
                        className={classes.found__user}
                        onClick={() => handleOpenChat(foundUser)}
                    >
                        <div className={classes.foundUser__image}>
                            {foundUser.photoUrl ?
                                (
                                    <Image
                                        cloudName={cloudName}
                                        publicId={foundUser.photoUrl}
                                        crop="thumb"
                                        gravity="face"
                                        width="100%"
                                        height="100%"
                                        alt={`${foundUser.userName}'s Profile`}
                                    />
                                ) : (
                                    <div className={classes.founder__no_profile_img}>
                                        <img
                                            src={noProfileImage} alt="Default Profile"
                                        />
                                    </div>
                                )}
                        </div>
                        <p>{foundUser.userName}</p>
                    </div>
                ) : null}
                {Array.isArray(chats) && chats.length > 0 && (
                    <ul className={classes.chat__list}>
                        {chats.map((chat) =>
                        (
                            <div
                                key={chat.id}
                                className={classes.user__item}
                                onClick={() =>
                                    handleSelectChat({
                                        chatId: chat.id,
                                        selectedUser: chat.user,
                                    })
                                }
                            >
                                <div className={classes.profile_image}>
                                    {chat.user.photoURL !== noProfileImage ?
                                        (
                                            <div className={classes.profile_img}>
                                                <Image
                                                    cloudName={cloudName}
                                                    publicId={chat.user?.photoURL}
                                                    onClick={() => console.log(noProfileImage)
                                                    }
                                                    alt={`${chat.user?.userName}'s Profile`}
                                                    crop="thumb"
                                                    gravity="face"
                                                    width="100%"
                                                    height="100%"
                                                />
                                            </div>
                                        ) : (
                                            <div className={classes.no_profile_img}>
                                                <img
                                                    src={noProfileImage} alt="Default Profile"
                                                />
                                            </div>
                                        )}
                                </div>
                                <div className={classes.user_info}>
                                    <p className={classes.user_info__title}>
                                        {chat.user?.userName || 'Unknown User'}
                                    </p>
                                    <p className={classes.user_info__lastMessage}>{chat.lastMessage}</p>
                                </div>
                            </div>
                        ))}
                    </ul>

                )}
            </div>
            <button className={classes.signout__btn} onClick={handleSignOut}>Sign out</button>
        </div >
    );
}


