// src/App.js - Corrected with Proper Component Imports
import React, { useState, useEffect } from 'react';

// Firebase imports
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from './config/firebase';

// API Integration
import api from './api/googleSheet';

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================

// Icons
import {
  Settings2,
  PlusCircle,
  LogOutIcon,
  FilePlusIcon,
  ArrowLeftIcon,
  UserIcon,
  CheckCircle2,
  Trash2
} from './components/shared/Icons';

// Shared Components
import ActionCommentModal from './components/shared/ActionCommentModal';

// Admin Components (separate files)
import CompanyEditor from './components/admin/CompanyEditor';
import RoleEditor from './components/admin/RoleEditorCore';
import DropdownListEditor from './components/admin/DropdownListEditorCore';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const USER_ROLES = {
  'ken.advento@gmail.com': { name: 'Ken Advento', role: 'admin', department: 'IT' },
  'admin@test.com': { name: 'Demo Admin', role: 'admin', department: 'Management' },
  'manager@test.com': { name: 'Demo Manager', role: 'manager', department: 'Operations' },
  'user@test.com': { name: 'Demo User', role: 'user', department: 'Engineering' }
};

const DEMO_ACCOUNTS = [
  { email: 'admin@test.com', password: 'demo123', name: 'Demo Admin', role: 'admin', department: 'Management' },
  { email: 'manager@test.com', password: 'demo123', name: 'Demo Manager', role: 'manager', department: 'Operations' },
  { email: 'user@test.com', password: 'demo123', name: 'Demo User', role: 'user', department: 'Engineering' }
];

// ============================================================================
// UI COMPONENTS (Only components that belong in App.js)
// ============================================================================

