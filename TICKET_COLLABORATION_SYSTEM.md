# Ticket Collaboration & Viewing Permissions System
**Date**: September 27, 2025
**Status**: Design Specification - Using Universal Entity Architecture
**Purpose**: Design collaborative ticket viewing and permission system

## 🤝 Ticket Collaboration Overview

### **Feature Requirements:**
- **Per-ticket collaboration**: Users can be granted access to view specific tickets
- **Per-ticket-type collaboration**: Users can view all tickets of certain types
- **Per-tag collaboration**: Users can view tickets with specific tags (different ticket types)
- **Granular permissions**: View-only vs comment vs full access
- **Department-based sharing**: Automatic sharing based on department rules

## 🔐 Collaboration Permission Levels

### **Permission Hierarchy:**
```javascript
const COLLABORATION_PERMISSIONS = {
  NONE: 'none',           // No access (default)
  VIEW: 'view',           // Can view ticket details
  COMMENT: 'comment',     // Can view + add comments
  UPDATE: 'update',       // Can view + comment + update fields
  FULL: 'full'            // Can view + comment + update + workflow actions
};
```

### **Access Grant Types:**
```javascript
const ACCESS_GRANT_TYPES = {
  INDIVIDUAL_TICKET: 'individual',    // Access to specific ticket
  TICKET_TYPE: 'ticket_type',         // Access to all tickets of a type
  TAG_BASED: 'tag_based',            // Access to tickets with specific tags
  DEPARTMENT: 'department',           // Access based on department rules
  COMPANY_WIDE: 'company_wide'       // Access to all company tickets
};
```

## 🗄️ Database Schema Changes

### **1. New Collaboration Tables:**

#### **ticket_collaborators:**
```sql
-- Individual ticket access grants
ticket_collaborators:
id|ticket_id|user_id|permission_level|granted_by|granted_at|access_reason|expiry_date|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- tc_001|ticket_123|user_456|view|user_admin|2025-09-27T10:00:00Z|shared_by_requester|2025-12-31T23:59:59Z|true|...
-- tc_002|ticket_124|user_789|comment|user_manager|2025-09-27T11:00:00Z|department_policy||true|...
```

#### **ticket_type_collaborators:**
```sql
-- Ticket type access grants
ticket_type_collaborators:
id|ticket_type_id|user_id|permission_level|granted_by|granted_at|access_reason|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- ttc_001|tt_hr_leave|user_hr_team|update|admin_123|2025-09-27T09:00:00Z|hr_department_access|true|...
-- ttc_002|tt_finance_expense|user_accounting|comment|admin_456|2025-09-27T09:30:00Z|accounting_oversight|true|...
```

#### **tag_based_collaborators:**
```sql
-- Tag-based access grants (using Universal Entity Architecture)
tag_based_collaborators:
id|tag_name|user_id|permission_level|granted_by|granted_at|access_reason|company_id|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- tbc_001|#security|user_security_team|full|admin_789|2025-09-27T08:00:00Z|security_oversight|comp_123|true|...
-- tbc_002|#urgent|user_manager|view|admin_456|2025-09-27T08:30:00Z|urgent_monitoring|comp_123|true|...
```

#### **department_collaboration_rules:**
```sql
-- Department-based automatic sharing rules
department_collaboration_rules:
id|department_id|target_department_id|ticket_type_id|tag_pattern|permission_level|rule_type|is_active|created_at|created_by|updated_at|updated_by|deactivated_at|deactivated_by|deactivation_reason

-- Examples:
-- dcr_001|dept_hr|dept_payroll|tt_hr_leave||view|department_to_department|true|...
-- dcr_002|dept_any|dept_security||#security|view|tag_pattern|true|...
```

### **2. Enhanced Existing Tables:**

#### **Enhanced tickets table:**
```sql
-- Add collaboration tracking columns
tickets (add columns):
... existing columns ...|collaboration_enabled|public_within_company|collaboration_count|last_shared_at

-- Examples:
-- ticket_123: collaboration_enabled=true, public_within_company=false, collaboration_count=3, last_shared_at=2025-09-27T15:30:00Z
```

