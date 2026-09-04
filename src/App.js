import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import Signin from "./components/Login/Signin";
import Signup from "./components/Login/Signup";
import ChatPage from "./components/pages/ChatPage";
import EditProfilePage from "./components/pages/EditProfilePage";
import { AuthProvider, useAuth } from "./context/authContext/index";
import ErrorPage from "./components/pages/ErrorPage";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
}

const router = createHashRouter([
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
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
