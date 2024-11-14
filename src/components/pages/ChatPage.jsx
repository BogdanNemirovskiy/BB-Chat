import MessageBoard from "../Chat/MessageBoard";
import Sidebar from "../Chat/Sidebar";

export default function ChatPage() {
    return (
        <div className="message-page">
            <Sidebar />
            <MessageBoard />
        </div>
    )
};