## 🔧 AppScript Backend Implementation

### **1. Collaboration Management Functions:**

#### **Individual Ticket Collaboration:**
```javascript
// Grant access to specific ticket
function grantTicketAccess(ticketId, userId, permissionLevel, grantedBy, reason, expiryDate = null) {
  try {
    const collaboratorsSheet = getSheet('ticket_collaborators');
    const now = new Date().toISOString();

    // Check if access already exists
    const existingAccess = getTicketCollaborator(ticketId, userId);
    if (existingAccess && existingAccess.is_active) {
      // Update existing access
      return updateTicketCollaborator(existingAccess.id, permissionLevel, reason, expiryDate);
    }

    // Create new access grant
    const newRow = [
      generateUniqueId(),
      ticketId,
      userId,
      permissionLevel,
      grantedBy,
      now,
      reason,
      expiryDate,
      true, // is_active
      now,
      grantedBy,
      now,
      grantedBy,
      null, // deactivated_at
      null, // deactivated_by
      null  // deactivation_reason
    ];

    collaboratorsSheet.appendRow(newRow);

    // Update ticket collaboration count
    updateTicketCollaborationCount(ticketId);

    return { success: true, access_granted: true };
  } catch (error) {
    console.error('Error granting ticket access:', error);
    return { success: false, error: error.message };
  }
}

// Revoke access to specific ticket
function revokeTicketAccess(ticketId, userId, revokedBy, reason = 'access_revoked') {
  try {
    const collaboratorsSheet = getSheet('ticket_collaborators');
    const data = collaboratorsSheet.getDataRange().getValues();
    const now = new Date().toISOString();

    // Find and deactivate access
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === ticketId && row[2] === userId && row[8] === true) { // is_active
        collaboratorsSheet.getRange(i + 1, 9).setValue(false); // is_active
        collaboratorsSheet.getRange(i + 1, 13).setValue(now); // deactivated_at
        collaboratorsSheet.getRange(i + 1, 14).setValue(revokedBy); // deactivated_by
        collaboratorsSheet.getRange(i + 1, 15).setValue(reason); // deactivation_reason
        break;
      }
    }

    // Update ticket collaboration count
    updateTicketCollaborationCount(ticketId);

    return { success: true, access_revoked: true };
  } catch (error) {
    console.error('Error revoking ticket access:', error);
    return { success: false, error: error.message };
  }
}

// Get user's accessible tickets
function getUserAccessibleTickets(userId, companyId = null) {
  try {
    const ticketsSheet = getSheet('tickets');
    const collaboratorsSheet = getSheet('ticket_collaborators');
    const typeCollaboratorsSheet = getSheet('ticket_type_collaborators');
    const tagCollaboratorsSheet = getSheet('tag_based_collaborators');

    const ticketsData = ticketsSheet.getDataRange().getValues();
    const now = new Date().toISOString();
    const accessibleTickets = [];

    // Get individual ticket access
    const individualAccess = getIndividualTicketAccess(userId);

    // Get ticket type access
    const typeAccess = getTicketTypeAccess(userId);

    // Get tag-based access
    const tagAccess = getTagBasedAccess(userId);

    // Check each ticket for access
    ticketsData.slice(1).forEach(ticketRow => {
      const ticket = {
        id: ticketRow[0],
        ticket_number: ticketRow[1],
        title: ticketRow[2],
        ticket_type_id: ticketRow[3],
        requester_id: ticketRow[4],
        status: ticketRow[5],
        company_id: ticketRow[8],
        tag_summary: ticketRow[9] || '',
        created_at: ticketRow[11]
      };

      // Skip if wrong company
      if (companyId && ticket.company_id !== companyId) return;

      let access = null;
      let accessType = null;

      // Check if user is requester
      if (ticket.requester_id === userId) {
        access = { permission_level: 'full', access_reason: 'ticket_requester' };
        accessType = 'requester';
      }
      // Check individual ticket access
      else if (individualAccess[ticket.id]) {
        const ticketAccess = individualAccess[ticket.id];
        // Check if not expired
        if (!ticketAccess.expiry_date || new Date(ticketAccess.expiry_date) > new Date()) {
          access = ticketAccess;
          accessType = 'individual';
        }
      }
      // Check ticket type access
      else if (typeAccess[ticket.ticket_type_id]) {
        access = typeAccess[ticket.ticket_type_id];
        accessType = 'ticket_type';
      }
      // Check tag-based access
      else if (ticket.tag_summary) {
        const ticketTags = ticket.tag_summary.split(',').map(tag => tag.trim());
        for (const tag of ticketTags) {
          if (tagAccess[tag]) {
            access = tagAccess[tag];
            accessType = 'tag_based';
            break;
          }
        }
      }

      if (access) {
        accessibleTickets.push({
          ...ticket,
          collaboration_access: {
            permission_level: access.permission_level,
            access_type: accessType,
            access_reason: access.access_reason,
            granted_by: access.granted_by,
            granted_at: access.granted_at
          }
        });
      }
    });

    return { success: true, tickets: accessibleTickets, count: accessibleTickets.length };
  } catch (error) {
    console.error('Error getting accessible tickets:', error);
    return { success: false, error: error.message };
  }
}

// Check specific ticket access for user
function checkTicketAccess(ticketId, userId) {
  try {
    const ticket = getTicketById(ticketId);
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Check if user is requester
    if (ticket.requester_id === userId) {
      return {
        success: true,
        has_access: true,
        permission_level: 'full',
        access_type: 'requester',
        access_reason: 'ticket_requester'
      };
    }

    // Check individual access
    const individualAccess = getTicketCollaborator(ticketId, userId);
    if (individualAccess && individualAccess.is_active) {
      // Check expiry
      if (!individualAccess.expiry_date || new Date(individualAccess.expiry_date) > new Date()) {
        return {
          success: true,
          has_access: true,
          permission_level: individualAccess.permission_level,
          access_type: 'individual',
          access_reason: individualAccess.access_reason,
          granted_by: individualAccess.granted_by,
          expiry_date: individualAccess.expiry_date
        };
      }
    }

    // Check ticket type access
    const typeAccess = getTicketTypeCollaborator(ticket.ticket_type_id, userId);
    if (typeAccess && typeAccess.is_active) {
      return {
        success: true,
        has_access: true,
        permission_level: typeAccess.permission_level,
        access_type: 'ticket_type',
        access_reason: typeAccess.access_reason,
        granted_by: typeAccess.granted_by
      };
    }

    // Check tag-based access
    if (ticket.tag_summary) {
      const ticketTags = ticket.tag_summary.split(',').map(tag => tag.trim());
      for (const tag of ticketTags) {
        const tagAccess = getTagBasedCollaborator(tag, userId);
        if (tagAccess && tagAccess.is_active) {
          return {
            success: true,
            has_access: true,
            permission_level: tagAccess.permission_level,
            access_type: 'tag_based',
            access_reason: tagAccess.access_reason,
            tag_name: tag,
            granted_by: tagAccess.granted_by
          };
        }
      }
    }

    return {
      success: true,
      has_access: false,
      permission_level: 'none',
      access_type: 'none'
    };
  } catch (error) {
    console.error('Error checking ticket access:', error);
    return { success: false, error: error.message };
  }
}
```

