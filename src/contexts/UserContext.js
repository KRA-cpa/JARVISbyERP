import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// User Context
const UserContext = createContext();

// Action Types
const USER_ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_USER_ROLES: 'SET_USER_ROLES',
  SET_USER_COMPANIES: 'SET_USER_COMPANIES',
  SET_CURRENT_COMPANY: 'SET_CURRENT_COMPANY',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT'
};

// Initial State
const initialState = {
  user: null,
  loading: true,
  error: null,
  userRoles: [],
  userCompanies: [],
  currentCompany: null,
  permissions: {},
  isAdmin: false,
  isAuthenticated: false
};

// User Reducer
function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case USER_ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };

    case USER_ACTION_TYPES.SET_USER_ROLES:
      const roles = action.payload || [];
      const isAdmin = roles.some(role => role.name.toLowerCase() === 'admin');

      return {
        ...state,
        userRoles: roles,
        isAdmin,
        permissions: calculatePermissions(roles)
      };

    case USER_ACTION_TYPES.SET_USER_COMPANIES:
      const companies = action.payload || [];
      return {
        ...state,
        userCompanies: companies,
        currentCompany: state.currentCompany || (companies.length > 0 ? companies[0] : null)
      };

    case USER_ACTION_TYPES.SET_CURRENT_COMPANY:
      return {
        ...state,
        currentCompany: action.payload
      };

    case USER_ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case USER_ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case USER_ACTION_TYPES.LOGOUT:
      return {
        ...initialState,
        loading: false
      };

    default:
      return state;
  }
}

// Helper function to calculate user permissions
function calculatePermissions(roles) {
  const permissions = {
    canAccessAdmin: false,
    canCreateTickets: false,
    canApproveTickets: false,
    canManageCompanies: false,
    canManageRoles: false,
    canManageTicketTypes: false,
    canViewReports: false,
    canManageDropdowns: false
  };

  roles.forEach(role => {
    const roleName = role.name.toLowerCase();

    switch (roleName) {
      case 'admin':
      case 'global admin':
        // Admins have all permissions
        Object.keys(permissions).forEach(key => {
          permissions[key] = true;
        });
        break;

      case 'manager':
        permissions.canCreateTickets = true;
        permissions.canApproveTickets = true;
        permissions.canViewReports = true;
        break;

      case 'user':
      case 'employee':
        permissions.canCreateTickets = true;
        break;

      case 'approver':
        permissions.canApproveTickets = true;
        permissions.canViewReports = true;
        break;

      case 'finance':
      case 'hr':
      case 'it':
        permissions.canCreateTickets = true;
        permissions.canApproveTickets = true;
        permissions.canViewReports = true;
        break;

      default:
        // Custom roles - basic permissions
        permissions.canCreateTickets = true;
        break;
    }
  });

  return permissions;
}

// User Provider Component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        dispatch({ type: USER_ACTION_TYPES.SET_USER, payload: firebaseUser });

        // Fetch user roles and companies from backend
        await fetchUserData(firebaseUser);

        // Log login to backend
        try {
          await logUserLogin(firebaseUser);
        } catch (error) {
          console.warn('Failed to log user login:', error);
        }
      } else {
        dispatch({ type: USER_ACTION_TYPES.LOGOUT });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user roles and companies from backend
  const fetchUserData = async (user) => {
    try {
      // Mock API call - replace with actual backend integration
      // This would normally call your Google Apps Script API

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user roles - replace with actual API call
      const mockRoles = [
        {
          id: 'role_1',
          name: 'Admin',
          company_id: null, // Global role
          ticket_type_id: null
        }
      ];

      // Mock user companies - replace with actual API call
      const mockCompanies = [
        {
          id: 'comp_1',
          name: 'Main Corporation',
          code: 'MAIN'
        },
        {
          id: 'comp_2',
          name: 'Tech Solutions Inc.',
          code: 'TECH'
        }
      ];

      dispatch({ type: USER_ACTION_TYPES.SET_USER_ROLES, payload: mockRoles });
      dispatch({ type: USER_ACTION_TYPES.SET_USER_COMPANIES, payload: mockCompanies });

    } catch (error) {
      console.error('Error fetching user data:', error);
      dispatch({ type: USER_ACTION_TYPES.SET_ERROR, payload: 'Failed to load user data' });
    }
  };

  // Log user login to backend
  const logUserLogin = async (user) => {
    const API_BASE_URL = process.env.REACT_APP_GAS_API_URL;

    if (!API_BASE_URL) {
      console.warn('No API URL configured');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordLogin',
          payload: {
            userId: user.uid,
            email: user.email,
            ipAddress: 'N/A' // Could get from a service
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to log user login');
      }
    } catch (error) {
      console.error('Error logging user login:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      dispatch({ type: USER_ACTION_TYPES.SET_LOADING, payload: true });
      dispatch({ type: USER_ACTION_TYPES.CLEAR_ERROR });

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);

      // User will be set automatically by the auth state listener
      return result.user;

    } catch (error) {
      let errorMessage = 'Failed to sign in with Google';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked by browser. Please allow popups and try again.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in cancelled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in with Google';
      }

      dispatch({ type: USER_ACTION_TYPES.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: USER_ACTION_TYPES.LOGOUT });
    } catch (error) {
      console.error('Error signing out:', error);
      dispatch({ type: USER_ACTION_TYPES.SET_ERROR, payload: 'Failed to sign out' });
    }
  };

  // Switch company context
  const switchCompany = (company) => {
    dispatch({ type: USER_ACTION_TYPES.SET_CURRENT_COMPANY, payload: company });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: USER_ACTION_TYPES.CLEAR_ERROR });
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return state.permissions[permission] || false;
  };

  // Check if user can access specific company
  const canAccessCompany = (companyId) => {
    return state.userCompanies.some(company => company.id === companyId);
  };

  // Get user role for specific company
  const getUserRoleForCompany = (companyId) => {
    return state.userRoles.find(role =>
      role.company_id === companyId || role.company_id === null
    );
  };

  const value = {
    // State
    ...state,

    // Actions
    signInWithGoogle,
    logout,
    switchCompany,
    clearError,

    // Utilities
    hasPermission,
    canAccessCompany,
    getUserRoleForCompany
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};

// HOC for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useUser();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Access denied. Please sign in.</div>;
    }

    return <Component {...props} />;
  };
};

// HOC for admin-only routes
export const withAdminAuth = (Component) => {
  return function AdminAuthenticatedComponent(props) {
    const { isAuthenticated, isAdmin, loading } = useUser();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Access denied. Please sign in.</div>;
    }

    if (!isAdmin) {
      return <div>Access denied. Admin privileges required.</div>;
    }

    return <Component {...props} />;
  };
};

export default UserContext;