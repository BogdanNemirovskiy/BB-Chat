import { useEffect, useState } from "react";
import MessageBoard from "../Chat/MessageBoard";
import Sidebar from "../Chat/Sidebar";
import DemoBanner from "../common/DemoBanner";

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobileVersion, setIsMobileVersion] = useState(false);
    const [, setLastMessage] = useState(null);
    const [enterFrom, setEnterFrom] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileVersion(window.innerWidth < 768);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // BS: On mobile the two panels replace each other, so whichever one mounts
    // has to know which way the user travelled to slide in from the right side.
    // Starts null so the first paint after login is not animated.
    const handleSelectChat = (chat) => {
        setEnterFrom("right");
        setSelectedChat(chat);
    };

    // BS: MessageBoard used to call setSelectedChat(null) directly, which left
    // ChatPage blind to the direction. Routing "back" through here is what makes
    // the sidebar come in from the left rather than the right.
    const handleBack = () => {
        setEnterFrom("left");
        setSelectedChat(null);
    };

    return (
        <div className="message-page">
            <DemoBanner />
            {isMobileVersion ? (
                selectedChat === null ? (
                    <Sidebar
                        handleSelectChat={handleSelectChat}
                        selectedChatId={selectedChat?.chatId}
                        enterFrom={enterFrom}
                    />
                ) : (
                    <MessageBoard
                        setLastMessage={setLastMessage}
                        selectedChat={selectedChat}
                        onBack={handleBack}
                        enterFrom={enterFrom}
                    />
                )
            ) : (
                <>
                    <Sidebar
                        handleSelectChat={handleSelectChat}
                        selectedChatId={selectedChat?.chatId}
                    />
                    <MessageBoard selectedChat={selectedChat} />
                </>
            )}
        </div>
    );
}