#### **Tag-Based Collaboration (Universal Entity Integration):**
```javascript
// Grant tag-based access using Universal Entity Architecture
function grantTagBasedAccess(tagName, userId, permissionLevel, grantedBy, reason, companyId) {
  try {
    const tagCollaboratorsSheet = getSheet('tag_based_collaborators');
    const now = new Date().toISOString();

    // Normalize tag name
    const normalizedTag = tagName.toLowerCase().startsWith('#') ? tagName.toLowerCase() : '#' + tagName.toLowerCase();

    // Check if access already exists
    const existingAccess = getTagBasedCollaborator(normalizedTag, userId);
    if (existingAccess && existingAccess.is_active) {
      // Update existing access
      return updateTagBasedCollaborator(existingAccess.id, permissionLevel, reason);
    }

    // Create new tag-based access
    const newRow = [
      generateUniqueId(),
      normalizedTag,
      userId,
      permissionLevel,
      grantedBy,
      now,
      reason,
      companyId,
      true, // is_active
      now,
      grantedBy,
      now,
      grantedBy,
      null, // deactivated_at
      null, // deactivated_by
      null  // deactivation_reason
    ];

    tagCollaboratorsSheet.appendRow(newRow);

    return { success: true, tag_access_granted: true, tag_name: normalizedTag };
  } catch (error) {
    console.error('Error granting tag-based access:', error);
    return { success: false, error: error.message };
  }
}

// Get tickets accessible by tag-based permissions
function getTicketsByTagAccess(userId) {
  try {
    const tagCollaboratorsSheet = getSheet('tag_based_collaborators');
    const ticketsSheet = getSheet('tickets');
    const tagsSheet = getSheet('ticket_tags');

    // Get user's tag-based access
    const tagAccessData = tagCollaboratorsSheet.getDataRange().getValues();
    const userTagAccess = tagAccessData.slice(1)
      .filter(row => row[2] === userId && row[8] === true) // user_id and is_active
      .map(row => ({
        tag_name: row[1],
        permission_level: row[3],
        access_reason: row[6]
      }));

    if (userTagAccess.length === 0) {
      return { success: true, tickets: [], count: 0 };
    }

    // Get tickets with those tags
    const tagsData = tagsSheet.getDataRange().getValues();
    const ticketsData = ticketsSheet.getDataRange().getValues();

    const accessibleTicketIds = new Set();
    const tagAccessMap = {};

    // Build tag access map
    userTagAccess.forEach(access => {
      tagAccessMap[access.tag_name] = access;
    });

    // Find tickets with accessible tags
    tagsData.slice(1).forEach(tagRow => {
      if (tagRow[6] === true) { // is_active
        const tagName = tagRow[2]; // tag_name
        const ticketId = tagRow[1]; // ticket_id

        if (tagAccessMap[tagName]) {
          accessibleTicketIds.add(ticketId);
        }
      }
    });

    // Get full ticket data
    const accessibleTickets = ticketsData.slice(1)
      .filter(row => accessibleTicketIds.has(row[0]))
      .map(row => ({
        id: row[0],
        ticket_number: row[1],
        title: row[2],
        ticket_type_id: row[3],
        requester_id: row[4],
        status: row[5],
        tag_summary: row[9] || '',
        collaboration_access: {
          access_type: 'tag_based',
          permission_level: getHighestTagPermission(row[9], tagAccessMap)
        }
      }));

    return { success: true, tickets: accessibleTickets, count: accessibleTickets.length };
  } catch (error) {
    console.error('Error getting tickets by tag access:', error);
    return { success: false, error: error.message };
  }
}
```

