import React from 'react';

// --- Helper Icons (Inlined for portability) ---
const FilePlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
);

/**
 * =================================================================================
 * TicketListItem Component (components/dashboard/TicketListItem.js)
 * ---------------------------------------------------------------------------------
 * Renders a single row in the ticket list, displaying summary information.
 * =================================================================================
 */
function TicketListItem({ ticket, onSelectTicket }) {
    // This function would be more dynamic in a real app, likely reading from a config
    const getStatusInfo = (status) => {
        const statusClasses = {
            'Pending Manager Approval': 'bg-purple-100 text-purple-800',
            'Pending Finance Review': 'bg-yellow-100 text-yellow-800',
            'Closed': 'bg-green-100 text-green-800',
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <li onClick={() => onSelectTicket(ticket.id)} className="p-4 hover:bg-gray-50 cursor-pointer transition">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-600 truncate">{ticket.type || 'Ticket'} #{ticket.id}</p>
                    <p className="text-md font-medium text-gray-900 mt-1">{ticket.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Created by {ticket.requesterName} on {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right ml-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusInfo(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>
            </div>
        </li>
    );
}