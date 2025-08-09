import { baseURL } from "../config/AxiosHelper";

// Sign up function
export const signUp = async (username, email, password, fullName) => {
  try {
    console.log("Signing up:", { username, email, fullName });
    const response = await fetch(`${baseURL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        fullName,
      }),
    });
    const data = await response.json();
    console.log("Signup response:", data);
    
    // Return the data directly as expected by the components
    if (response.ok && data.success) {
      // Store JWT token and user data
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('chatUser', JSON.stringify(data.user));
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        message: data.message || "Account created successfully!"
      };
    } else {
      return {
        success: false,
        message: data.message || "Signup failed"
      };
    }
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      message: "Network error. Please try again."
    };
  }
};

// Sign in function
export const signIn = async (usernameOrEmail, password) => {
  try {
    console.log("Signing in:", { usernameOrEmail });
    const response = await fetch(`${baseURL}/api/v1/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail,
        password,
      }),
    });
    const data = await response.json();
    console.log("Signin response:", data);
    
    // Return the data directly as expected by the components
    if (response.ok && data.success) {
      // Store JWT token and user data
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('chatUser', JSON.stringify(data.user));
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        message: data.message || "Signed in successfully!"
      };
    } else {
      return {
        success: false,
        message: data.message || "Invalid credentials"
      };
    }
  } catch (error) {
    console.error("Signin error:", error);
    return {
      success: false,
      message: "Network error. Please try again."
    };
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('chatUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Validate token
export const validateToken = async (token) => {
  try {
    const response = await fetch(`${baseURL}/api/v1/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return response.ok && data.valid;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem('jwt');
  localStorage.removeItem('authToken');
  localStorage.removeItem('chatUser');
  return { success: true };
};