### **2. Enhanced doPost Function:**
```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Existing actions...

    // New collaboration actions
    switch(action) {
      case 'grantTicketAccess':
        return ContentService.createTextOutput(JSON.stringify(
          grantTicketAccess(data.ticket_id, data.user_id, data.permission_level, data.granted_by, data.reason, data.expiry_date)
        )).setMimeType(ContentService.MimeType.JSON);

      case 'revokeTicketAccess':
        return ContentService.createTextOutput(JSON.stringify(
          revokeTicketAccess(data.ticket_id, data.user_id, data.revoked_by, data.reason)
        )).setMimeType(ContentService.MimeType.JSON);

      case 'checkTicketAccess':
        return ContentService.createTextOutput(JSON.stringify(
          checkTicketAccess(data.ticket_id, data.user_id)
        )).setMimeType(ContentService.MimeType.JSON);

      case 'getUserAccessibleTickets':
        return ContentService.createTextOutput(JSON.stringify(
          getUserAccessibleTickets(data.user_id, data.company_id)
        )).setMimeType(ContentService.MimeType.JSON);

      case 'grantTagBasedAccess':
        return ContentService.createTextOutput(JSON.stringify(
          grantTagBasedAccess(data.tag_name, data.user_id, data.permission_level, data.granted_by, data.reason, data.company_id)
        )).setMimeType(ContentService.MimeType.JSON);

      case 'grantTicketTypeAccess':
        return ContentService.createTextOutput(JSON.stringify(
          grantTicketTypeAccess(data.ticket_type_id, data.user_id, data.permission_level, data.granted_by, data.reason)
        )).setMimeType(ContentService.MimeType.JSON);

      default:
        // Existing switch cases...
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## ⚛️ Frontend Implementation

### **1. New API Hooks (src/hooks/useAPI.js):**

```javascript
// Collaboration hooks
export const useTicketAccess = (ticketId, userId) => {
  return useQuery(['ticketAccess', ticketId, userId], () =>
    API.checkTicketAccess(ticketId, userId),
    {
      enabled: !!(ticketId && userId),
      staleTime: 60000 // 1 minute
    }
  );
};

