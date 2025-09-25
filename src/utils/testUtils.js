/**
 * Test Utilities for React Testing Library
 * Provides common test helpers and mocks for the ticketing system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from '../contexts/UserContext';
import { DarkModeProvider } from '../contexts/DarkModeContext';

// Mock Firebase
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true
  },
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
};

// Mock API responses
export const mockAPIResponses = {
  companies: {
    success: true,
    data: [
      {
        id: 'comp_1',
        name: 'Test Company',
        code: 'TEST',
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ]
  },
  users: {
    success: true,
    data: [
      {
        id: 'user_1',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['admin']
      }
    ]
  },
  tickets: {
    success: true,
    data: [
      {
        id: 'ticket_1',
        ticket_number: 'TEST-REQ-2025-00000001',
        title: 'Test Ticket',
        status: 'New',
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ]
  },
  ticketTypes: {
    success: true,
    data: [
      {
        id: 'tt_1',
        name: 'Purchase Request',
        code: 'REQ',
        description: 'Purchase request workflow'
      }
    ]
  },
  roles: {
    success: true,
    data: [
      {
        id: 'role_1',
        name: 'admin',
        company_id: null
      }
    ]
  },
  dropdowns: {
    success: true,
    data: [
      {
        id: 'dropdown_1',
        name: 'Priority Levels',
        options: ['Low', 'Medium', 'High', 'Critical']
      }
    ]
  }
};

// Mock fetch responses
export const createMockFetch = (responses = {}) => {
  return jest.fn((url) => {
    const urlObj = new URL(url);
    const action = urlObj.searchParams.get('action');

    const mockResponse = responses[action] || { success: false, error: 'Not mocked' };

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse)
    });
  });
};

// Test wrapper with all providers
export const TestWrapper = ({ children, initialUser = null, darkMode = false }) => {
  const mockUser = initialUser || {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  return (
    <BrowserRouter>
      <UserProvider>
        <DarkModeProvider user={mockUser}>
          {children}
        </DarkModeProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialUser, darkMode = false, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialUser={initialUser} darkMode={darkMode}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions
  });
};

// Common test data generators
export const generateTestData = {
  user: (overrides = {}) => ({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    ...overrides
  }),

  company: (overrides = {}) => ({
    id: 'comp_test',
    name: 'Test Company',
    code: 'TEST',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  ticket: (overrides = {}) => ({
    id: 'ticket_test',
    ticket_number: 'TEST-REQ-2025-00000001',
    title: 'Test Ticket',
    ticket_type_id: 'tt_1',
    requester_id: 'user_1',
    status: 'New',
    current_step_id: 'step_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  ticketType: (overrides = {}) => ({
    id: 'tt_test',
    name: 'Test Ticket Type',
    code: 'TEST',
    description: 'Test ticket type for testing',
    is_active: true,
    require_attachment_on_create: false,
    company_id: null,
    ...overrides
  })
};

// API testing helpers
export const mockAPI = {
  setupMocks: () => {
    global.fetch = createMockFetch({
      getCompanies: mockAPIResponses.companies,
      getUsers: mockAPIResponses.users,
      getTickets: mockAPIResponses.tickets,
      getTicketTypes: mockAPIResponses.ticketTypes,
      getRoles: mockAPIResponses.roles,
      getDropdownLists: mockAPIResponses.dropdowns,
      ping: { success: true, message: 'API connection successful' }
    });
  },

  setupFailure: (action) => {
    global.fetch = createMockFetch({
      [action]: { success: false, error: 'Test API failure' }
    });
  },

  setupTimeout: () => {
    global.fetch = jest.fn(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );
  }
};

// Component testing helpers
export const testHelpers = {
  // Wait for loading to complete
  waitForLoading: async () => {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  },

  // Check for error messages
  expectError: (message) => {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
  },

  // Check for success messages
  expectSuccess: (message) => {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
  },

  // Fill form field
  fillField: async (labelText, value) => {
    const field = screen.getByLabelText(new RegExp(labelText, 'i'));
    await userEvent.clear(field);
    await userEvent.type(field, value);
  },

  // Click button
  clickButton: async (buttonText) => {
    const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await userEvent.click(button);
  },

  // Select from dropdown
  selectOption: async (selectLabel, optionText) => {
    const select = screen.getByLabelText(new RegExp(selectLabel, 'i'));
    await userEvent.selectOptions(select, optionText);
  }
};

// Performance testing helpers
export const performanceHelpers = {
  measureRenderTime: (component) => {
    const start = performance.now();
    render(component);
    const end = performance.now();
    return end - start;
  },

  expectRenderTime: (component, maxMs = 100) => {
    const renderTime = performanceHelpers.measureRenderTime(component);
    expect(renderTime).toBeLessThan(maxMs);
  }
};

// Accessibility testing helpers
export const a11yHelpers = {
  expectAccessibleName: (element, name) => {
    expect(element).toHaveAccessibleName(name);
  },

  expectKeyboardNavigation: async (elements) => {
    for (let i = 0; i < elements.length; i++) {
      fireEvent.keyDown(document.activeElement, { key: 'Tab' });
      await waitFor(() => {
        expect(elements[i]).toHaveFocus();
      });
    }
  }
};

export default {
  renderWithProviders,
  generateTestData,
  mockAPI,
  testHelpers,
  performanceHelpers,
  a11yHelpers,
  mockFirebaseAuth,
  mockAPIResponses
};