import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "../../context/authContext/index";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import classes from "./MessageBoard.module.sass";
import ProfileImg from "../../images/no-profile-picture.png";
import ChatHeader from "./ChatHeader";
import { useDelayedUnmount } from "../../hooks/useDelayedUnmount";
import { useModeration } from "../../hooks/useModeration";

// Must match $duration-exit in styles/_tokens.sass.
const EMOJI_EXIT_MS = 170;

export default function MessageBoard({
  selectedChat,
  onBack,
  setLastMessage,
  enterFrom,
}) {
  const { currentUser } = useAuth();
  const [isChatSelected, setIsChatSelected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const emojiIconRef = useRef(null);
  const messagesEndRef = useRef(null);
  const animatedIds = useRef(new Map());
  const isInitialLoad = useRef(true);

  const emojiPanel = useDelayedUnmount(showEmojiPicker, EMOJI_EXIT_MS);

  const [isMobileVersion, setIsMobileVersion] = useState(false);

  const { isBlocked, setBlocked, reportUser } = useModeration();
  const otherUser = selectedChat?.selectedUser;
  const isUserBlocked = isBlocked(otherUser?.id);

  useEffect(() => {
    if (selectedChat) {
      setIsChatSelected(true);

      // BS: Everything in a newly opened chat counts as history. Without this
      // reset the whole backlog would animate in at once on every chat switch.
      animatedIds.current = new Map();
      isInitialLoad.current = true;

      const messagesRef = collection(
        db,
        "chats",
        selectedChat.chatId,
        "messages"
      );
      const q = query(messagesRef, orderBy("createdAt"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => {
          // BS: The verdict is cached per id rather than recomputed, because
          // serverTimestamp() makes every sent message arrive twice — once with
          // a null timestamp, then again once the server resolves it. A
          // recomputed flag would strip the class mid-animation and snap the
          // bubble into place.
          if (!animatedIds.current.has(doc.id)) {
            animatedIds.current.set(doc.id, !isInitialLoad.current);
          }

          return {
            ...doc.data(),
            id: doc.id,
            isNew: animatedIds.current.get(doc.id),
          };
        });

        isInitialLoad.current = false;
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
    const handleKeyboardShow = () =>
      document.body.classList.add("keyboard-active");
    const handleKeyboardHide = () =>
      document.body.classList.remove("keyboard-active");

    window.addEventListener("focusin", handleKeyboardShow);
    window.addEventListener("focusout", handleKeyboardHide);

    return () => {
      window.removeEventListener("focusin", handleKeyboardShow);
      window.removeEventListener("focusout", handleKeyboardHide);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      const messagesRef = collection(
        db,
        "chats",
        selectedChat.chatId,
        "messages"
      );
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

  const canSend = newMessage.trim() !== "";

  // BS: Blocking is enforced in the client only — Firestore still delivers the
  // messages, they are just kept off screen until the block is lifted.
  const visibleMessages = isUserBlocked
    ? messages.filter((msg) => msg.senderId !== otherUser?.id)
    : messages;

  const boardClass = [
    classes.message__board,
    enterFrom === "right" ? classes.enter_from__right : "",
  ]
    .join(" ")
    .trim();

  return (
    <div className={boardClass}>
      {isChatSelected && otherUser && (
        <ChatHeader
          user={otherUser}
          chatId={selectedChat.chatId}
          isMobile={isMobileVersion}
          isBlocked={isUserBlocked}
          onBack={onBack}
          onToggleBlock={(blocked) => setBlocked(otherUser.id, blocked)}
          onReport={reportUser}
        />
      )}

      <div className={classes.chat}>
        {!isChatSelected ? (
          <div className={classes.not_selected__chat}>
            <Icon icon="mingcute:chat-3-line" />
            <div className={classes.select__chat}>
              Select a chat to start messaging
            </div>
          </div>
        ) : (
          <div className={classes.selected__chat} key={currentUser.uid}>
            <div className={classes.messages}>
              {visibleMessages.map((msg) => {
                const isOwn = msg.senderId === currentUser.uid;
                const enterClass = isOwn
                  ? classes.bubble_enter__sent
                  : classes.bubble_enter__received;

                return (
                  <div
                    key={msg.id}
                    className={[
                      isOwn ? classes.user__sent : classes.user__received,
                      msg.isNew ? enterClass : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    <p className={classes.message__text}>{msg.text}</p>
                    <span className={classes.message__time}>
                      {msg.createdAt?.seconds
                        ? new Date(
                            msg.createdAt.seconds * 1000
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sending..."}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef}></div>
            </div>
            {isUserBlocked && (
              <div className={classes.blocked__bar}>
                <Icon icon="lucide:ban" />
                <p>
                  You blocked {otherUser?.userName || "this user"}. Their messages
                  stay hidden until you unblock them.
                </p>
                <button
                  type="button"
                  onClick={() => setBlocked(otherUser.id, false)}
                >
                  Unblock
                </button>
              </div>
            )}

            {!isUserBlocked && emojiPanel.mounted && (
              <div
                className={[
                  classes.emoji__panel,
                  emojiPanel.closing ? classes.emoji__panel_closing : "",
                ]
                  .join(" ")
                  .trim()}
                ref={emojiPickerRef}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  disableAutoFocus={true}
                  pickerStyle={{
                    position: "absolute",
                    bottom: "50px",
                    right: "20px",
                    zIndex: 1000,
                  }}
                />
              </div>
            )}
            {!isUserBlocked && (
              <div className={classes.chat__input}>
                <Icon icon="lucide:paperclip" className={classes.link} />
                <input
                  type="text"
                  className={classes.chat__inputField}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  type="button"
                  ref={emojiIconRef}
                  className={[
                    classes.composer__btn,
                    showEmojiPicker ? classes.composer__btn_active : "",
                  ]
                    .join(" ")
                    .trim()}
                  onClick={handleEmojiToggle}
                  aria-label="Insert emoji"
                  aria-expanded={showEmojiPicker}
                >
                  <Icon icon="lucide:smile" />
                </button>
                <button
                  type="button"
                  className={classes.send__btn}
                  onClick={handleSendMessage}
                  disabled={!canSend}
                  aria-label="Send message"
                >
                  <Icon icon="lucide:send-horizontal" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
