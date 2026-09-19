import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '../../context/authContext';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import classes from './Sidebar.module.sass';
import Avatar from '../common/Avatar';
import { getUserChats } from '../../config/functions';
import { doSignOut } from '../../config/auth';
import { Link, useNavigate } from 'react-router-dom';


const db = getFirestore();

export default function Sidebar({ handleSelectChat, selectedChatId, enterFrom }) {
    const { currentUser } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [foundUser, setFoundUser] = useState([]);
    const [error, setError] = useState('');
    const [chats, setChats] = useState([]);
    const [userData, setUserData] = useState(null);

    const [isMobileVersion, setIsMobileVersion] = useState(false);
    const [isMobileInputActive, setIsMobileInputActive] = useState(false);

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

                        const chatRef = doc(db, 'chats', chat.id);
                        onSnapshot(chatRef, (doc) => {
                            const updatedChat = doc.data();
                            setChats((prevChats) => {
                                return prevChats.map((prevChat) => {
                                    if (prevChat.id === chat.id) {
                                        return { ...prevChat, lastMessage: updatedChat.lastMessage };
                                    }
                                    return prevChat;
                                });
                            });
                        });

                        return {
                            ...chat,
                            user: {
                                id: otherUserId,
                                userName: otherUserData.userName,
                                photoURL: otherUserData.photoURL || null,
                            },
                        };
                    } else {
                        // BS: no profile document means the account was deleted.
                        // The conversation stays, the person behind it does not.
                        return {
                            ...chat,
                            user: { id: otherUserId, userName: 'Deleted user', photoURL: null },
                        };
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

    useEffect(() => {
        const handleResize = () => {
            setIsMobileVersion(window.innerWidth < 768);
        };

        handleResize();

        console.log("Adding resize listener");
        window.addEventListener("resize", handleResize);

        return () => {
            console.log("Removing resize listener");
            window.removeEventListener("resize", handleResize);
        };
    }, []);

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

    const sidebarClass = [
        classes.sidebar,
        enterFrom === 'left' ? classes.enter_from__left : '',
    ].join(' ').trim();

    return (
        <div className={sidebarClass}>
            {isMobileVersion ? (
                <div className={classes.mobile__header}>
                    {!isMobileInputActive ? (
                        <>
                            <Link to="edit-profile" className={classes.mobile__avatarLink}>
                                <span className={classes.mobile__avatar}>
                                    <Avatar
                                        name={userData?.userName || currentUser?.displayName}
                                        photoURL={userData?.photoURL}
                                        size={42}
                                    />
                                </span>
                            </Link>
                            <p className={classes.mobile__brand}>BB Chat</p>
                            <button
                                type="button"
                                className={classes.mobile__iconBtn}
                                onClick={() => setIsMobileInputActive(true)}
                                aria-label="Search for a user"
                            >
                                <Icon icon="lucide:search" />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={classes.mobile__searchBar}>
                                <Icon icon="lucide:search" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                    placeholder="Search username..."
                                />
                            </div>
                            <button
                                type="button"
                                className={classes.mobile__iconBtn}
                                onClick={() => {
                                    setIsMobileInputActive(false);
                                    setSearchInput('');
                                    setError('');
                                }}
                                aria-label="Close search"
                            >
                                <Icon icon="lucide:x" />
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <Link to="edit-profile">
                    <div className={classes.account__detail}>
                        <div className={classes.currentUser_profile__image}>
                            <div className={classes.user__img}>
                                <Avatar
                                    name={userData?.userName || currentUser?.displayName}
                                    photoURL={userData?.photoURL}
                                />
                            </div>
                        </div>
                        <div className={classes.account__info}>
                            <p className={classes.username}>{currentUser.displayName}</p>
                            <p className={classes.nickname}>
                                @{currentUser?.displayName?.toLowerCase() || 'unknown'}
                            </p>
                        </div>
                    </div>
                </Link>
            )}

            {!isMobileVersion && <p className={classes.mobile__messagesTitle}>Messages</p>}

            {!isMobileVersion && (
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
            )}

            {error && <p className={classes.error}>{error}</p>}

            {foundUser && foundUser.userName && (
                <div
                    className={classes.found__user}
                    onClick={() => handleOpenChat(foundUser)}
                >
                    <div className={classes.foundUser__image}>
                        <Avatar name={foundUser.userName} photoURL={foundUser.photoURL} />
                    </div>
                    <p>{foundUser.userName}</p>
                </div>
            )}

            <ul className={classes.chat__list}>
                {Array.isArray(chats) && chats.length > 0 ? (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={[
                                classes.user__item,
                                chat.id === selectedChatId ? classes.selected_user__item : '',
                            ].join(' ').trim()}
                            onClick={() =>
                                handleSelectChat({
                                    chatId: chat.id,
                                    selectedUser: chat.user,
                                })
                            }
                        >
                            <div className={classes.profile_image}>
                                <div className={classes.profile_img}>
                                    <Avatar
                                        name={chat.user?.userName}
                                        photoURL={chat.user?.photoURL}
                                    />
                                </div>
                            </div>
                            <div className={classes.user_info}>
                                <p className={classes.user_info__title}>
                                    {chat.user?.userName || 'Unknown User'}
                                </p>
                                <p className={classes.user_info__lastMessage}>
                                    {chat.lastMessage || 'No messages yet'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className={classes.noChats}>No chats available</p>
                )}
            </ul>


            <button className={classes.signout__btn} onClick={handleSignOut}>
                <Icon icon="material-symbols:logout-rounded" />
                Sign out
            </button>

            {/* BS: the notice has to stay reachable after sign-up too — that is
                where someone goes looking for how to get their data deleted. */}
            <Link to="/privacy" className={classes.privacy__link}>
                Privacy Policy
            </Link>
        </div>

    );
}


