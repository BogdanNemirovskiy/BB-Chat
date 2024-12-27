import { useEffect, useState } from "react";
import MessageBoard from "../Chat/MessageBoard";
import Sidebar from "../Chat/Sidebar";

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobileVersion, setIsMobileVersion] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileVersion(window.innerWidth < 768);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
    };

    return (
        <div className="message-page">
            {isMobileVersion ? (
                selectedChat === null ? (
                    <Sidebar
                        handleSelectChat={handleSelectChat}
                        setSelectedChat={setSelectedChat}
                    />
                ) : (
                    <MessageBoard
                        selectedChat={selectedChat}
                        setSelectedChat={setSelectedChat} />

                )
            ) : (
                <>
                    <Sidebar
                        handleSelectChat={handleSelectChat}
                        setSelectedChat={setSelectedChat}
                    />
                    <MessageBoard selectedChat={selectedChat} />
                </>
            )}
        </div>
    );
}
