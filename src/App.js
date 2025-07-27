//App.js 
// consolidated the necessary components (App.js, Header.js, AdminPage.js, etc.)
// into a single file for this fix,
// as it seems the multi-file structure was causing some of these reference errors

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';

// --- HELPER ICONS ---
const Settings2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
);
const LogOutIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);
const FilePlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
);
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);


// --- Firebase & Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDXYPPI-FifYgN39SP7yt96BMT5co0mYlw",
  authDomain: "jarvisbyerp.firebaseapp.com",
  projectId: "jarvisbyerp",
  storageBucket: "jarvisbyerp.firebasestorage.app",
  messagingSenderId: "3188796143",
  appId: "1:3188796143:web:850ba08114a59b6158c91a",
  measurementId: "G-523E3W5ZMN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

const TIMEZONE = 'Asia/Manila';


// --- MOCK DATA ---
const MOCK_USERS_ROLES = {
  'ken.advento@gmail.com': { name: 'Ken Advento', role: 'admin' },
};
const MOCK_TICKET_TYPES = [
    { id: 'tt_1', name: 'Purchase Request', description: 'Used for requesting new items.', isActive: true },
    { id: 'tt_2', name: 'Leave Application', description: 'Standard employee leave requests.', isActive: false },
];
const MOCK_DROPDOWN_LISTS = [
    { id: 'dd_1', name: 'Company Departments' },
    { id: 'dd_2', name: 'Asset Categories' },
];
const MOCK_TICKETS = [
    { id: 101, title: 'New Developer Laptop', status: 'Pending Manager Approval', created_at: '2025-07-17T10:00:00Z', requesterName: 'Charlie', type: 'Purchase Request' },
    { id: 102, title: 'Office Chairs (x5)', status: 'Pending Finance Review', created_at: '2025-07-16T14:30:00Z', requesterName: 'Alice', type: 'Purchase Request' },
];
const MOCK_TICKET_DETAILS = {
    id: 101, title: 'New Developer Laptop', status: 'Pending Manager Approval',
    description: 'Requesting a new M3 MacBook Pro for a new hire in the engineering department.',
    requesterName: 'Charlie', createdAt: '2025-07-17T10:00:00Z',
    customFields: [{ label: 'Item Name', value: 'MacBook Pro 16-inch' }, { label: 'Estimated Value ($)', value: '2499.00' }]
};

// --- SHARED COMPONENTS ---
function LoadingScreen({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.75v1.5M12 17.75v1.5M5.75 5.75l1.06 1.06M17.19 17.19l1.06 1.06M4.75 12h1.5M17.75 12h1.5M5.75 18.25l1.06-1.06M17.19 6.81l1.06-1.06"/></svg>
                <p className="mt-2 text-gray-600">{message}</p>
            </div>
        </div>
    );
}

function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE };
    const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: TIMEZONE };
    return (
        <div className="text-right">
            <div className="text-sm font-medium text-gray-800">{time.toLocaleDateString('en-US', dateOptions)}</div>
            <div className="text-xs text-gray-500">{time.toLocaleTimeString('en-US', timeOptions)}</div>
        </div>
    );
}

