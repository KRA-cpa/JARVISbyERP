import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api/googleSheet';

/**
 * DarkModeContext
 *
 * Provides dark mode state management across the application:
 * - Syncs with user profile preferences in backend
 * - Falls back to localStorage for guest users
 * - Applies appropriate CSS classes to document
 * - Provides toggle functionality with API sync
 * - Detects system preference on first load
 */

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children, user = null }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // For authenticated users, we'll load from API later
    if (user) {
      return false; // Default until loaded from API
    }

    // For guest users, check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }

    // Fall back to system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Default to light mode
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const preferences = await API.Users.getPreferences(user.id);
        if (preferences.dark_mode !== undefined) {
          setIsDarkMode(preferences.dark_mode);
        }
      } catch (error) {
        console.warn('Failed to load user preferences, falling back to localStorage:', error);
        // Fall back to localStorage for authenticated users
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
          setIsDarkMode(JSON.parse(savedMode));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, [user?.id]);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save preference to localStorage (fallback)
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!user) {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === null) {
          setIsDarkMode(e.matches);
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [user]);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Save to user preferences if authenticated
    if (user?.id) {
      try {
        await API.Users.updatePreferences(user.id, {
          dark_mode: newMode
        });
      } catch (error) {
        console.warn('Failed to save dark mode preference to profile:', error);
        // The localStorage fallback in useEffect will still work
      }
    }
  };

  const setDarkMode = async (enabled) => {
    setIsDarkMode(enabled);

    // Save to user preferences if authenticated
    if (user?.id) {
      try {
        await API.Users.updatePreferences(user.id, {
          dark_mode: enabled
        });
      } catch (error) {
        console.warn('Failed to save dark mode preference to profile:', error);
      }
    }
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    isLoading
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

export default DarkModeContext;