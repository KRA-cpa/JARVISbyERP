/**
 * Development Configuration
 * Controls feature toggles for development vs production
 */

const DEV_CONFIG = {
  // Authentication bypass for development
  DISABLE_AUTH: process.env.REACT_APP_DISABLE_AUTH === 'true' || process.env.NODE_ENV === 'development',

  // API configuration
  USE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA === 'true',

  // Debug features
  SHOW_DEBUG_INFO: process.env.REACT_APP_SHOW_DEBUG === 'true',

  // Development tools
  SHOW_API_PANEL: process.env.REACT_APP_SHOW_API_PANEL === 'true' || process.env.NODE_ENV === 'development'
};

// Mock user for development when auth is disabled
export const MOCK_USER = {
  uid: 'dev-user-123',
  email: 'admin@development.local',
  displayName: 'Development Admin',
  photoURL: '',
  roles: [
    {
      id: 'dev-role-1',
      name: 'System Admin',
      company_id: null
    }
  ],
  companies: [
    {
      id: 'dev-company-1',
      name: 'Development Company',
      code: 'DEV'
    }
  ]
};

export default DEV_CONFIG;