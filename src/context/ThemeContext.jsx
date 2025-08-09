import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Get system preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Get time-based theme (6 AM - 6 PM = light, rest = dark)
  const getTimeBasedTheme = () => {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  };

  // Get automatic theme based on system and time
  const getAutoTheme = () => {
    const systemTheme = getSystemTheme();
    const timeTheme = getTimeBasedTheme();
    
    // Prioritize system preference, fallback to time-based
    return systemTheme;
  };

  // Update resolved theme
  const updateResolvedTheme = (currentTheme) => {
    let newResolvedTheme;
    
    switch (currentTheme) {
      case 'light':
        newResolvedTheme = 'light';
        break;
      case 'dark':
        newResolvedTheme = 'dark';
        break;
      case 'system':
        newResolvedTheme = getSystemTheme();
        break;
      case 'auto':
        newResolvedTheme = getAutoTheme();
        break;
      default:
        newResolvedTheme = 'light';
    }
    
    setResolvedTheme(newResolvedTheme);
    
    // Apply theme to document
    if (newResolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme from localStorage or set to 'auto'
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatapp-theme') || 'auto';
    setTheme(savedTheme);
    updateResolvedTheme(savedTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system' || theme === 'auto') {
        updateResolvedTheme(theme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Auto-update theme based on time (check every minute)
  useEffect(() => {
    if (theme === 'auto') {
      const interval = setInterval(() => {
        updateResolvedTheme('auto');
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [theme]);

  // Change theme function
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('chatapp-theme', newTheme);
    updateResolvedTheme(newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  };

  const value = {
    theme,
    resolvedTheme,
    changeTheme,
    toggleTheme,
    themes: [
      { value: 'light', label: '☀️ Light', description: 'Light mode' },
      { value: 'dark', label: '🌙 Dark', description: 'Dark mode' },
      { value: 'system', label: '💻 System', description: 'Follow system preference' },
      { value: 'auto', label: '🌓 Auto', description: 'System + time-based switching' }
    ]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};