export const useUserAccessibleTickets = (userId, companyId = null) => {
  return useQuery(['accessibleTickets', userId, companyId], () =>
    API.getUserAccessibleTickets(userId, companyId),
    {
      enabled: !!userId,
      staleTime: 300000 // 5 minutes
    }
  );
};

export const useGrantTicketAccess = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ ticketId, userId, permissionLevel, grantedBy, reason, expiryDate }) =>
      API.grantTicketAccess(ticketId, userId, permissionLevel, grantedBy, reason, expiryDate),
    {
      onSuccess: (_, { ticketId, userId }) => {
        queryClient.invalidateQueries(['ticketAccess', ticketId, userId]);
        queryClient.invalidateQueries(['accessibleTickets']);
      }
    }
  );
};

export const useRevokeTicketAccess = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ ticketId, userId, revokedBy, reason }) =>
      API.revokeTicketAccess(ticketId, userId, revokedBy, reason),
    {
      onSuccess: (_, { ticketId, userId }) => {
        queryClient.invalidateQueries(['ticketAccess', ticketId, userId]);
        queryClient.invalidateQueries(['accessibleTickets']);
      }
    }
  );
};
```

### **2. New React Components:**

#### **TicketCollaborationManager (src/components/tickets/TicketCollaborationManager.js):**
```javascript
import React, { useState } from 'react';
import { useGrantTicketAccess, useRevokeTicketAccess } from '../../hooks/useAPI';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../shared/Toast';
import Icons from '../shared/Icons';

