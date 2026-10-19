import React from 'react';

/**
 * UserGeneralRoleSelector Component (Phase 2 Role Maintenance)
 *
 * Filter for a user list by general role. The general role is derived by the backend
 * (getUsers / getUserGeneralRole, AppScript v9.0+) from the assignments in force today:
 *   approver - holds a role that approves at least one workflow step
 *   maker    - holds any other role, or has an active profile and no roles
 *   both     - both of the above
 *   viewer   - neither
 * It is not stored or set directly: change it by assigning or removing roles.
 *
 * @param {Object} props
 * @param {Array} props.users - Users from API.Users.getAll() (each has general_role)
 * @param {string} props.value - Selected filter: 'all' | 'maker' | 'approver' | 'both' | 'viewer'
 * @param {Function} props.onChange - Called with the new filter value
 */

export const GENERAL_ROLES = {
  maker: { label: 'Makers', badge: 'Maker', className: 'bg-blue-100 text-blue-800', hint: 'Can raise tickets' },
  approver: { label: 'Approvers', badge: 'Approver', className: 'bg-green-100 text-green-800', hint: 'Approves workflow steps' },
  both: { label: 'Both', badge: 'Maker + Approver', className: 'bg-purple-100 text-purple-800', hint: 'Raises tickets and approves steps' },
  viewer: { label: 'Viewers', badge: 'Viewer', className: 'bg-gray-100 text-gray-700', hint: 'No roles in force' }
};

/**
 * Users matching a filter value ('all' keeps everyone)
 */
export const filterUsersByGeneralRole = (users, value) =>
  value === 'all' ? (users || []) : (users || []).filter(user => (user.general_role || 'viewer') === value);

/**
 * Small badge for one user's general role
 */
export const GeneralRoleBadge = ({ generalRole }) => {
  const config = GENERAL_ROLES[generalRole] || GENERAL_ROLES.viewer;
  return (
    <span
      title={config.hint}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.badge}
    </span>
  );
};

const UserGeneralRoleSelector = ({ users, value = 'all', onChange }) => {
  const counts = (users || []).reduce((acc, user) => {
    const key = user.general_role || 'viewer';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const options = [
    { value: 'all', label: 'All', count: (users || []).length },
    ...Object.entries(GENERAL_ROLES).map(([key, config]) => ({ value: key, label: config.label, count: counts[key] || 0 }))
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter users by general role">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            aria-pressed={selected}
            title={GENERAL_ROLES[option.value]?.hint}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option.label}
            <span className={`ml-2 px-1.5 rounded-full ${selected ? 'bg-blue-500' : 'bg-gray-100'}`}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default UserGeneralRoleSelector;
