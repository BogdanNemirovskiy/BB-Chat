import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '../../contex/authContex/index';
import { db } from '../../config/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import EmojiPicker from 'emoji-picker-react';
import classes from './MessageBoard.module.sass';
import ProfileImg from '../../images/no-profile-picture.png';

export default function MessageBoard({ selectedChat, setSelectedChat, setLastMessage }) {
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
        const handleResize = () => {
            setIsMobileVersion(window.innerWidth < 768);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const handleKeyboardShow = () => document.body.classList.add('keyboard-active');
        const handleKeyboardHide = () => document.body.classList.remove('keyboard-active');

        window.addEventListener('focusin', handleKeyboardShow);
        window.addEventListener('focusout', handleKeyboardHide);

        return () => {
            window.removeEventListener('focusin', handleKeyboardShow);
            window.removeEventListener('focusout', handleKeyboardHide);
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
            const chatDocRef = doc(db, "chats", selectedChat.chatId);

            const newMessageData = {
                text: newMessage,
                createdAt: serverTimestamp(),
                senderId: currentUser.uid,
                displayName: currentUser.displayName || "User",
                photoURL: currentUser.photoURL || ProfileImg,
            };

            await addDoc(messagesRef, newMessageData);

            await updateDoc(chatDocRef, {
                lastMessage: newMessage,
                lastMessageTime: serverTimestamp(),
                lastMessageSenderId: currentUser.uid,
            });

            setNewMessage(""); // Reset input after sending
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleEmojiClick = (emojiObject) => {
        setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
    };


    const handleEmojiToggle = () => {
        setShowEmojiPicker((prevState) => !prevState); // Toggle visibility of emoji picker
    };

    return (
        <div className={classes.message__board}>
            {isChatSelected && selectedChat?.selectedUser && (
                <div className={classes.chat__header}>
                    {isMobileVersion ? (
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
                    ) : (
                        <div className={classes.header__profile}>
                            <img
                                src={selectedChat.selectedUser.photoURL || ProfileImg}
                                alt="User profile"
                                className={classes.profile__image}
                            />
                            <p className={classes.profile__name}>
                                {selectedChat.selectedUser.userName || "User"}
                            </p>
                        </div>
                    )}
                    <div className={classes.header__icons}>
                        {isMobileVersion ? (
                            <Icon onClick={() => setSelectedChat(null)} icon='stash:angle-left' />
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
                        {showEmojiPicker && (
                            <div className={classes.emoji__panel} ref={emojiPickerRef}>
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    disableAutoFocus={true}
                                    pickerStyle={{
                                        position: 'absolute',
                                        bottom: '50px',
                                        right: '20px',
                                        zIndex: 1000,
                                    }}
                                />
                            </div>
                        )}
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
                            {!isMobileVersion && (
                                <div className={classes.emoji__picker} ref={emojiIconRef}>
                                    <Icon
                                        icon="emojione:smiling-face"
                                        ref={emojiIconRef}
                                        style={{ color: "#000", cursor: "pointer" }}
                                        onClick={handleEmojiToggle}
                                    />
                                </div>
                            )}
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