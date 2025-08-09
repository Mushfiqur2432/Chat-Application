import { baseURL } from "../config/AxiosHelper";

export const createRoom = async (roomName, password, createdBy) => {
  try {
    console.log("Creating room:", { roomName, createdBy, hasPassword: !!password });
   
    const token = localStorage.getItem("jwt") || localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const requestBody = {
      roomName: roomName,  // Backend expects 'roomName', not 'roomId'
      createdBy: createdBy
    };

    // Only add password if it exists
    if (password && password.trim()) {
      requestBody.password = password;
    }

    const response = await fetch(`${baseURL}/api/v1/rooms/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("Create room response:", data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: data.success,
      roomId: data.room?.roomId,
      message: data.message
    };
  } catch (error) {
    console.error("Error creating room:", error);
    return {
      success: false,
      message: error.message || "Failed to create room"
    };
  }
};

export const joinRoom = async (roomId, password, username) => {
  try {
    console.log("Joining room:", { roomId, username, hasPassword: !!password });
   
    const token = localStorage.getItem("jwt") || localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const requestBody = {
      roomId: roomId,
      username: username
    };

    // Only add password if it exists
    if (password && password.trim()) {
      requestBody.password = password;
    }

    const response = await fetch(`${baseURL}/api/v1/rooms/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("Join room response:", data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error joining room:", error);
    return {
      success: false,
      message: error.message || "Failed to join room"
    };
  }
};

export const getRooms = async () => {
  try {
    const token = localStorage.getItem("jwt") || localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${baseURL}/api/v1/rooms/all`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log("Get rooms response:", data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};