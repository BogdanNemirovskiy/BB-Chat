import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Signin from "./components/Login/Signin";
import Signup from "./components/Login/Signup";
import ChatPage from "./components/pages/ChatPage";
import EditProfilePage from "./components/pages/EditProfilePage";
import { AuthProvider, useAuth } from "./contex/authContex/index";
import ErrorPage from "./components/pages/ErrorPage";
import { Helmet } from "react-helmet";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
}

const router = createBrowserRouter([
  {
    index: true,
    element: (
      <PrivateRoute>
        <ChatPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/signin",
    element: <Signin />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "edit-profile",
    element: (
      <PrivateRoute>
        <EditProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: '*',
    element: <ErrorPage />
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
