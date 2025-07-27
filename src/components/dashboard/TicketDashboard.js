import React from 'react';

// --- Helper Icons (Inlined for portability) ---
const FilePlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
);


/**
 * =================================================================================
 * TicketDashboard Component (components/dashboard/TicketDashboard.js)
 * ---------------------------------------------------------------------------------
 * This is the main component for the ticket list view. It displays a header
 * and a list of all tickets, using TicketListItem for each entry.
 * =================================================================================
 */
export default function TicketDashboard({ tickets, onSelectTicket, onCreateTicket }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Tickets</h2>
                <button 
                    onClick={onCreateTicket} 
                    className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center"
                >
                    <FilePlusIcon className="h-5 w-5 mr-2" />
                    New Ticket
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {tickets && tickets.length > 0 ? (
                        tickets.map(ticket => (
                            <TicketListItem 
                                key={ticket.id} 
                                ticket={ticket} 
                                onSelectTicket={onSelectTicket} 
                            />
                        ))
                    ) : (
                        <li className="p-6 text-center text-gray-500">No tickets found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
