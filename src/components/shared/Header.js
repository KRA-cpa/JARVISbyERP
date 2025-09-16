import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Icons from './Icons';
import { HeaderClock } from './LiveClock';

const Header = ({ user, userRole, notifications = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getActiveClasses = (path) => {
    return isActive(path)
      ? 'bg-blue-100 text-blue-700 border-blue-300'
      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 border-transparent';
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Icons.Ticket size={28} className="text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                TicketFlow
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ${getActiveClasses('/dashboard')}`}
              >
                <div className="flex items-center space-x-2">
                  <Icons.Dashboard size={16} />
                  <span>Dashboard</span>
                </div>
              </Link>

              {userRole === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ${getActiveClasses('/admin')}`}
                >
                  <div className="flex items-center space-x-2">
                    <Icons.Admin size={16} />
                    <span>Admin Panel</span>
                  </div>
                </Link>
              )}
            </nav>
          </div>

          {/* Right side - Clock, Notifications, User Menu */}
          <div className="flex items-center space-x-4">

            {/* Live Clock */}
            <HeaderClock className="hidden sm:flex" />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Icons.Notification size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications ({unreadNotifications} unread)
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification, index) => (
                        <div
                          key={index}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'approval' && <Icons.Approval size={16} className="text-green-600 mt-0.5" />}
                              {notification.type === 'overdue' && <Icons.Warning size={16} className="text-red-600 mt-0.5" />}
                              {notification.type === 'info' && <Icons.Info size={16} className="text-blue-600 mt-0.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>

                  {notifications.length > 5 && (
                    <div className="p-3 border-t border-gray-200 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Icons.User size={20} />
                <span className="hidden sm:block text-sm font-medium">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <Icons.ChevronDown size={16} />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icons.User size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">
                          {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)} Role
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Icons.User size={16} />
                      <span>Profile Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle preferences
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Icons.Settings size={16} />
                      <span>Preferences</span>
                    </button>
                  </div>

                  <div className="py-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Icons.Close size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-3 space-y-2">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isActive('/dashboard')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icons.Dashboard size={16} />
              <span>Dashboard</span>
            </div>
          </Link>

          {userRole === 'admin' && (
            <Link
              to="/admin"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive('/admin')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icons.Admin size={16} />
                <span>Admin Panel</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;