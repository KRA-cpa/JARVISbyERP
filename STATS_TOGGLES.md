# Stats Display Toggle Configuration

This document explains how to control which statistics and information panels are visible in the live environment.

## Environment Variables

All stats are **shown by default**. Set any of these to `false` in your environment to hide them in production:

### Admin Dashboard Stats

```env
# Individual stat cards in admin dashboard
REACT_APP_SHOW_USER_COUNT=false          # Hide "Total Users" stat card
REACT_APP_SHOW_TICKET_COUNT=false        # Hide "Active Tickets" stat card
REACT_APP_SHOW_COMPANY_COUNT=false       # Hide "Companies" stat card
REACT_APP_SHOW_SYSTEM_HEALTH=false       # Hide "System Health" stat card

# Admin modules grid
REACT_APP_SHOW_MODULE_STATS=false        # Hide entire modules grid section

# Backend integration panel
REACT_APP_SHOW_BACKEND_INFO=false        # Hide backend integration status panel

# API testing panel
REACT_APP_SHOW_API_STATUS=false          # Hide API status and testing panel
```

### Dashboard Cards

```env
# Individual dashboard stat cards (visible to all users on dashboard)
REACT_APP_SHOW_MY_TICKETS=false          # Hide "My Tickets" card
REACT_APP_SHOW_PENDING_APPROVAL=false    # Hide "Pending Approval" card
REACT_APP_SHOW_COMPLETED=false           # Hide "Completed" card
REACT_APP_SHOW_OVERDUE=false             # Hide "Overdue" card
REACT_APP_SHOW_FOR_YOUR_APPROVAL=false   # Hide "For Your Approval" card (only shown to users with approval permissions)
```

## Usage Examples

### Hide All Stats (Clean Production UI)
```env
# Admin panel stats
REACT_APP_SHOW_USER_COUNT=false
REACT_APP_SHOW_TICKET_COUNT=false
REACT_APP_SHOW_COMPANY_COUNT=false
REACT_APP_SHOW_SYSTEM_HEALTH=false
REACT_APP_SHOW_MODULE_STATS=false
REACT_APP_SHOW_BACKEND_INFO=false
REACT_APP_SHOW_API_STATUS=false

# Dashboard cards
REACT_APP_SHOW_MY_TICKETS=false
REACT_APP_SHOW_PENDING_APPROVAL=false
REACT_APP_SHOW_COMPLETED=false
REACT_APP_SHOW_OVERDUE=false
REACT_APP_SHOW_FOR_YOUR_APPROVAL=false
```

### Show Only Essential Stats
```env
# Keep company count and system health visible
REACT_APP_SHOW_USER_COUNT=false
REACT_APP_SHOW_TICKET_COUNT=false
REACT_APP_SHOW_BACKEND_INFO=false
REACT_APP_SHOW_API_STATUS=false
# REACT_APP_SHOW_COMPANY_COUNT=true (default)
# REACT_APP_SHOW_SYSTEM_HEALTH=true (default)
# REACT_APP_SHOW_MODULE_STATS=true (default)
```

### Hide Technical Information Only
```env
# Hide technical/development information, keep business stats
REACT_APP_SHOW_BACKEND_INFO=false
REACT_APP_SHOW_API_STATUS=false
# Keep all business stats visible (user, ticket, company counts)
```

## Development Panel

The yellow development panel (bottom-right) shows the current status of all toggles:

- **Green dots**: Stats section is visible
- **Red dots**: Stats section is hidden

## Deployment Notes

1. **Vercel**: Set these environment variables in your Vercel project settings
2. **Development**: Create a `.env.local` file with your preferred settings
3. **Production**: Only set variables to `false` to hide stats (default is `true`)

## Toggle Structure

The configuration is organized in `src/config/development.js`:

```javascript
STATS_DISPLAY: {
  SHOW_USER_COUNT: process.env.REACT_APP_SHOW_USER_COUNT !== 'false',
  SHOW_TICKET_COUNT: process.env.REACT_APP_SHOW_TICKET_COUNT !== 'false',
  SHOW_COMPANY_COUNT: process.env.REACT_APP_SHOW_COMPANY_COUNT !== 'false',
  SHOW_SYSTEM_HEALTH: process.env.REACT_APP_SHOW_SYSTEM_HEALTH !== 'false',
  SHOW_MODULE_STATS: process.env.REACT_APP_SHOW_MODULE_STATS !== 'false',
  SHOW_API_STATUS: process.env.REACT_APP_SHOW_API_STATUS !== 'false',
  SHOW_BACKEND_INFO: process.env.REACT_APP_SHOW_BACKEND_INFO !== 'false'
},

DASHBOARD_CARDS: {
  SHOW_MY_TICKETS: process.env.REACT_APP_SHOW_MY_TICKETS !== 'false',
  SHOW_PENDING_APPROVAL: process.env.REACT_APP_SHOW_PENDING_APPROVAL !== 'false',
  SHOW_COMPLETED: process.env.REACT_APP_SHOW_COMPLETED !== 'false',
  SHOW_OVERDUE: process.env.REACT_APP_SHOW_OVERDUE !== 'false',
  SHOW_FOR_YOUR_APPROVAL: process.env.REACT_APP_SHOW_FOR_YOUR_APPROVAL !== 'false'
}
```

## Implementation

Each stat section is wrapped with a conditional check:

**Admin Panel Stats:**
```javascript
{DEV_CONFIG.STATS_DISPLAY.SHOW_USER_COUNT && (
  <div className="bg-white rounded-lg shadow p-6">
    {/* User count stats */}
  </div>
)}
```

**Dashboard Cards:**
```javascript
{DEV_CONFIG.DASHBOARD_CARDS.SHOW_MY_TICKETS && (
  <div className="bg-white rounded-lg shadow p-6">
    {/* My tickets card */}
  </div>
)}
```

**Special Permission Check:**
```javascript
{DEV_CONFIG.DASHBOARD_CARDS.SHOW_FOR_YOUR_APPROVAL && permissions.canApproveTickets && (
  <div className="bg-white rounded-lg shadow p-6">
    {/* For your approval card - only shown to users with approval permissions */}
  </div>
)}
```

This ensures **all functionality is preserved** but can be selectively hidden for production deployment.