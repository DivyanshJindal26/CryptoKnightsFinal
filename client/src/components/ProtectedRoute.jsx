import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const ADMIN_WALLET = "0xYourAdminWalletAddress"; // Change this to your desired admin address

const ProtectedRoute = ({ children }) => {
  const { walletAddress } = useContext(UserContext);

  if (walletAddress !== ADMIN_WALLET) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
