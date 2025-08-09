import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useChatContext from '../context/ChatContext';
import { validateToken } from '../services/AuthService';

const ProtectedRoute = ({ children }) => {
  const { currentUser, setCurrentUser, setUser, setIsAuthenticated } = useChatContext();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticatedLocal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user data exists in localStorage
        const storedUser = localStorage.getItem('chatUser');
        const token = localStorage.getItem('authToken');

        console.log('ProtectedRoute: Checking authentication...');
        console.log('Token exists:', !!token);
        console.log('User data exists:', !!storedUser);

        if (!storedUser || !token) {
          console.log('ProtectedRoute: No stored credentials found');
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);
        console.log('ProtectedRoute: Found user data for:', userData.username);

        // Validate token with backend
        try {
          const isValid = await validateToken(token);
          console.log('ProtectedRoute: Token validation result:', isValid);

          if (isValid) {
            setCurrentUser(userData.username);
            setUser(userData);
            setIsAuthenticated(true);
            setIsAuthenticatedLocal(true);
            console.log('ProtectedRoute: Authentication successful');
          } else {
            console.log('ProtectedRoute: Token invalid, clearing storage');
            // Token invalid, clear localStorage
            localStorage.removeItem('chatUser');
            localStorage.removeItem('authToken');
            setCurrentUser('');
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthenticatedLocal(false);
          }
        } catch (validationError) {
          console.error('ProtectedRoute: Token validation failed:', validationError);
          // Token validation failed, clear localStorage
          localStorage.removeItem('chatUser');
          localStorage.removeItem('authToken');
          setCurrentUser('');
          setUser(null);
          setIsAuthenticated(false);
          setIsAuthenticatedLocal(false);
        }
      } catch (error) {
        console.error('ProtectedRoute: Auth check failed:', error);
        localStorage.removeItem('chatUser');
        localStorage.removeItem('authToken');
        setCurrentUser('');
        setUser(null);
        setIsAuthenticated(false);
        setIsAuthenticatedLocal(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setCurrentUser, setUser, setIsAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#a847ed' }}></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to signin');
    // Save the attempted location for redirect after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Authentication successful, rendering children');
  return children;
};

export default ProtectedRoute;