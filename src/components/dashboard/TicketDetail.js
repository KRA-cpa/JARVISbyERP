import React, { useState, useEffect } from 'react';
// In a real project, these would be imported from their respective files
 import api from '../../api/googleSheet';
import { ArrowLeftIcon } from '../shared/Icons';
import LoadingScreen from '../shared/LoadingScreen';

// --- Helper Icons (Inlined for portability) ---
const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

// --- Mock Data (for demonstration until API is fully connected) ---
const MOCK_TICKET_DETAILS = {
    id: 101,
    ticket_number: "MYCO-PR-2025-00000001",
    title: 'New Developer Laptop',
    status: 'Pending Manager Approval',
    description: 'Requesting a new M3 MacBook Pro for a new hire in the engineering department. The current machine is outdated and causing performance issues.',
    requesterName: 'Charlie',
    created_at: '2025-07-17T10:00:00Z',
    customFields: [
        { label: 'Item Name', value: 'MacBook Pro 16-inch' },
        { label: 'Estimated Value ($)', value: '2499.00' },
        { label: 'Department', value: 'Engineering' },
    ],
    history: [
        { action: 'Returned', user: 'Alice (Manager)', timestamp: '2025-07-17T14:05:00Z', comment: 'Please attach the official quote from the vendor.' },
        { action: 'Approved', user: 'Bob (Finance)', timestamp: '2025-07-17T12:30:00Z', comment: 'Initial budget approved.' },
        { action: 'Created', user: 'Charlie', timestamp: '2025-07-17T10:00:00Z', comment: 'Ticket submitted.' }
    ],
    attachments: [
        { fileName: 'vendor_quote_q3.pdf', uploadedBy: 'Charlie', uploaded_at: '2025-07-17T14:15:00Z' }
    ]
};


/**
 * =================================================================================
 * TicketDetail Component (components/dashboard/TicketDetail.js)
 * ---------------------------------------------------------------------------------
 * Renders the detailed view of a single ticket, including all its fields,
 * history, and actions.
 * =================================================================================
 */
export default function TicketDetail({ ticketId, onBack }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        // In a real app, this would be an API call:
        // api.getTicketDetails(ticketId).then(response => {
        //     if (response.status === 'success') setTicket(response.data);
        //     else setError(response.message);
        // }).catch(setError).finally(() => setLoading(false));
        
        console.log(`Fetching details for ticket ID: ${ticketId}`);
        // Simulate network delay for POC
        setTimeout(() => { 
            setTicket(MOCK_TICKET_DETAILS);
            setLoading(false);
        }, 500);
    }, [ticketId]);

    if (loading) {
        // In a real app, you would import and use the LoadingScreen component
        return <div>Loading ticket details...</div>;
    }
    
    if (error) {
        return <div className="text-center p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>;
    }

    if (!ticket) {
        return <div className="text-center p-4">Ticket not found.</div>;
    }

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-sm text-indigo-600 font-semibold hover:text-indigo-800 mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Dashboard
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                           <div className="flex-grow">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">{ticket.status}</span>
                                <h2 className="text-3xl font-bold text-gray-900 mt-2">{ticket.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.ticket_number}</p>
                           </div>
                           <div className="flex-shrink-0">
                                {/* Placeholder for action buttons */}
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                                    <button className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500">Return</button>
                                    <button className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                                </div>
                           </div>
                        </div>
                        
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description || "No description provided."}</p>
                        </div>
                    </div>

                     {/* Attachments Section */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h3>
                         <div className="space-y-3">
                            {(ticket.attachments || []).map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                    <p className="text-sm font-medium text-indigo-600">{file.fileName}</p>
                                    <p className="text-xs text-gray-500">Uploaded by {file.uploadedBy}</p>
                                </div>
                            ))}
                         </div>
                         <button className="mt-4 text-sm text-indigo-600 hover:underline">Upload File</button>
                    </div>
                </div>

                {/* Side Column */}
                <div className="space-y-6">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Requester:</span><span className="font-medium text-gray-800">{ticket.requesterName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Created:</span><span className="font-medium text-gray-800">{new Date(ticket.created_at).toLocaleString()}</span></div>
                            {ticket.customFields && ticket.customFields.map(field => (
                                <div key={field.label} className="flex justify-between">
                                    <span className="text-gray-500">{field.label}:</span>
                                    <span className="font-medium text-gray-800 text-right">{field.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">History</h3>
                        <ul className="space-y-4">
                            {(ticket.history || []).map((item, index) => (
                                <li key={index} className="border-l-2 pl-4">
                                    <p className="font-semibold text-sm">{item.action} by {item.user}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                                    {item.comment && <p className="mt-1 text-sm bg-gray-100 p-2 rounded-md">{item.comment}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
