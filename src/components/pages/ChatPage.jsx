import { useState } from "react";
import MessageBoard from "../Chat/MessageBoard";
import Sidebar from "../Chat/Sidebar";

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);

    const handleSelectChat = (chat) => {
        // console.log("Chat selected:", chat);
        setSelectedChat(chat);
    };

    return (
        <div className="message-page">
            <Sidebar handleSelectChat={handleSelectChat} setSelectedChat={setSelectedChat} />
            <MessageBoard selectedChat={selectedChat} />
        </div>
    );
}
