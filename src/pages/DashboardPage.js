import React, { useState, useEffect } from 'react';

// --- API Layer (api/googleSheet.js) ---
// In a real project, this would be imported from './api/googleSheet.js'
const api = {
  getTickets: async () => {
    console.log("Fetching tickets from API...");
    // Simulating a successful API call with mock data
    return Promise.resolve({ 
        status: 'success', 
        data: [
            { id: 101, ticket_number: "MYCO-PR-2025-00000001", title: 'New Developer Laptop', status: 'Pending Manager Approval', created_at: '2025-07-17T10:00:00Z', requesterName: 'Charlie', type: 'Purchase Request' },
            { id: 102, ticket_number: "MYCO-PR-2025-00000002", title: 'Office Chairs (x5)', status: 'Pending Finance Review', created_at: '2025-07-16T14:30:00Z', requesterName: 'Alice', type: 'Purchase Request' },
        ]
    });
  },
  getTicketDetails: async (ticketId) => {
     console.log(`Fetching details for ticket ID: ${ticketId}`);
     return Promise.resolve({
         status: 'success',
         data: {
            id: 101,
            ticket_number: "MYCO-PR-2025-00000001",
            title: 'New Developer Laptop',
            status: 'Pending Manager Approval',
            description: 'Requesting a new M3 MacBook Pro for a new hire in the engineering department.',
            requesterName: 'Charlie',
            created_at: '2025-07-17T10:00:00Z',
         }
     })
  }
};


// --- Child Components (Inlined for this example) ---
// In a real project, these would be imported from their respective files.

const LoadingScreen = ({ message }) => <div>{message || 'Loading...'}</div>;
const TicketListItem = ({ ticket, onSelectTicket }) => (
    <li onClick={() => onSelectTicket(ticket.id)} className="p-4 hover:bg-gray-50 cursor-pointer">
        <p className="font-semibold text-indigo-600">{ticket.ticket_number}</p>
        <p className="text-md text-gray-900 mt-1">{ticket.title}</p>
        <p className="text-sm text-gray-600">Status: {ticket.status}</p>
    </li>
);
const TicketDashboard = ({ tickets, onSelectTicket, onCreateTicket }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Tickets</h2>
            <button onClick={onCreateTicket} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">New Ticket</button>
        </div>
        <div className="bg-white shadow-md rounded-lg">
            <ul className="divide-y divide-gray-200">
                {tickets.length > 0 ? tickets.map(ticket => (
                    <TicketListItem key={ticket.id} ticket={ticket} onSelectTicket={onSelectTicket} />
                )) : <li className="p-6 text-center text-gray-500">No tickets found.</li>}
            </ul>
        </div>
    </div>
);
const TicketDetail = ({ ticketId, onBack }) => {
    const [ticket, setTicket] = useState(null);
    useEffect(() => {
        api.getTicketDetails(ticketId).then(res => {
            if(res.status === 'success') setTicket(res.data);
        });
    }, [ticketId]);

    if (!ticket) return <LoadingScreen message="Loading ticket details..." />;

    return (
        <div>
            <button onClick={onBack} className="text-indigo-600 mb-4">&larr; Back to Dashboard</button>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">{ticket.title}</h2>
                <p className="text-sm text-gray-500">{ticket.ticket_number}</p>
                <p className="mt-4">{ticket.description}</p>
            </div>
        </div>
    );
};


/**
 * =================================================================================
 * DashboardPage Component (pages/DashboardPage.js)
 * ---------------------------------------------------------------------------------
 * This is the main container for the user-facing dashboard. It fetches ticket
 * data and manages the state for displaying either the ticket list or a
 * detailed view of a single ticket.
 * =================================================================================
 */
export default function DashboardPage({ currentUserData }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Effect to fetch tickets when the component mounts
    useEffect(() => {
        setLoading(true);
        api.getTickets()
            .then(response => {
                if (response.status === 'success') {
                    setTickets(response.data);
                } else {
                    throw new Error(response.message || 'Failed to load tickets.');
                }
            })
            .catch(err => {
                setError(err.message);
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleCreateTicket = () => {
        // This would open a modal for creating a new ticket.
        alert('Opening new ticket form...');
    };

    // Render loading or error states
    if (loading) {
        return <LoadingScreen message="Loading tickets..." />;
    }
    if (error) {
        return <div className="text-center p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>;
    }

    // Conditionally render the TicketDetail view if a ticket is selected
    if (selectedTicketId) {
        return <TicketDetail 
            ticketId={selectedTicketId} 
            onBack={() => setSelectedTicketId(null)} 
        />;
    }

    // Otherwise, render the main dashboard list view
    return (
        <TicketDashboard 
            tickets={tickets} 
            onSelectTicket={setSelectedTicketId}
            onCreateTicket={handleCreateTicket}
        />
    );
}