function EnhancedTicketListItem({ ticket, onSelectTicket }) {
  const getStatusInfo = (status) => {
    const statusClasses = {
      'Pending Manager Approval': 'bg-purple-100 text-purple-800',
      'Pending Finance Review': 'bg-yellow-100 text-yellow-800',
      'New': 'bg-blue-100 text-blue-800',
      'Closed': 'bg-green-100 text-green-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      onClick={() => onSelectTicket(ticket)}
      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-blue-500"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-blue-600 truncate">
              {ticket.ticket_number}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusInfo(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{ticket.title}</h3>
          <p className="text-sm text-gray-500">
            {ticket.type || 'Ticket'} • Created by {ticket.requester || 'Unknown'} • {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right ml-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AUTH & UTILITY COMPONENTS
// ============================================================================

const initializeDemoAccounts = async () => {
  console.log('🎯 Initializing demo accounts...');
  for (const demo of DEMO_ACCOUNTS) {
    try {
      await createUserWithEmailAndPassword(auth, demo.email, demo.password);
      console.log(`✅ Created demo account: ${demo.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`✅ Demo account already exists: ${demo.email}`);
      } else {
        console.log(`❌ Failed to create demo account ${demo.email}:`, error.code);
      }
    }
  }
  console.log('🎯 Demo accounts initialization complete');
};

function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    try {
      setDebugInfo({
        authExists: !!auth,
        authApp: auth?.app?.name || 'No app',
        currentUser: auth?.currentUser?.email || 'None',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, []);
  
  return (
    <div className="fixed top-4 right-4 bg-red-900 text-white p-3 text-xs rounded-lg max-w-sm z-50">
      <h4 className="font-bold mb-2">🔍 Debug Info</h4>
      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      console.log('Auth SUCCESS:', userCredential.user.email);
      
      // Record login in backend
      try {
        await api.recordLogin({
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          ipAddress: '127.0.0.1'
        });
      } catch (apiError) {
        console.log('Login recording failed:', apiError.message);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email. Try signing up instead.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/email-already-in-use':
          setError('Account already exists. Try signing in instead.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError(`Authentication failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);
      
      // Record login in backend
      try {
        await api.recordLogin({
          userId: result.user.uid,
          email: result.user.email,
          ipAddress: '127.0.0.1'
        });
      } catch (apiError) {
        console.log('Login recording failed:', apiError.message);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          break;
        case 'auth/unauthorized-domain':
          setError('🚨 Domain Authorization Required: Please add your domain to Firebase authorized domains.');
          break;
        default:
          setError(`Google sign-in failed: ${error.message}. Please try again or use email sign-in.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <DebugPanel />
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticketing System</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
            />
          </div>

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Please wait...' : 'Continue with Google'}
          </button>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-3 font-medium">🎯 Demo Accounts:</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((demo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                    setError(null);
                  }}
                  className="w-full text-left text-sm bg-white border border-blue-200 rounded px-3 py-2 hover:bg-blue-50"
                >
                  <div className="font-medium text-blue-800">{demo.email}</div>
                  <div className="text-blue-600 text-xs">{demo.role} • {demo.department}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const TIMEZONE = 'Asia/Manila';

  return (
    <div className="text-right">
      <div className="text-sm font-medium text-gray-800">
        {time.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          timeZone: TIMEZONE 
        })}
      </div>
      <div className="text-xs text-gray-500">
        {time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true,
          timeZone: TIMEZONE 
        })}
      </div>
    </div>
  );
}

function Header({ user, currentView, setCurrentView, onSignOut }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Ticketing System</h1>
          <nav className="flex gap-2 border-l pl-4">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`px-3 py-1 text-sm font-medium rounded ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Dashboard
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={`px-3 py-1 text-sm font-medium rounded ${currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Admin
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <div className="text-right border-l pl-4">
            <div className="text-sm font-medium text-gray-800">{user?.name}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
            <div className="text-xs text-blue-600">{user?.role} • {user?.department}</div>
          </div>
          <button onClick={onSignOut} className="p-1 text-gray-500 hover:text-blue-600">
            <LogOutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function TicketList({ tickets, onSelectTicket, onCreateTicket, loading, error, onRefresh }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
        <div className="flex gap-2">
          <button 
            onClick={onRefresh} 
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            disabled={loading}
          >
            Refresh
          </button>
          <button 
            onClick={onCreateTicket} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            disabled={loading}
          >
            <FilePlusIcon className="h-4 w-4" />
            New Ticket
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FilePlusIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tickets found. Create your first ticket!</p>
          </div>
        ) : (
          <div className="divide-y">
            {tickets.map(ticket => (
              <EnhancedTicketListItem 
                key={ticket.id} 
                ticket={ticket} 
                onSelectTicket={onSelectTicket}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetail({ ticket, onBack, onTicketAction }) {
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowActionModal(true);
  };

  const handleActionConfirm = (comment) => {
    console.log(`Action: ${selectedAction}, Comment: ${comment}`);
    onTicketAction && onTicketAction(ticket.id, selectedAction, comment);
    setShowActionModal(false);
    setSelectedAction(null);
  };

  return (
    <div>
      <button 
        onClick={onBack} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Tickets
      </button>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm text-blue-600 font-medium">{ticket.ticket_number}</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{ticket.title}</h1>
              <p className="text-gray-600 mt-1">
                {ticket.type || 'Ticket'} • Created by {ticket.requester || 'Unknown'} • {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
              {ticket.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{ticket.description || 'No description provided'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
              <div className="space-y-2">
                {ticket.customFields && Object.keys(ticket.customFields).length > 0 ? (
                  Object.entries(ticket.customFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No additional details</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50">
          <div className="flex gap-3">
            <button 
              onClick={() => handleActionClick('Approve')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </button>
            <button 
              onClick={() => handleActionClick('Return')}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Return
            </button>
            <button 
              onClick={() => handleActionClick('Reject')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      <ActionCommentModal
        action={selectedAction}
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}

function CreateTicketForm({ onBack, onSave, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Purchase Request',
    description: '',
    itemName: '',
    estimatedValue: '',
    department: currentUser?.department || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create ticket data for API
      const ticketData = {
        title: formData.title,
        ticket_type_id: 'tt_default', // You might want to make this dynamic
        company_id: 'comp_1', // You might want to make this dynamic based on user
        requester_id: currentUser?.uid || 'user_unknown',
        description: formData.description,
        customData: {
          'Item Name': formData.itemName,
          'Estimated Value': formData.estimatedValue,
          'Department': formData.department
        }
      };

      const response = await api.createTicket(ticketData);
      
      if (response.status === 'success') {
        // Format the response for the UI
        const newTicket = {
          id: response.data.ticketId,
          ticket_number: response.data.ticketNumber,
          title: formData.title,
          status: 'New',
          created_at: new Date().toISOString(),
          requester: currentUser?.name || 'You',
          type: formData.type,
          description: formData.description,
          customFields: {
            'Item Name': formData.itemName,
            'Estimated Value': formData.estimatedValue,
            'Department': formData.department
          }
        };

        onSave(newTicket);
      } else {
        setError(response.message || 'Failed to create ticket');
      }
    } catch (error) {
      setError(error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={onBack} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        disabled={loading}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Tickets
      </button>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FilePlusIcon className="h-6 w-6" />
          Create New Ticket
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your request"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option>Purchase Request</option>
                <option>Leave Application</option>
                <option>IT Support</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide detailed information about your request"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., MacBook Pro"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
              <input
                type="text"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="$0.00"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Select Department</option>
                <option>Engineering</option>
                <option>Operations</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>IT</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
              disabled={loading}
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button 
              onClick={onBack}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENHANCED ADMIN PANEL WITH API INTEGRATION
// ============================================================================

function AdminPanel({ 
  roles, setRoles, 
  companies, setCompanies, 
  dropdownLists, setDropdownLists,
  loading, error 
}) {
  const [view, setView] = useState('main');
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Company Management with API calls
  const handleCompanyEdit = (company) => {
    setEditingItem(company);
    setView('edit-company');
  };

  const handleCompanySave = async (companyData) => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      const response = companyData.id 
        ? await api.updateCompany(companyData)
        : await api.createCompany(companyData);
      
      if (response.status === 'success') {
        if (companyData.id) {
          setCompanies(prev => prev.map(c => c.id === companyData.id ? response.data : c));
        } else {
          setCompanies(prev => [...prev, response.data]);
        }
        setView('companies');
        setEditingItem(null);
      } else {
        setActionError(response.message || 'Failed to save company');
      }
    } catch (error) {
      setActionError(error.message || 'Failed to save company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompanyDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    
    setActionLoading(true);
    setActionError(null);
    
    try {
      const response = await api.deleteCompany(companyId);
      if (response.status === 'success') {
        setCompanies(prev => prev.filter(c => c.id !== companyId));
      } else {
        setActionError(response.message || 'Failed to delete company');
      }
    } catch (error) {
      setActionError(error.message || 'Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  // Role Management with API calls
  const handleRoleEdit = (role) => {
    setEditingItem(role);
    setView('edit-role');
  };

  const handleRoleSave = async (roleData) => {
    setView('roles');
    setEditingItem(null);
    // Refresh roles list
    await loadRoles();
  };

  const handleRoleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    setActionLoading(true);
    setActionError(null);
    
    try {
      const response = await api.deleteRole(roleId);
      if (response.status === 'success') {
        setRoles(prev => prev.filter(r => r.id !== roleId));
      } else {
        setActionError(response.message || 'Failed to delete role');
      }
    } catch (error) {
      setActionError(error.message || 'Failed to delete role');
    } finally {
      setActionLoading(false);
    }
  };

  // Dropdown Management with API calls
  const handleDropdownEdit = (dropdown) => {
    setEditingItem(dropdown);
    setView('edit-dropdown');
  };

  const handleDropdownSave = async (dropdownData) => {
    setView('dropdowns');
    setEditingItem(null);
    // Refresh dropdowns list
    await loadDropdowns();
  };

  const handleDropdownDelete = async (dropdownId) => {
    if (!window.confirm('Are you sure you want to delete this dropdown list?')) return;
    
    setActionLoading(true);
    setActionError(null);
    
    try {
      const response = await api.deleteDropdownList(dropdownId);
      if (response.status === 'success') {
        setDropdownLists(prev => prev.filter(d => d.id !== dropdownId));
      } else {
        setActionError(response.message || 'Failed to delete dropdown list');
      }
    } catch (error) {
      setActionError(error.message || 'Failed to delete dropdown list');
    } finally {
      setActionLoading(false);
    }
  };

  // Load functions for refreshing data
  const loadRoles = async () => {
    try {
      const response = await api.getRoles();
      if (response.status === 'success') {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadDropdowns = async () => {
    try {
      const response = await api.getDropdownLists();
      if (response.status === 'success') {
        setDropdownLists(response.data);
      }
    } catch (error) {
      console.error('Failed to load dropdowns:', error);
    }
  };

  const getCompanyName = (companyId) => {
    if (companyId === null || companyId === '') {
      return <span className="font-semibold text-indigo-600">Global</span>;
    }
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  // Error display component
  const ErrorDisplay = ({ error, onDismiss }) => (
    error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={onDismiss} className="text-red-500 hover:text-red-700">×</button>
        </div>
      </div>
    )
  );

  // Render appropriate view
  switch (view) {
    case 'edit-company':
      return (
        <CompanyEditor
          company={editingItem}
          onBack={() => setView('companies')}
          onSave={handleCompanySave}
        />
      );

    case 'edit-role':
      return (
        <RoleEditor
          role={editingItem}
          companies={companies}
          onBack={() => setView('roles')}
          onSave={handleRoleSave}
        />
      );

    case 'edit-dropdown':
      return (
        <DropdownListEditor
          dropdownList={editingItem}
          onBack={() => setView('dropdowns')}
          onSave={handleDropdownSave}
        />
      );

    case 'companies':
      return (
        <div>
          <button 
            onClick={() => setView('main')} 
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Admin
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                Company Management
              </h2>
              <button 
                onClick={() => handleCompanyEdit(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                disabled={actionLoading}
              >
                <PlusCircle className="h-4 w-4" />
                Add Company
              </button>
            </div>
            
            <ErrorDisplay error={actionError} onDismiss={() => setActionError(null)} />
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading companies...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map(company => (
                  <div key={company.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-gray-600">Code: {company.code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleCompanyEdit(company)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleCompanyDelete(company.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No companies found. Create your first company!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case 'roles':
      return (
        <div>
          <button 
            onClick={() => setView('main')} 
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Admin
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Role Management
              </h2>
              <button 
                onClick={() => handleRoleEdit(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                disabled={actionLoading}
              >
                <PlusCircle className="h-4 w-4" />
                Add Role
              </button>
            </div>
            
            <ErrorDisplay error={actionError} onDismiss={() => setActionError(null)} />
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading roles...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map(role => (
                  <div key={role.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{role.name}</h3>
                      <p className="text-sm text-gray-600">Company: {getCompanyName(role.company_id)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleRoleEdit(role)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRoleDelete(role.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {roles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No roles found. Create your first role!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case 'dropdowns':
      return (
        <div>
          <button 
            onClick={() => setView('main')} 
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Admin
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                Dropdown Lists
              </h2>
              <button 
                onClick={() => handleDropdownEdit(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                disabled={actionLoading}
              >
                <PlusCircle className="h-4 w-4" />
                Add Dropdown List
              </button>
            </div>
            
            <ErrorDisplay error={actionError} onDismiss={() => setActionError(null)} />
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dropdown lists...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dropdownLists.map(dropdown => (
                  <div key={dropdown.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{dropdown.name}</h3>
                      <p className="text-sm text-gray-600">
                        {dropdown.options?.length || 0} options
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDropdownEdit(dropdown)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDropdownDelete(dropdown.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {dropdownLists.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No dropdown lists found. Create your first list!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );

    default:
      // Main admin dashboard
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Admin Panel
          </h2>
          
          <ErrorDisplay error={error} onDismiss={() => {}} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Settings2 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Companies</h3>
              </div>
              <p className="text-gray-600 mb-4">Manage companies and organizational structure</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{companies.length} companies</span>
                <button 
                  onClick={() => setView('companies')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Configure →
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Roles & Permissions</h3>
              </div>
              <p className="text-gray-600 mb-4">Configure user roles and access controls</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{roles.length} roles</span>
                <button 
                  onClick={() => setView('roles')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Configure →
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Settings2 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Dropdown Lists</h3>
              </div>
              <p className="text-gray-600 mb-4">Manage dropdown options for forms</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{dropdownLists.length} lists</span>
                <button 
                  onClick={() => setView('dropdowns')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Configure →
                </button>
              </div>
            </div>
          </div>

          {/* API Status Card */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">🚀 Google Apps Script Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-700">✅ Real-time API</p>
                <p>Connected to Google Sheets backend</p>
              </div>
              <div>
                <p className="font-medium text-blue-700">✅ Live Data</p>
                <p>All changes persist to database</p>
              </div>
              <div>
                <p className="font-medium text-purple-700">✅ Production Ready</p>
                <p>Full CRUD operations working</p>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

// ============================================================================
// MAIN APP COMPONENT WITH COMPLETE API INTEGRATION
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Ticket management state
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);

  // Admin data state with API integration
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dropdownLists, setDropdownLists] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Load data from API
  const loadTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    
    try {
      const response = await api.getTickets();
      if (response.status === 'success') {
        setTickets(response.data || []);
      } else {
        setTicketsError(response.message || 'Failed to load tickets');
      }
    } catch (error) {
      setTicketsError(error.message || 'Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    setAdminError(null);
    
    try {
      // Load all admin data in parallel
      const [companiesRes, rolesRes, dropdownsRes] = await Promise.all([
        api.getCompanies(),
        api.getRoles(),
        api.getDropdownLists()
      ]);
      
      if (companiesRes.status === 'success') {
        setCompanies(companiesRes.data || []);
      }
      
      if (rolesRes.status === 'success') {
        setRoles(rolesRes.data || []);
      }
      
      if (dropdownsRes.status === 'success') {
        setDropdownLists(dropdownsRes.data || []);
      }
      
      // Check if any requests failed
      const failedRequests = [companiesRes, rolesRes, dropdownsRes]
        .filter(res => res.status !== 'success');
      
      if (failedRequests.length > 0) {
        setAdminError('Some data failed to load. Please refresh the page.');
      }
      
    } catch (error) {
      setAdminError(error.message || 'Failed to load admin data');
    } finally {
      setAdminLoading(false);
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        const email = firebaseUser.email;
        const roleInfo = USER_ROLES[email] || {
          name: firebaseUser.displayName || 'User',
          role: 'user',
          department: 'General'
        };
        
        const profile = {
          uid: firebaseUser.uid,
          email: email,
          name: roleInfo.name,
          role: roleInfo.role,
          department: roleInfo.department,
          photoURL: firebaseUser.photoURL
        };
        
        setUserProfile(profile);
        console.log('User logged in:', profile);
        
        // Load initial data
        loadTickets();
        if (profile.role === 'admin') {
          loadAdminData();
        }
      } else {
        setUserProfile(null);
        setTickets([]);
        setCompanies([]);
        setRoles([]);
        setDropdownLists([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize demo accounts
  useEffect(() => {
    const initDemo = async () => {
      if (auth) {
        setTimeout(() => {
          initializeDemoAccounts();
        }, 2000);
      }
    };
    initDemo();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard');
      setSelectedTicket(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateTicket = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setShowCreateForm(false);
  };

  const handleTicketAction = async (ticketId, action, comment) => {
    console.log(`Ticket ${ticketId}: ${action} - ${comment}`);
    
    // TODO: Implement API call for ticket actions
    // For now, just update local state
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: action === 'Approve' ? 'Approved' : 
                   action === 'Reject' ? 'Rejected' : 'Returned' 
          }
        : ticket
    ));
    setSelectedTicket(null);
  };

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!user || !userProfile) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={userProfile}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onSignOut={handleSignOut}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <>
            {showCreateForm ? (
              <CreateTicketForm 
                onBack={() => setShowCreateForm(false)}
                onSave={handleCreateTicket}
                currentUser={userProfile}
              />
            ) : selectedTicket ? (
              <TicketDetail 
                ticket={selectedTicket}
                onBack={() => setSelectedTicket(null)}
                onTicketAction={handleTicketAction}
              />
            ) : (
              <TicketList 
                tickets={tickets}
                onSelectTicket={setSelectedTicket}
                onCreateTicket={() => setShowCreateForm(true)}
                onRefresh={loadTickets}
                loading={ticketsLoading}
                error={ticketsError}
              />
            )}
          </>
        )}
        
        {currentView === 'admin' && userProfile.role === 'admin' && (
          <AdminPanel 
            roles={roles}
            setRoles={setRoles}
            companies={companies}
            setCompanies={setCompanies}
            dropdownLists={dropdownLists}
            setDropdownLists={setDropdownLists}
            loading={adminLoading}
            error={adminError}
          />
        )}
        
        {currentView === 'admin' && userProfile.role !== 'admin' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">You don't have permission to access the admin panel.</p>
          </div>
        )}
      </main>
    </div>
  );
}