function Header({ currentUserData, currentView, setCurrentView, onSignOut }) {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Ticketing System</h1>
                    <nav className="flex items-center gap-2 border-l pl-4">
                        <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1 text-sm font-medium rounded-md ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>Dashboard</button>
                        {currentUserData?.role === 'admin' && (
                             <button onClick={() => setCurrentView('admin')} className={`px-3 py-1 text-sm font-medium rounded-md ${currentView === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>Admin</button>
                        )}
                    </nav>
                </div>
                <div className="flex items-center space-x-4">
                    <LiveClock />
                    <div className="text-right border-l pl-4">
                         <span className="text-sm font-medium text-gray-800">{currentUserData.name}</span>
                         <span className="text-xs text-gray-500 block">{currentUserData.email}</span>
                    </div>
                    <button onClick={onSignOut} title="Sign Out"><LogOutIcon className="h-6 w-6 text-gray-500 hover:text-indigo-600" /></button>
                </div>
            </div>
        </header>
    );
}

// --- PAGE COMPONENTS ---
function LoginPage() { return <LoadingScreen message="Authenticating..." />; }

function DashboardPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => { 
            setTickets(MOCK_TICKETS);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <LoadingScreen message="Loading tickets..." />;
    if (selectedTicketId) {
        return <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />;
    }
    return <TicketDashboard tickets={tickets} onSelectTicket={setSelectedTicketId} />;
}

function AdminPage() {
    const [view, setView] = useState('main');
    const [selectedItem, setSelectedItem] = useState(null);

    const handleEditTicketType = (type) => { setSelectedItem(JSON.parse(JSON.stringify(type))); setView('edit_type'); };
    const handleCreateTicketType = () => { setSelectedItem({ name: 'New Ticket Type', fields: [], workflow: { steps: [] } }); setView('edit_type'); };
    const handleBack = () => { setView('main'); setSelectedItem(null); };

    if (view === 'edit_type') {
        return <div className="text-2xl font-bold">Ticket Type Editor (UI Placeholder)</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Ticket Types Configuration</h2>
                    <button onClick={handleCreateTicketType} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2"/> Create New Ticket Type
                    </button>
                </div>
                <div className="space-y-2">
                    {MOCK_TICKET_TYPES.map(type => (
                        <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div><p className="font-semibold">{type.name}</p></div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{type.isActive ? 'Active' : 'Inactive'}</span>
                                <button onClick={() => handleEditTicketType(type)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t pt-8">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings2 className="mr-3" /> Dropdown List Management</h2>
                    <button className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2"/> Create New Dropdown List
                    </button>
                </div>
                <div className="space-y-2">
                    {MOCK_DROPDOWN_LISTS.map(list => (
                        <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <p className="font-semibold">{list.name}</p>
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- DASHBOARD SUB-COMPONENTS ---
function TicketDashboard({ tickets, onSelectTicket }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Tickets</h2>
                <button onClick={() => alert('Opening new ticket form...')} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center">
                    <FilePlusIcon className="h-5 w-5 mr-2" />New Ticket
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {tickets.length > 0 ? tickets.map(ticket => (
                        <TicketListItem key={ticket.id} ticket={ticket} onSelectTicket={onSelectTicket} />
                    )) : <li className="p-6 text-center text-gray-500">No tickets found.</li>}
                </ul>
            </div>
        </div>
    );
}

function TicketListItem({ ticket, onSelectTicket }) {
    const getStatusInfo = (status) => ({
        'Pending Manager Approval': 'bg-purple-100 text-purple-800',
        'Pending Finance Review': 'bg-yellow-100 text-yellow-800',
        'Closed': 'bg-green-100 text-green-800',
    }[status] || 'bg-gray-100 text-gray-800');

    return (
        <li onClick={() => onSelectTicket(ticket.id)} className="p-4 hover:bg-gray-50 cursor-pointer transition">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-600 truncate">{ticket.type} #{ticket.id}</p>
                    <p className="text-md font-medium text-gray-900 mt-1">{ticket.title}</p>
                    <p className="text-sm text-gray-500 mt-1">Created by {ticket.requesterName} on {new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right ml-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusInfo(ticket.status)}`}>{ticket.status}</span>
                </div>
            </div>
        </li>
    );
}

function TicketDetail({ ticketId, onBack }) {
    const [ticket, setTicket] = useState(null);
    useEffect(() => {
        setTicket(MOCK_TICKET_DETAILS);
    }, [ticketId]);

    if (!ticket) return <LoadingScreen message="Loading ticket details..." />;

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold hover:text-indigo-800 mb-4"><ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Dashboard</button>
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-3xl font-bold text-gray-900">{ticket.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.id} &bull; Status: {ticket.status}</p>
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
                {ticket.customFields?.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ticket.customFields.map(field => (
                                <div key={field.label}>
                                    <p className="text-sm text-gray-500">{field.label}</p>
                                    <p className="font-medium text-gray-800">{field.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


// --- MAIN APP COMPONENT ---
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                try {
                    await signInAnonymously(auth);
                } catch (error) { 
                    console.error("Anonymous sign-in failed:", error); 
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setCurrentUserData(null);
            setIsAuthReady(false);
            return;
        }

        const email = currentUser.email || `${currentUser.uid}@example.com`;
        const mockRoleInfo = MOCK_USERS_ROLES[email];
        
        let profile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Guest User',
            email: email,
            role: 'user',
            enabled: true,
        };

        if (mockRoleInfo) {
            profile.name = mockRoleInfo.name;
            profile.role = mockRoleInfo.role;
        }
        
        setCurrentUserData(profile);
        setIsAuthReady(true);
    }, [currentUser]);

    if (!isAuthReady || !currentUserData) {
        return <LoginPage />;
    }
    
    if (!currentUserData.enabled) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-600">Account Disabled</h2>
                <p>Your account has been disabled. Please contact an administrator.</p>
                <button onClick={() => signOut(auth)} className="mt-4 px-4 py-2 bg-gray-200 rounded">Sign Out</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header 
                currentUserData={currentUserData} 
                setCurrentView={setCurrentView} 
                currentView={currentView} 
                onSignOut={() => signOut(auth)}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {currentView === 'dashboard' && <DashboardPage />}
                {currentView === 'admin' && currentUserData.role === 'admin' && <AdminPage />}
                {currentView === 'admin' && currentUserData.role !== 'admin' && (
                    <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
                        You do not have permission to access the admin panel.
                    </div>
                )}
            </main>
        </div>
    );
}
