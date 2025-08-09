import React, { useRef, useState, useEffect } from "react";
import { VscSend, VscAttach } from "react-icons/vsc";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { toast } from "react-hot-toast";
import { getCurrentUser, logout } from "../services/AuthService";

const ChatPage = () => {
  const messageRef = useRef();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const { roomId, currentUser, setCurrentUser, user, setUser } = useChatContext();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [roomName, setRoomName] = useState("Loading...");
  const fileInputRef = useRef(null);
  const [userCache, setUserCache] = useState(new Map()); // Cache for user full names

  useEffect(() => {
    // Check authentication
    const userData = getCurrentUser();
    if (!userData) {
      navigate("/signin");
      return;
    }
    setUser(userData);
    setCurrentUser(userData.username);

    if (roomId) {
      connectWebSocket();
    } else {
      navigate("/dashboard");
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [roomId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWebSocket = () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      toast.error("Authentication required");
      navigate("/signin");
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        setConnected(true);
        setStompClient(client);

        // Subscribe to room messages
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log("Received message:", receivedMessage);

          setMessages((prev) => {
            // Check for duplicates
            const isDuplicate = prev.some(msg => 
              msg.timeStamp === receivedMessage.timeStamp &&
              msg.sender === receivedMessage.sender &&
              msg.content === receivedMessage.content
            );

            if (!isDuplicate) {
              // Fetch sender's full name if not already cached and not current user
              if (receivedMessage.sender !== currentUser && !userCache.has(receivedMessage.sender)) {
                fetchUserFullName(receivedMessage.sender);
              }
              return [...prev, receivedMessage];
            }
            return prev;
          });
        });

        // Subscribe to messages from the file upload endpoint
        client.subscribe(`/topic/messages/${roomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log("Received file message:", receivedMessage);

          setMessages((prev) => {
            // Check for duplicates
            const isDuplicate = prev.some(msg => 
              msg.timeStamp === receivedMessage.timeStamp &&
              msg.sender === receivedMessage.sender &&
              msg.content === receivedMessage.content
            );

            if (!isDuplicate) {
              // Fetch sender's full name if not already cached and not current user
              if (receivedMessage.sender !== currentUser && !userCache.has(receivedMessage.sender)) {
                fetchUserFullName(receivedMessage.sender);
              }
              return [...prev, receivedMessage];
            }
            return prev;
          });
        });

        // Subscribe to online users count for real-time updates
        client.subscribe(`/topic/room/${roomId}/users`, (message) => {
          const userCount = JSON.parse(message.body);
          setOnlineUsers(userCount);
        });

        // Load room information and existing messages
        loadRoomInfo();
        loadMessages();
        toast.success("Connected to chat room!");
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setConnected(false);
      },
      onStompError: (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection failed. Please try again.");
        if (error.headers && error.headers.message) {
          console.error("Error details:", error.headers.message);
        }
      }
    });

    client.activate();
  };

  // Load room information including room name and online users count
  const loadRoomInfo = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const roomData = await response.json();
        setRoomName(roomData.roomName || roomData.name || "Chat Room");
        setOnlineUsers(roomData.activeUsers || roomData.onlineCount || 0);
      }
    } catch (error) {
      console.error("Failed to load room info:", error);
      setRoomName("Chat Room");
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Fetch full names for all unique senders (except current user)
        const uniqueSenders = [...new Set(data.map(msg => msg.sender))];
        uniqueSenders.forEach(sender => {
          if (sender !== currentUser && !userCache.has(sender)) {
            fetchUserFullName(sender);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Function to fetch user's full name by username
  const fetchUserFullName = async (username) => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(`http://localhost:8080/api/v1/users/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserCache(prev => new Map(prev.set(username, userData.fullName || username)));
      }
    } catch (error) {
      console.error("Failed to fetch user full name:", error);
      // Cache the username as fallback
      setUserCache(prev => new Map(prev.set(username, username)));
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() && connected && stompClient) {
      const messageData = {
        sender: currentUser,
        content: inputMessage,
        roomId: roomId,
        timeStamp: new Date().toISOString(),
        senderFullName: user?.fullName || currentUser  // Include sender's full name
      };

      stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(messageData)
      });

      setInputMessage("");
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sender", currentUser);
    formData.append("senderFullName", user?.fullName || currentUser);
    formData.append("roomId", roomId);

    try {
      toast.loading("Uploading file...", { id: "upload" });
      
      const token = localStorage.getItem("jwt");
      // FIXED: Using the correct endpoint that creates messages
      const response = await fetch("http://localhost:8080/api/v1/files/upload-message", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("File uploaded successfully!", { id: "upload" });
        // No need to send via WebSocket - the backend already does this
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("File upload failed", { id: "upload" });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const handleLeaveRoom = () => {
    if (stompClient) {
      stompClient.deactivate();
    }
    navigate("/dashboard");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Check if file is image
  const isImage = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  // Check if file is video
  const isVideo = (fileType) => {
    return fileType && fileType.startsWith('video/');
  };

  // Check if file is audio
  const isAudio = (fileType) => {
    return fileType && fileType.startsWith('audio/');
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    const isCurrentUser = message.sender === currentUser;
    
    if (message.fileUrl) {
      const filename = message.fileName || message.originalFileName || message.content;
      const fileUrl = `http://localhost:8080${message.fileUrl}`;

      if (isImage(message.fileType) || (message.messageType === 'image')) {
        return (
          <div className="mt-2">
            <img 
              src={fileUrl} 
              alt={message.originalFileName || filename}
              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(fileUrl, '_blank')}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{display: 'none'}} className={`text-sm ${isCurrentUser ? 'text-red-600' : 'text-red-400'}`}>
              Image failed to load. Click to download: {message.originalFileName || filename}
            </div>
            <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-600' : 'text-gray-400'}`}>
              {message.originalFileName || filename}
            </div>
          </div>
        );
      } else if (isVideo(message.fileType) || (message.messageType === 'video')) {
        return (
          <div className="mt-2">
            <video 
              controls 
              className="max-w-xs max-h-64 rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            >
              <source src={fileUrl} type={message.fileType} />
              Your browser does not support the video tag.
            </video>
            <div style={{display: 'none'}} className={`text-sm ${isCurrentUser ? 'text-red-600' : 'text-red-400'}`}>
              Video failed to load. Click to download: {message.originalFileName || filename}
            </div>
            <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-600' : 'text-gray-400'}`}>
              {message.originalFileName || filename}
            </div>
          </div>
        );
      } else if (isAudio(message.fileType) || (message.messageType === 'audio')) {
        return (
          <div className="mt-2">
            <div className={`p-3 rounded-lg ${isCurrentUser ? 'bg-gray-100' : 'bg-gray-700'}`}>
              <audio controls className="w-full max-w-xs">
                <source src={fileUrl} type={message.fileType} />
                Your browser does not support the audio tag.
              </audio>
              <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-600' : 'text-gray-400'}`}>
                {message.originalFileName || filename}
              </div>
            </div>
          </div>
        );
      } else {
        // File display with different styling for current user
        return (
          <div className="mt-2">
            <div 
              className={`cursor-pointer p-2 rounded transition-colors ${
                isCurrentUser 
                  ? 'hover:bg-gray-100' 
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <div className={`font-medium ${isCurrentUser ? 'text-gray-800' : 'text-white'}`}>
                📎 {message.originalFileName || filename}
              </div>
              <div className={`text-xs ${isCurrentUser ? 'text-gray-600' : 'text-gray-400'}`}>
                Click to download
              </div>
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className={isCurrentUser ? 'text-gray-800' : 'text-white'}>
          {message.content}
        </div>
      );
    }
  };

  return (
    <div className="h-screen bg-slate-800 flex flex-col">
      {/* Header with dynamic room name and online users count */}
      <div className="bg-slate-700 px-6 py-4 flex items-center justify-between border-b border-slate-600">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLeaveRoom}
            className="text-gray-300 hover:text-white text-xl"
          >
            ←
          </button>
          <div>
            {/* Dynamic room name instead of "Project Discussion Hub" */}
            <h1 className="text-white text-lg font-semibold">{roomName}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Room ID: {roomId}</span>
              
            </div>
          </div>
        </div>
        
        {/* User info with full name and username display */}
        <div className="flex items-center space-x-3">
          {user?.fullName && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                {/* Full name on top */}
                <div className="text-white font-medium">{user.fullName}</div>
                {/* Username underneath */}
                <div className="text-gray-400 text-sm">{user.username || currentUser}</div>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area with white message bubbles for current user */}
      <div className="flex-1 overflow-y-auto px-6 py-4" ref={messageRef}>
        {messages.map((message, index) => {
          const showDate = index === 0 || formatDate(message.timeStamp) !== formatDate(messages[index - 1].timeStamp);
          const isCurrentUser = message.sender === currentUser;
          
          return (
            <div key={index} className="mb-6">
              {showDate && (
                <div className="flex justify-center mb-6">
                  <div className="bg-slate-600 text-gray-300 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.timeStamp)}
                  </div>
                </div>
              )}
              
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start space-x-3 max-w-md">
                  {!isCurrentUser && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {(message.senderFullName || message.sender).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {!isCurrentUser && (
                      <div className="text-gray-300 text-sm font-medium mb-1">
                        {message.senderFullName || userCache.get(message.sender) || message.sender}
                      </div>
                    )}
                    
                    {/* Show "You" for current user messages */}
                    {isCurrentUser && (
                      <div className="text-gray-300 text-sm font-medium mb-1 text-right">
                        You
                      </div>
                    )}
                    
                    {/* White background for current user messages */}
                    <div className={`rounded-2xl px-4 py-3 ${
                      isCurrentUser 
                        ? 'bg-white text-black border border-gray-200 shadow-sm' 
                        : 'bg-slate-700 text-white'
                    }`}>
                      {renderMessageContent(message)}
                    </div>
                    
                    <div className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-right text-gray-500' : 'text-left text-gray-400'
                    }`}>
                      {formatTime(message.timeStamp)}
                    </div>
                  </div>
                  
                  {isCurrentUser && (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {(user?.fullName || currentUser).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="bg-slate-700 px-6 py-4 border-t border-slate-600">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-slate-600 text-white placeholder-gray-400 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 border-none"
              disabled={!connected}
            />
          </div>
          
          <button
            onClick={handleFileSelect}
            className="w-12 h-12 bg-slate-600 hover:bg-slate-500 text-gray-300 rounded-full flex items-center justify-center transition-colors"
            disabled={!connected}
          >
            <VscAttach size={20} />
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!connected || !inputMessage.trim()}
            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          >
            <VscSend size={20} />
          </button>
        </div>
        
        {!connected && (
          <div className="flex items-center justify-center mt-2 text-amber-400 text-sm">
            <span>⚠ Reconnecting...</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />
    </div>
  );
};

export default ChatPage;