import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ChatPage from "./components/ChatPage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <div className="min-h-screen bg-gray-900 transition-colors duration-300">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#ffffff',
                border: '1px solid #374151',
              },
              success: {
                style: {
                  background: '#065f46',
                  color: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#aa0808ff',
                  color: '#ffffff',
                },
              },
            }}
          />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to signin */}
              <Route path="/" element={<Navigate to="/signin" replace />} />
              
              {/* Authentication routes (public) */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route 
                path="*" 
                element={
                  <div className="flex items-center justify-center h-screen bg-gray-900">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                      <p className="text-gray-400 mb-6">Page Not Found</p>
                      <a 
                        href="/signin" 
                        style={{ backgroundColor: '#a847ed' }}
                        className="hover:opacity-90 text-white px-6 py-2 rounded-lg transition-opacity"
                      >
                        Go to Sign In
                      </a>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </BrowserRouter>
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;