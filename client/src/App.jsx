import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Auth from "./pages/auth/index.jsx";
import Chat from "./pages/chat";
import Profile from "./pages/profile";
import Admin from "./pages/admin/admin.jsx";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
