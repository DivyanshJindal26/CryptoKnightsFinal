// import { Calendar } from "@/components/ui/calendar";
import cover from "../../assets/premium_photo-1710961232986-36cead00da3c.avif";
import pic from "../../assets/movie-7328179_1280.png";
import React, { useState, useEffect } from "react";
import { RiWallet3Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../../context/UserContext";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
// import React from "react";
// import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TypewriterEffectSmooth } from "@/components/ui//typewriter-effect.jsx";
import { Aptos } from "@aptos-labs/ts-sdk";

import { FcGoogle } from "react-icons/fc";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "../../utils/constants";

const NODE_URL = "https://fullnode.testnet.aptoslabs.com";
const MODULE_ADDRESS =
  "340b3ba2b30cf9a9b7380492fb5c3281d5ff1b8078623dbf9a247b1c9d1ed2cc";

const colors = {
  primary: "#00FF00",
  background: "#000000",
  disabled: "#555555",
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1]; // Extract the payload part of the JWT.
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Adjust for Base64 URL encoding.
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload); // Return the payload as a JSON object.
  } catch (error) {
    console.error("Invalid JWT token", error);
    return null; // Return null if decoding fails.
  }
};

const Auth = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [connected, setConnected] = useState(false);
  // const [connected, setConnected] = useState(false);
  const { walletAddress, setWalletAddress } = useUser();

  const handleConnectWallet = () => {
    // if (!email) {
    //   alert(
    //     "⚠️ Please sign in with Google before connecting your Petra Wallet."
    //   );
    //   return;
    // }
    connectWallet();
  };

  useEffect(() => {
    const checkConnection = async () => {
      const storedWallet = localStorage.getItem("walletAddress");
      if (storedWallet) {
        setWalletAddress(storedWallet);
        setConnected(true);
      } else if (window.aptos) {
        try {
          const response = await window.aptos.account();
          setWalletAddress(response.address);
          setConnected(true);
          localStorage.setItem("walletAddress", response.address); // Ensure storage if refreshed
        } catch (error) {
          console.log("No wallet connected");
        }
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.aptos) {
        setStatus("Petra Wallet not found. Install it and try again.");
        return;
      }
      const response = await window.aptos.connect();
      setWalletAddress(response.address);
      setConnected(true);
      localStorage.setItem("walletAddress", response.address); // ✅ Store in localStorage
    } catch (error) {
      console.error("Error connecting to Petra Wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (!window.aptos) {
        setStatus("Petra Wallet not found.");
        return;
      }
      await window.aptos.disconnect();
      setWalletAddress("");
      setConnected(false);
      localStorage.removeItem("walletAddress"); // ✅ Remove from localStorage
    } catch (error) {
      console.error("Error disconnecting from Petra Wallet:", error);
    }
  };

  const handleGoogleSuccess = (response) => {
    const token = response.credential; // This contains the ID token.
    const decoded = parseJwt(token); // Use the custom decoder.

    if (decoded && decoded.email) {
      const userEmail = decoded.email; // Extract the email.
      setEmail(userEmail);
      setGoogleVerified(true);

      toast({
        title: "Google Sign-In Successful",
        description: `Logged in as ${userEmail}`,
      });
    } else {
      toast({
        title: "Invalid Token",
        description: "Failed to extract email from the Google token.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google Sign-In Failed:", error);

    toast({
      title: "Google Sign-In Failed",
      description: "There was an issue logging in with Google.",
      variant: "destructive",
    });
  };

  const validateLogin = () => {
    if (!password.length) {
      toast({
        title: "Password is required",
        description: "Please enter valid credentials",
      });
      return false;
    }
    if (!name.length) {
      toast({
        title: "Name is required",
        description: "Please enter valid credentials",
      });
      return false;
    }

    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast({
        title: "Email is required",
        description: "Please enter valid credentials",
      });
      return false;
    }

    if (!password.length) {
      toast({
        title: "Password is required",
        description: "Please enter valid credentials",
      });
      return false;
    }
    if (!name.length) {
      toast({
        title: "Name is required",
        description: "Please enter valid credentials",
      });
      return false;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password and Confirm Password should be the same",
        description: "Please enter valid credentials",
      });
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      try {
        const response = await apiClient.post(
          LOGIN_ROUTE,
          { username: name, password },
          { withCredentials: true }
        );

        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.username}!`,
        });
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          "Login failed. Please check your credentials.";

        toast({
          title: "Login Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      try {
        const response = await apiClient.post(
          SIGNUP_ROUTE,
          { username: name, email, password },
          { withCredentials: true }
        );

        toast({
          title: "Signup Successful",
          description: "Your account has been created successfully.",
        });
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || "Signup failed. Please try again.";

        toast({
          title: "Signup Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };
  // const [date, setDate] = React.useState(new Date());
  const words = [
    { text: "Buy\u00A0" }, // \u00A0 adds a non-breaking space
    { text: "Tickets\u00A0" },
    { text: "Right\u00A0" },
    { text: "NOW!!!\u00A0", className: "text-yellow-500 dark:text-yellow-500" },
    { text: "Verify\u00A0" },
    { text: "creds\u00A0" },
  ];

  const handleGoogleVerify = () => {
    setGoogleVerified(true);
  };

  const navigate = useNavigate(); // Initialize useNavigate

  const handleNavigate = () => {
    navigate("/profile"); // Navigate to '/about' route
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Dashboard Button */}

      {/* Main Layout */}
      <div className="w-full h-screen flex">
        {/* Left Side - Image */}
        <div className="w-1/2 h-full shrink-0">
          <img src={cover} alt="Cover" className="w-full h-full object-cover" />
        </div>

        {/* Right Side - Authentication */}

        <div className="w-1/2 h-full flex flex-col items-center justify-center space-y-6 ml-16 pl-6">
          <div className="mt-20">
            <button className="p-[4px] relative">
              {" "}
              {/* Increased padding for a bigger button */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-lg" />
              {/* <div className="px-12 py-4 bg-black rounded-[8px] relative group transition duration-200 text-white text-2xl font-bold hover:bg-transparent">  */}
              <div
                className="px-12 py-4 bg-black rounded-[8px] relative group transition duration-200 text-white text-2xl font-bold hover:bg-transparent"
                onClick={handleNavigate}
              >
                EVENTS
              </div>
            </button>
          </div>
          <img src={pic} alt="helloS" className="w-60 h-60 object-contain" />

          <div>
            <div className="flex justify-center">
              <p className="text-neutral-600 dark:text-neutral-200 text-xs sm:text-base r">
                SignUp and Connect your wallet to start...
              </p>
            </div>
            <TypewriterEffectSmooth words={words} />

            <div className="flex space-x-4 justify-center">
              {" "}
              {/* Flex container for horizontal alignment */}
              <div>
                {walletAddress ? (
                  <>
                    {/* <p className="text-white mb-2">
                      Connected Wallet: {walletAddress}
                    </p> */}
                    <button
                      onClick={disconnectWallet}
                      className="px-8 py-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition duration-200"
                    >
                      Disconnect Wallet
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="px-8 py-2 flex items-center space-x-2 rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition duration-200"
                  >
                    <RiWallet3Fill size={20} />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const decoded = parseJwt(credentialResponse.credential);
                  setEmail(decoded.email); // 👈 Will include email, name, picture, etc.
                }}
                onError={() => console.log("Google Login Failed")}
                render={(renderProps) => (
                  <Button
                    className="w-40 h-10 flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-200"
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                  >
                    <FcGoogle size={20} />
                    <span>Google Signup</span>
                  </Button>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};
export default Auth;
