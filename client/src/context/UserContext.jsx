import React, { createContext, useContext, useState } from "react";

// Create the context
const UserContext = createContext();

// Custom hook for easy usage
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [userData, setUserData] = useState({}); // for other profile data

  return (
    <UserContext.Provider
      value={{ walletAddress, setWalletAddress, userData, setUserData }}
    >
      {children}
    </UserContext.Provider>
  );
};
