import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/AuthService";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [roomId, setRoomId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [connected, setConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const userData = getCurrentUser();
      if (userData) {
        setUser(userData);
        setCurrentUser(userData.username);
        setIsAuthenticated(true);
        console.log("User authenticated:", userData.username);
      } else {
        setUser(null);
        setCurrentUser("");
        setIsAuthenticated(false);
        console.log("No user authentication found");
      }
    };

    checkAuth();
  }, []);

  const value = {
    roomId,
    setRoomId,
    currentUser,
    setCurrentUser,
    connected,
    setConnected,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export default useChatContext;