const TicketCollaborationManager = ({ ticketId, currentCollaborators = [] }) => {
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({
    userId: '',
    permissionLevel: 'view',
    reason: '',
    expiryDate: ''
  });

  const { user } = useUser();
  const showToast = useToast();
  const grantAccessMutation = useGrantTicketAccess();
  const revokeAccessMutation = useRevokeTicketAccess();

  const handleGrantAccess = async () => {
    try {
      await grantAccessMutation.mutateAsync({
        ticketId,
        userId: newCollaborator.userId,
        permissionLevel: newCollaborator.permissionLevel,
        grantedBy: user.uid,
        reason: newCollaborator.reason,
        expiryDate: newCollaborator.expiryDate || null
      });

      showToast('success', 'Access granted successfully');
      setIsAddingCollaborator(false);
      setNewCollaborator({ userId: '', permissionLevel: 'view', reason: '', expiryDate: '' });

    } catch (error) {
      console.error('Failed to grant access:', error);
      showToast('error', 'Failed to grant access');
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      await revokeAccessMutation.mutateAsync({
        ticketId,
        userId,
        revokedBy: user.uid,
        reason: 'access_revoked_by_user'
      });

      showToast('success', 'Access revoked successfully');

    } catch (error) {
      console.error('Failed to revoke access:', error);
      showToast('error', 'Failed to revoke access');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ticket Collaboration</h3>
        <button
          onClick={() => setIsAddingCollaborator(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Icons.UserPlus size={16} />
          Share Ticket
        </button>
      </div>

      {/* Current Collaborators */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Current Access ({currentCollaborators.length})</h4>

        {currentCollaborators.length > 0 ? (
          <div className="space-y-2">
            {currentCollaborators.map((collaborator, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Icons.User size={16} />
                  </div>

                  <div>
                    <div className="font-medium">{collaborator.user_name || collaborator.user_id}</div>
                    <div className="text-sm text-gray-500">
                      {collaborator.permission_level} access
                      {collaborator.access_reason && ` • ${collaborator.access_reason}`}
                    </div>
                    {collaborator.expiry_date && (
                      <div className="text-xs text-orange-600">
                        Expires: {new Date(collaborator.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeAccess(collaborator.user_id)}
                  disabled={revokeAccessMutation.isLoading}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Revoke Access"
                >
                  <Icons.X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No additional collaborators</div>
        )}
      </div>

      {/* Add Collaborator Form */}
      {isAddingCollaborator && (
        <div className="border rounded p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Grant Ticket Access</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">User ID / Email</label>
              <input
                type="text"
                value={newCollaborator.userId}
                onChange={(e) => setNewCollaborator({ ...newCollaborator, userId: e.target.value })}
                placeholder="Enter user ID or email"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Permission Level</label>
              <select
                value={newCollaborator.permissionLevel}
                onChange={(e) => setNewCollaborator({ ...newCollaborator, permissionLevel: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="view">View Only</option>
                <option value="comment">View + Comment</option>
                <option value="update">View + Comment + Update</option>
                <option value="full">Full Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
              <input
                type="text"
                value={newCollaborator.reason}
                onChange={(e) => setNewCollaborator({ ...newCollaborator, reason: e.target.value })}
                placeholder="Why are you sharing this ticket?"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={newCollaborator.expiryDate}
                onChange={(e) => setNewCollaborator({ ...newCollaborator, expiryDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGrantAccess}
                disabled={!newCollaborator.userId || grantAccessMutation.isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {grantAccessMutation.isLoading ? 'Granting...' : 'Grant Access'}
              </button>

              <button
                onClick={() => setIsAddingCollaborator(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketCollaborationManager;
```

#### **CollaborativeTicketDashboard (src/components/tickets/CollaborativeTicketDashboard.js):**
```javascript
import React, { useState } from 'react';
import { useUserAccessibleTickets } from '../../hooks/useAPI';
import { useUser } from '../../contexts/UserContext';
import Icons from '../shared/Icons';

const CollaborativeTicketDashboard = () => {
  const [accessFilter, setAccessFilter] = useState('all');
  const { user } = useUser();

  const { data: accessibleTickets = [], isLoading } = useUserAccessibleTickets(user?.uid);

  const getAccessTypeIcon = (accessType) => {
    switch (accessType) {
      case 'requester': return <Icons.User className="text-blue-600" size={16} />;
      case 'individual': return <Icons.UserPlus className="text-green-600" size={16} />;
      case 'ticket_type': return <Icons.Tag className="text-purple-600" size={16} />;
      case 'tag_based': return <Icons.Hash className="text-orange-600" size={16} />;
      default: return <Icons.Eye className="text-gray-600" size={16} />;
    }
  };

  const getPermissionBadge = (permissionLevel) => {
    const badges = {
      view: 'bg-gray-100 text-gray-800',
      comment: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      full: 'bg-green-100 text-green-800'
    };

    return badges[permissionLevel] || badges.view;
  };

  const filteredTickets = accessFilter === 'all'
    ? accessibleTickets
    : accessibleTickets.filter(ticket =>
        ticket.collaboration_access?.access_type === accessFilter
      );

  if (isLoading) {
    return <div className="p-4">Loading collaborative tickets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Collaborative Tickets</h2>

        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="all">All Access Types</option>
          <option value="requester">My Tickets</option>
          <option value="individual">Shared with Me</option>
          <option value="ticket_type">Type Access</option>
          <option value="tag_based">Tag Access</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{ticket.ticket_number}</span>
                  {getAccessTypeIcon(ticket.collaboration_access?.access_type)}
                </div>

                <h3 className="font-medium text-gray-900 mb-1">{ticket.title}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded">{ticket.status}</span>
                  <span className={`px-2 py-1 rounded ${getPermissionBadge(ticket.collaboration_access?.permission_level)}`}>
                    {ticket.collaboration_access?.permission_level} access
                  </span>
                </div>
              </div>

              <div className="text-right text-sm text-gray-500">
                <div>Access: {ticket.collaboration_access?.access_type}</div>
                {ticket.collaboration_access?.access_reason && (
                  <div className="italic">{ticket.collaboration_access.access_reason}</div>
                )}
              </div>
            </div>

            {ticket.tag_summary && (
              <div className="flex flex-wrap gap-1 mt-2">
                {ticket.tag_summary.split(',').map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No collaborative tickets found for the selected filter.
        </div>
      )}
    </div>
  );
};

export default CollaborativeTicketDashboard;
```

## 🎨 UI Integration Changes

### **1. Enhanced TicketDetail.js:**
```javascript
// Add to existing TicketDetail component
import TicketCollaborationManager from './TicketCollaborationManager';
import { useTicketAccess } from '../../hooks/useAPI';

// Inside component:
const { data: ticketAccess } = useTicketAccess(ticket.id, user?.uid);

// Add collaboration tab or section:
<div className="border-t pt-6">
  {ticketAccess?.has_access && (
    <TicketCollaborationManager
      ticketId={ticket.id}
      currentCollaborators={ticket.collaborators || []}
    />
  )}
</div>
```

### **2. Enhanced AdminPage.js:**
```javascript
// Add collaboration management tab
<AdminTab
  id="collaboration"
  name="Collaboration"
  description="Manage ticket sharing and permissions"
  icon={Icons.UserPlus}
  component={() => <AdminCollaborationManager />}
/>
```

### **3. Enhanced Navigation:**
```javascript
// Add to Header.js navigation
<nav className="space-y-1">
  <NavLink to="/dashboard" className="nav-link">
    <Icons.Dashboard size={20} />
    My Dashboard
  </NavLink>

  <NavLink to="/collaborative" className="nav-link">
    <Icons.Users size={20} />
    Collaborative Tickets
  </NavLink>

  {/* Existing nav items */}
</nav>
```

## 📋 Implementation Summary

### **Database Changes:**
- 4 new tables: ticket_collaborators, ticket_type_collaborators, tag_based_collaborators, department_collaboration_rules
- Enhanced tickets table with collaboration tracking

### **AppScript Changes:**
- 8 new API functions for collaboration management
- Enhanced doPost function with collaboration actions
- Permission checking and access validation logic

### **Frontend Changes:**
- 5 new API hooks for collaboration operations
- 2 major new components (TicketCollaborationManager, CollaborativeTicketDashboard)
- Enhanced existing components with collaboration features
- New admin interface for collaboration management

### **Implementation Time: 10-12 days**
- Database & AppScript: 4-5 days
- React Components: 4-5 days
- UI Integration: 2-3 days
- Testing & Polish: 2-3 days

**Status**: ✅ **COMPREHENSIVE COLLABORATION SYSTEM DESIGN COMPLETE**
**Complexity**: High - new permission system with multiple access types
**Integration**: Uses Universal Entity Architecture for tag-based access