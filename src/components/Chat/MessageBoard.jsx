import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '../../contex/authContex/index';
import { db } from '../../config/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import EmojiPicker from 'emoji-picker-react';
import classes from './MessageBoard.module.sass';
import ProfileImg from '../../images/no-profile-picture.png';

export default function MessageBoard({ selectedChat, setSelectedChat }) {
    const { currentUser } = useAuth();
    const [isChatSelected, setIsChatSelected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const emojiIconRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [isMobileVersion, setIsMobileVersion] = useState(false);

    useEffect(() => {
        if (selectedChat) {
            setIsChatSelected(true);

            const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
            const q = query(messagesRef, orderBy("createdAt"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setMessages(msgs);
                setTimeout(scrollToBottom, 0);
            });

            return () => unsubscribe();
        } else {
            setIsChatSelected(false);
            setMessages([]);
        }
    }, [selectedChat]);

    useEffect(() => {
        const handleViewportChange = () => {
            const chatInput = document.querySelector(`.${classes.chat__input}`);
            if (chatInput) {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                chatInput.style.bottom = `${window.visualViewport.offsetTop}px`;
            }
        };

        const resetInputPosition = () => {
            const chatInput = document.querySelector(`.${classes.chat__input}`);
            if (chatInput) {
                chatInput.style.bottom = '0px';
            }
        };

        window.visualViewport?.addEventListener('resize', handleViewportChange);
        window.visualViewport?.addEventListener('scroll', handleViewportChange);
        window.addEventListener('focusout', resetInputPosition);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportChange);
            window.visualViewport?.removeEventListener('scroll', handleViewportChange);
            window.removeEventListener('focusout', resetInputPosition);
        };
    }, []);



    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target) &&
                emojiIconRef.current &&
                !emojiIconRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === "") return;

        try {
            const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");

            const newMessageData = {
                text: newMessage,
                createdAt: serverTimestamp(),
                senderId: currentUser.uid,
                displayName: currentUser.displayName || "User",
                photoURL: currentUser.photoURL || ProfileImg,
            };

            await addDoc(messagesRef, newMessageData);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleEmojiClick = (emojiObject) => {
        setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
    };

    const handleGoBack = () => {
        setSelectedChat(null);
    };


    return (
        <div className={classes.message__board}>
            {isChatSelected && selectedChat?.selectedUser && (
                <div className={classes.chat__header}>
                    {isMobileVersion ?
                        <div className={classes.header__profile}>
                            <p className={classes.profile__name}>
                                {selectedChat.selectedUser.userName || "User"}
                            </p>
                            <img
                                src={selectedChat.selectedUser.photoURL || ProfileImg}
                                alt="User profile"
                                className={classes.profile__image}
                            />
                        </div>

                        : <div className={classes.header__profile}>
                            <img
                                src={selectedChat.selectedUser.photoURL || ProfileImg}
                                alt="User profile"
                                className={classes.profile__image}
                            />
                            <p className={classes.profile__name}>
                                {selectedChat.selectedUser.userName || "User"}
                            </p>
                        </div>

                    }
                    <div className={classes.header__icons}>
                        {isMobileVersion ? (
                            <>
                                <Icon onClick={handleGoBack} icon='stash:angle-left' />
                            </>
                        ) : (
                            <Icon
                                icon="mingcute:more-2-fill"
                                style={{ color: "black" }}
                                className={classes.desktop__icon}
                            />
                        )}
                    </div>

                </div>
            )}

            <div className={classes.chat}>
                {!isChatSelected ? (
                    <div className={classes.not_selected__chat}>
                        <div className={classes.select__chat}>Select a chat to start messaging</div>
                    </div>
                ) : (
                    <div className={classes.selected__chat} key={currentUser.uid}>
                        <div className={classes.messages}>
                            {messages.map((msg) => (
                                <React.Fragment key={msg.id}>
                                    <div
                                        className={msg.senderId === currentUser.uid ? classes.user__sent : classes.user__received}
                                    >
                                        <p className={classes.message__text}>{msg.text}</p>
                                    </div>
                                    <p className={msg.senderId === currentUser.uid ? classes.user__sent_time : classes.user__received_time}>
                                        {msg.createdAt?.seconds
                                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })
                                            : 'Sending...'}
                                    </p>
                                </React.Fragment>
                            ))}
                            <div ref={messagesEndRef}></div>
                        </div>

                        <div className={classes.chat__input}>
                            <Icon icon="icon-park-outline:link" style={{ color: "black" }} className={classes.link} />
                            <input
                                type="text"
                                className={classes.chat__inputField}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            />
                            {!isMobileVersion &&
                                <div className={classes.emoji__picker} ref={emojiPickerRef}>
                                    <Icon
                                        icon="emojione:smiling-face"
                                        ref={emojiIconRef}
                                        style={{ color: "#000", cursor: "pointer" }}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    />
                                </div>
                            }
                            <Icon
                                icon="ic:baseline-send"
                                style={{ color: "black", cursor: "pointer" }}
                                className={classes.baseline__send}
                                onClick={handleSendMessage}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}