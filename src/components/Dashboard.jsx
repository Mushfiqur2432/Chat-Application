import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useChatContext from "../context/ChatContext";
import { getCurrentUser, logout } from "../services/AuthService";
import { createRoom, joinRoom } from "../services/RoomService";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("join");
  const [joinData, setJoinData] = useState({
    roomId: "",
    password: "",
  });
  const [createData, setCreateData] = useState({
    roomName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const { currentUser, user, setRoomId, setCurrentUser, setUser, setIsAuthenticated } = useChatContext();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getCurrentUser();
    if (!userData) {
      navigate("/signin");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const result = logout();
      if (result.success) {
        setCurrentUser("");
        setUser(null);
        setIsAuthenticated(false);
        toast.success("Logged out successfully!");
        navigate("/signin");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!joinData.roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting to join room:", joinData.roomId);
      
      const result = await joinRoom(joinData.roomId, joinData.password, currentUser);
      
      if (result.success) {
        setRoomId(joinData.roomId);
        toast.success(`Successfully joined room: ${joinData.roomId}`);
        navigate("/chat");
      } else {
        toast.error(result.message || "Failed to join room");
      }
    } catch (error) {
      console.error("Join room error:", error);
      toast.error("Error joining room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!createData.roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting to create room:", createData.roomName);
      
      const result = await createRoom(createData.roomName, createData.password, currentUser);
      
      if (result.success) {
        setRoomId(result.roomId);
        toast.success(`Room created successfully! Room ID: ${result.roomId}`);
        navigate("/chat");
      } else {
        toast.error(result.message || "Failed to create room");
      }
    } catch (error) {
      console.error("Create room error:", error);
      toast.error("Error creating room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = (name) => {
    const colors = ['#a847ed', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const color = colors[name.length % colors.length];
    return {
      backgroundColor: color,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      fontSize: '18px',
      fontWeight: 'bold'
    };
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Logo */}
             <div>
              <img src="crop_photo_2025-05-24_20-21-01.jpg" alt="Logo" className="mx-auto h-16 w-16 rounded-full mb-4" />
            </div>
              <h1 className="text-2xl font-bold text-white">Semicord</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div style={generateAvatar(user.fullName || user.username)}>
                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("join")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "join"
                    ? "text-white border-b-2"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                style={activeTab === "join" ? { borderBottomColor: '#a847ed' } : {}}
              >
                <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Join Room
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "create"
                    ? "text-white border-b-2"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                style={activeTab === "create" ? { borderBottomColor: '#a847ed' } : {}}
              >
                <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Room
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "join" ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Join Existing Room</h2>
                <form onSubmit={handleJoinRoom} className="space-y-6">
                  <div>
                    <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      id="roomId"
                      required
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter room ID"
                      value={joinData.roomId}
                      onChange={(e) => setJoinData({ ...joinData, roomId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Room Password (if required)
                    </label>
                    <input
                      type="password"
                      id="joinPassword"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter room password"
                      value={joinData.password}
                      onChange={(e) => setJoinData({ ...joinData, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    style={{ backgroundColor: '#a847ed' }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Join Room
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Create New Room</h2>
                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      id="roomName"
                      required
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter room name"
                      value={createData.roomName}
                      onChange={(e) => setCreateData({ ...createData, roomName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="createPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Room Password (optional)
                    </label>
                    <input
                      type="password"
                      id="createPassword"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Set room password"
                      value={createData.password}
                      onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    style={{ backgroundColor: '#a847ed' }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Room
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm">
            {activeTab === "join" 
              ? "Enter a room ID to join an existing chat room. Ask the room creator for the ID and password if needed."
              : "Create a new chat room and share the room ID with others to let them join."
            }
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;