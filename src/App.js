import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signin from "./components/Login/Signin";
import Signup from "./components/Login/Signup";
import ChatPage from "./components/pages/ChatPage";
import EditProfilePage from "./components/pages/EditProfilePage";
import { AuthProvider } from './contex/authContex/index';



const firebaseConfig = {
  apiKey: "AIzaSyBov3-ml5VmKR_wLQ6XgSbelwKy45_wNeo",
  authDomain: "bbchat-550e5.firebaseapp.com",
  projectId: "bbchat-550e5",
  storageBucket: "bbchat-550e5.firebasestorage.app",
  messagingSenderId: "200286790684",
  appId: "1:200286790684:web:48a77339bebeb3a020abd9",
  measurementId: "G-7GDBP8RVPC"
};

const router = createBrowserRouter([
  {
    index: true,
    element: <ChatPage />
  },
  {
    path: '/signin',
    element: <Signin />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: 'edit-profile',
    element: <EditProfilePage />
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
