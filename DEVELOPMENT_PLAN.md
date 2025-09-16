# Ticketing & Workflow Orchestration System - Development Plan

## Project Context

**Specifications**: See `CLAUDE.md` for complete functional requirements
**Database**: [Google Sheet](https://docs.google.com/spreadsheets/d/1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4/edit?usp=drive_link)
**API**: Google Apps Script Web App - **IMPLEMENTED & PRODUCTION-READY**
**Apps Script Code**: Complete MVP backend with comprehensive CRUD operations
**Spreadsheet ID**: `1EjFpr_yktSU6QAeBSAvcr6iWVtmaOCV1t5unvImmot4`

## Architecture Overview

- **Frontend**: React SPA (deployed to Vercel)
- **Database**: Google Sheet with 15+ tabs/tables (companies, roles, tickets, etc.)
- **API Layer**: Google Apps Script deployed as Web App for REST endpoints
- **Authentication**: Firebase Auth (user identity only)
- **Proof of Concept**: Serverless, cost-effective using Google Workspace tools

## Development Phases

### ✅ Phase 1: Foundation & Configuration (COMPLETED)
- [x] Environment Setup - Configure Firebase, create `.env` files, install dependencies
- [x] File Structure - Reorganize to match specs (`/pages`, `/config`, `/components`, `/api`)
- [x] Package Dependencies - Added React Router, date utilities, Firebase
- [x] Basic Routing - Set up React Router for main navigation
- [x] Project Structure - Created proper directory hierarchy matching CLAUDE.md specs

**Deliverables:**
- ✅ Directory structure: `/src/pages`, `/src/config`, `/src/components`, `/src/api`
- ✅ Dependencies installed: `react-router-dom`, `date-fns`, `firebase`
- ✅ Firebase config for authentication
- ✅ Basic page templates (Login, Dashboard, Admin)
- ✅ Environment configuration (`.env.example`)

### ✅ Phase 2: Core Shared Components (COMPLETED)
- [x] **Icons.js** - ✅ Complete SVG icon library with 30+ workflow-specific icons
- [x] **Header.js** - ✅ Navigation bar with user info, notifications, and live clock
- [x] **LiveClock.js** - ✅ Real-time UTC+8 Philippine Time with multiple formats
- [x] **LoadingScreen.js** - ✅ Reusable loading spinner with Tailwind CSS
- [x] **ActionCommentModal.js** - ✅ Modal for mandatory workflow action comments

**Phase 2 Deliverables:**
- ✅ **30+ SVG Icons**: Dashboard, Admin, Ticket, Workflow, Status, Action icons
- ✅ **Live Philippine Time**: Real-time UTC+8 clock with date/time formats
- ✅ **Responsive Header**: Navigation, notifications, user menu with role-based access
- ✅ **Action Modals**: Pre-built modals for Approve, Reject, Return, Cancel, Complete
- ✅ **Mobile-Responsive**: All components work on desktop and mobile devices

### ✅ Phase 3: Authentication & User Management (COMPLETED)
- [x] **Firebase Integration** - ✅ Complete authentication service with Google Sign-In
- [x] **LoginPage.js** - ✅ Professional Google Sign-In with error handling
- [x] **User Context** - ✅ Comprehensive state management with UserContext
- [x] **Role-based Access Control** - ✅ Multi-tenant permission system
- [x] **User Profile Management** - ✅ Header integration with user info display

**Phase 3 Deliverables:**
- ✅ **UserContext**: Complete authentication state management with roles & permissions
- ✅ **Google Sign-In**: Professional login page with error handling & system status
- ✅ **Protected Routes**: ProtectedRoute and PublicRoute components with admin access control
- ✅ **Header Integration**: User menu, notifications, and live Philippine time
- ✅ **Permission System**: Role-based access control with dynamic UI components
- ✅ **Backend Integration**: User login logging to Google Apps Script API

### ✅ Phase 4: API Integration Layer (COMPLETED)
- [x] **googleSheet.js** - ✅ Complete API client with caching and error handling
- [x] **Data Models** - ✅ JavaScript interfaces for all entity types (15+ tables)
- [x] **API Response Handling** - ✅ Comprehensive error handling and data validation
- [x] **Caching Strategy** - ✅ Local caching with TTL and automatic invalidation
- [x] **Google Apps Script Development** - ✅ **COMPLETE MVP BACKEND IMPLEMENTED**

**✅ Available API Endpoints:**
- Companies: `getCompanies`, `createCompany`, `updateCompany`, `deleteCompany`
- Roles: `getRoles`, `createRole`, `updateRole`, `deleteRole`
- Dropdowns: `getDropdownLists`, `createDropdownList`, `updateDropdownList`, `deleteDropdownList`
- Tickets: `getTickets`, `createTicket` (with auto-numbering)
- System: `recordLogin`, `ping` (health check)
- Testing: `runCompleteAPITest()`, `createSampleData()`

### Phase 5: Admin Panel Development
- [ ] **AdminPage.js** - Main admin container with navigation tabs
- [ ] **Company & Role Management** - CRUD interfaces for companies/roles
- [ ] **TicketTypeEditor.js** - Dynamic ticket type configuration
- [ ] **Workflow Builder** - Visual step-by-step workflow designer
- [ ] **Custom Field Builder** - Drag-and-drop field configuration
- [ ] **DropdownListEditor.js** - Reusable dropdown management with dependencies

### Phase 6: Ticket Management & Dashboard
- [ ] **DashboardPage.js** - Main user interface container
- [ ] **TicketDashboard.js** - List view with hierarchical chained tickets
- [ ] **TicketDetail.js** - Single ticket view with actions
- [ ] **TicketListItem.js** - Reusable ticket row component
- [ ] **SLA Indicators** - Visual status and deadline tracking

### Phase 7: Workflow Engine & Business Logic
- [ ] **Ticket Number Generation** - COMPANYCODE-TYPECODE-YEAR-SEQUENCE logic
- [ ] **Multi-step Approval Logic** - Handle "any" vs "all" approver requirements
- [ ] **Conditional Workflows** - Field-based workflow branching (stitching)
- [ ] **Chained Ticket Creation** - Automatic parallel ticket generation
- [ ] **External App Integration** - Task-based workflow pausing

### Phase 8: Reporting & Audit Features
- [ ] **Report Configuration** - Admin-defined report layouts
- [ ] **Data Export** - CSV generation and download
- [ ] **Audit Logging** - Comprehensive action tracking (ticket_action_logs, admin_action_logs)
- [ ] **SLA Monitoring** - Automated deadline tracking and alerts

### Phase 9: Testing & Deployment
- [ ] **Unit Testing** - Component and utility function tests
- [ ] **Integration Testing** - API and workflow testing
- [ ] **Performance Optimization** - Bundle analysis and optimization
- [ ] **Deployment Setup** - Vercel configuration and environment variables

## Key Database Tables (Google Sheet)

The Google Sheet contains 15+ tabs representing these core entities:

**Core Entities:**
- `companies` - Multi-tenant company definitions
- `roles` - User roles (global or company-specific)
- `tickets` - Main ticket records with workflow state
- `ticket_types` - Configurable ticket type definitions
- `users` - User accounts and profile data

**Workflow & Configuration:**
- `workflow_steps` - Approval/task step definitions
- `custom_fields` - Dynamic form field configurations
- `dropdown_lists` & `dropdown_options` - Reusable dropdown data

**Audit & Tracking:**
- `ticket_history` - User-facing action history
- `ticket_action_logs` - System-level detailed audit trail
- `admin_action_logs` - Configuration change tracking

## Google Apps Script Backend Implementation

**✅ PRODUCTION-READY FEATURES IMPLEMENTED:**

### Core API Functions
- **CRUD Operations**: Complete Create, Read, Update, Delete for all entities
- **Concurrency Control**: LockService for ticket number generation
- **Auto-Initialization**: Sheets created automatically if missing
- **Comprehensive Logging**: Admin actions and ticket actions tracked
- **Error Handling**: Proper validation and error responses

### Business Logic
- **Ticket Numbering**: `COMPANYCODE-TYPECODE-YEAR-SEQUENCE` format
- **Philippine Time**: UTC+8 timezone support with `Asia/Manila`
- **Multi-tenancy**: Company-specific data isolation
- **Audit Trail**: Detailed logging of all system changes
- **JSON Responses**: Standardized API response format with CORS

### Advanced Features
- **Hierarchical Dropdowns**: Parent-child option relationships
- **Global vs Company Roles**: Flexible role assignment system
- **Sheet Auto-Creation**: Dynamic sheet initialization
- **Test Suite**: Comprehensive testing functions included
- **Sample Data**: Built-in sample data generation

## Integration Points

1. **Google Apps Script API** - ✅ **FULLY IMPLEMENTED** RESTful endpoints
2. **Firebase Authentication** - User identity and role management
3. **Philippine Time Zone** - ✅ **IMPLEMENTED** UTC+8 for all timestamps
4. **Multi-tenant Architecture** - ✅ **IMPLEMENTED** Company-specific data isolation
5. **Conditional Workflows** - Business logic framework ready

## Backend API Endpoints Reference

### GET Endpoints
```
?action=getCompanies          - List all companies
?action=getCompany&companyId=x - Get single company
?action=getRoles&companyId=x   - List roles (optional company filter)
?action=getDropdownLists       - List all dropdown lists with options
?action=getDropdownOptions&listId=x - Get options for specific list
?action=getTickets&status=x    - List tickets (optional status filter)
?action=ping                   - API health check
```

### POST Endpoints
```
action: createCompany    - payload: {name, code}
action: updateCompany    - payload: {id, name, code}
action: deleteCompany    - payload: {id}
action: createRole       - payload: {name, company_id}
action: updateRole       - payload: {id, name, company_id}
action: deleteRole       - payload: {id}
action: createDropdownList - payload: {name, options[]}
action: updateDropdownList - payload: {id, name, options[]}
action: deleteDropdownList - payload: {id}
action: createTicket     - payload: {title, ticket_type_id, company_id, requester_id, customData}
action: recordLogin      - payload: {userId, email, ipAddress}
```

## Current Status

**Phase 1**: ✅ COMPLETED - Project foundation and structure established
**Phase 2**: ✅ COMPLETED - Core shared components built and ready
**Phase 3**: ✅ COMPLETED - Authentication and user management system
**Phase 4**: ✅ COMPLETED - API integration layer with Google Sheets backend
**Backend API**: ✅ **PRODUCTION-READY** - Complete MVP implementation available
**Current Status**: Ready for Phase 5 - Admin Panel Development

## Phase 3 Authentication Documentation

### 🔐 UserContext.js - Authentication State Management
- **Firebase Integration**: Google Sign-In with popup authentication
- **Role-based Permissions**: Dynamic permission calculation based on user roles
- **Multi-tenant Support**: Company-specific role assignments
- **Error Handling**: Comprehensive error states and user feedback
- **Backend Logging**: Automatic user login tracking via Apps Script API

### 🚪 LoginPage.js - Professional Sign-In Experience
- **Google OAuth**: Official Google Sign-In button with branded styling
- **Loading States**: Spinner animations during authentication
- **Error Display**: User-friendly error messages with dismiss functionality
- **System Status**: Real-time system health indicators
- **Feature Overview**: Built-in feature showcase for new users

### 🛡️ Protected Routes & Access Control
- **ProtectedRoute**: Automatic redirect to login for unauthenticated users
- **AdminRoute**: Admin-only access with role verification
- **PublicRoute**: Automatic redirect to dashboard for authenticated users
- **Permission Checks**: Dynamic UI based on user permissions

### 📊 Enhanced Dashboard & Admin Pages
- **User-Specific Content**: Welcome messages with user information
- **Role-based UI**: Different interfaces based on user permissions
- **Live Data**: Real-time Philippine Time and system status
- **Notification System**: Mock notification system ready for backend integration

## Phase 2 Component Documentation

### 🎨 Icons.js - SVG Icon Library
- **30+ Icons**: Complete set for ticketing workflow (Dashboard, Admin, Ticket, Status, Actions)
- **Customizable**: Size and className props for styling flexibility
- **Semantic**: Named for specific use cases (Approval, Pending, Overdue, etc.)
- **Usage**: `import Icons from './Icons'; <Icons.Dashboard size={20} className="text-blue-600" />`

### 🕰️ LiveClock.js - Philippine Time Display
- **Real-time**: Updates every second with Philippine Time (UTC+8)
- **Multiple Formats**: Compact, Detailed, Header versions
- **Date Integration**: Shows day, date, timezone information
- **Responsive**: Different sizes for different UI contexts

### 🧡 Header.js - Navigation Component
- **Role-based Navigation**: Shows Admin panel only for admin users
- **Live Clock Integration**: Philippine time display in header
- **Notifications**: Dropdown with unread count and recent notifications
- **User Menu**: Profile, settings, logout with user info display
- **Mobile Responsive**: Collapsible navigation for mobile devices

### 💬 ActionCommentModal.js - Workflow Actions
- **Comment Validation**: Required/optional comments for different actions
- **Pre-configured Modals**: ApprovalModal, RejectModal, ReturnModal, etc.
- **Keyboard Shortcuts**: Ctrl+Enter to submit, Escape to cancel
- **Action-specific Styling**: Different colors and icons per action type
- **Character Limits**: Built-in validation and character counting

---

## Ready for Phase 3: Authentication & User Management

With Phase 2 complete, we now have:
- ✅ **Complete UI Foundation**: All shared components ready
- ✅ **Production Backend**: Google Apps Script API fully implemented
- ✅ **Philippine Time Support**: Built-in UTC+8 timezone handling
- ✅ **Workflow Components**: Action modals and status indicators
- ✅ **Responsive Design**: Mobile and desktop compatibility

Next: Implement Firebase Authentication and integrate with the backend API.

## Phase 4 API Integration Documentation

### 📡 googleSheet.js - Complete API Client
- **Comprehensive API Client**: Full integration with Google Apps Script backend
- **Caching Layer**: TTL-based caching with automatic invalidation
- **Error Handling**: Retry logic, timeout handling, and fallback to mock data
- **Request Optimization**: Batched requests and debouncing for performance
- **Mock Data Support**: Built-in fallback data for development and testing

### 📋 models.js - Data Models & Validation
- **Complete Type Definitions**: JSDoc types for all 15+ database entities
- **Validation Utilities**: Built-in validation functions for data integrity
- **Relationships**: Proper foreign key relationships between entities
- **Utility Functions**: Helper functions for data transformation and formatting

### 🎮 useAPI.js - React Hooks
- **Data Fetching Hooks**: `useCompanies()`, `useRoles()`, `useDropdownLists()`
- **Loading States**: Built-in loading, error, and success state management
- **Cache Integration**: Automatic cache invalidation and data freshening
- **Real-time Updates**: Optimized for live data updates

## Recent Production Enhancements (September 2025)

### 🔧 Configuration & Toggle System
- **Environment-based Toggles**: Production-ready feature flag system
- **Stats Display Control**: Hide/show dashboard statistics via environment variables
- **Dashboard Card Arrangement**: Toggle individual dashboard cards (My Tickets, Pending, Completed, Overdue, For Your Approval)
- **Development Panel**: Real-time configuration status monitoring
- **Direct Access Toggle**: Bypass authentication during setup phase (`REACT_APP_ALLOW_DIRECT_ACCESS`)

### 🎨 UI/UX Improvements
- **Sticky Header**: Fixed navigation header for improved user experience
- **Philippine Time Format**: Standardized to "DD Mmm YYYY HH:MM:SS AM/PM"
- **Responsive Grid Layout**: Dashboard cards adapt from 4 to 5 column layout
- **Admin Role Detection**: Improved role matching with `.includes('admin')`
- **Unauthorized Page**: Professional access denied page with navigation options

### 🔐 Authentication & Routing Enhancements
- **Smart Root Redirect**: Intelligent routing based on authentication status
- **Protected Route System**: Enhanced route protection with admin access control
- **Flexible Auth Configuration**: Multiple authentication bypass options for development
- **Production Safety**: Clear warnings and guidance for production deployment

### 📊 Dashboard Features
- **5 Dashboard Cards**: My Tickets, Pending Approval, Completed, Overdue, For Your Approval
- **Permission-based Display**: Cards shown based on user permissions
- **Toggle Control**: Each card can be hidden via environment variables
- **Real-time Data**: Integration ready for live backend data

### 🛠️ Development Tools
- **DevPanel**: Comprehensive development status panel
- **Environment Monitoring**: Real-time display of all configuration toggles
- **Production Warnings**: Clear alerts for development-only settings
- **Quick Actions**: Fast navigation and reload functionality

## Environment Configuration

### 🔧 Available Toggles
```env
# Authentication Control
REACT_APP_DISABLE_AUTH=true              # Bypass all authentication
REACT_APP_ALLOW_DIRECT_ACCESS=true       # Allow direct page access (setup phase)

# Data & Debug
REACT_APP_USE_MOCK_DATA=true             # Use mock data instead of API
REACT_APP_SHOW_DEBUG=true                # Show debug information
REACT_APP_SHOW_API_PANEL=true            # Display API testing panel

# Admin Dashboard Stats
REACT_APP_SHOW_USER_COUNT=false          # Hide "Total Users" stat
REACT_APP_SHOW_TICKET_COUNT=false        # Hide "Active Tickets" stat
REACT_APP_SHOW_COMPANY_COUNT=false       # Hide "Companies" stat
REACT_APP_SHOW_SYSTEM_HEALTH=false       # Hide "System Health" stat
REACT_APP_SHOW_MODULE_STATS=false        # Hide modules grid
REACT_APP_SHOW_BACKEND_INFO=false        # Hide backend integration panel

# Dashboard Cards
REACT_APP_SHOW_MY_TICKETS=false          # Hide "My Tickets" card
REACT_APP_SHOW_PENDING_APPROVAL=false    # Hide "Pending Approval" card
REACT_APP_SHOW_COMPLETED=false           # Hide "Completed" card
REACT_APP_SHOW_OVERDUE=false             # Hide "Overdue" card
REACT_APP_SHOW_FOR_YOUR_APPROVAL=false   # Hide "For Your Approval" card
```

### 🚀 Deployment Modes

**Development Mode:**
```env
REACT_APP_DISABLE_AUTH=true
REACT_APP_USE_MOCK_DATA=true
REACT_APP_SHOW_DEBUG=true
```

**Setup Phase (Live Testing):**
```env
REACT_APP_ALLOW_DIRECT_ACCESS=true
REACT_APP_DISABLE_AUTH=false
REACT_APP_USE_MOCK_DATA=false
```

**Production Mode:**
```env
REACT_APP_ALLOW_DIRECT_ACCESS=false
REACT_APP_DISABLE_AUTH=false
REACT_APP_USE_MOCK_DATA=false
# Hide development stats as needed
```

## Technical Architecture

### 🏗️ File Structure
```
src/
├── api/
│   ├── googleSheet.js     # API client with caching
│   ├── models.js          # Data models & validation
│   └── hooks/
│       └── useAPI.js      # React hooks for data fetching
├── components/
│   ├── shared/
│   │   ├── Header.js      # Sticky navigation header
│   │   ├── DevPanel.js    # Development status panel
│   │   ├── LiveClock.js   # Philippine time display
│   │   └── Icons.js       # SVG icon library
├── contexts/
│   └── UserContext.js     # Authentication state management
├── pages/
│   ├── DashboardPage.js   # Main user dashboard
│   ├── AdminPage.js       # Admin panel
│   ├── LoginPage.js       # Authentication page
│   └── UnauthorizedPage.js # Access denied page
└── config/
    └── development.js     # Feature toggles & configuration
```

### 🔄 Data Flow
1. **Authentication**: Firebase Auth → UserContext → Role Assignment
2. **API Calls**: Component → useAPI Hook → googleSheet.js → Cache/Backend
3. **State Management**: UserContext + Local State + API Cache
4. **Configuration**: Environment Variables → development.js → Components

## Next Steps: Phase 5 - Admin Panel Development

### 🎯 Immediate Goals
1. **Company Management UI**: CRUD interface for companies
2. **Role Management UI**: User role assignment and permissions
3. **Dropdown List Editor**: Manage system dropdown options
4. **Real Data Integration**: Connect admin interfaces to Google Sheets API
5. **Testing & Validation**: Ensure all CRUD operations work correctly

### 🚀 Phase 5 Implementation Plan
- **AdminCompanyManager.js**: Company CRUD with validation
- **AdminRoleManager.js**: Role management with permission preview
- **AdminDropdownManager.js**: Hierarchical dropdown configuration
- **AdminDashboard.js**: Overview with real-time statistics
- **Integration Testing**: End-to-end workflow validation

### 📈 Success Metrics
- ✅ Full CRUD operations for companies, roles, and dropdowns
- ✅ Real-time data synchronization with Google Sheets
- ✅ Proper error handling and user feedback
- ✅ Mobile-responsive admin interfaces
- ✅ Production-ready with proper access controls

*Last Updated: September 16, 2025*