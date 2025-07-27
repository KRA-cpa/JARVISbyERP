import React, { useState } from 'react';

/**
 * =================================================================================
 * ActionCommentModal Component (components/shared/ActionCommentModal.js)
 * ---------------------------------------------------------------------------------
 * A reusable modal component that requires a user to enter a comment before
 * confirming a critical action like approving, returning, or rejecting a ticket.
 * =================================================================================
 */
export default function ActionCommentModal({ action, isOpen, onClose, onConfirm }) {
    const [comment, setComment] = useState('');

    // Don't render anything if the modal is not open
    if (!isOpen) {
        return null;
    }

    const handleConfirm = () => {
        // Pass the comment back to the parent component and close the modal
        onConfirm(comment);
        setComment('');
        onClose();
    };

    // Dynamically set button colors and titles based on the action type
    const actionConfig = {
        Approve: {
            title: 'Confirm Approval',
            buttonClass: 'bg-green-600 hover:bg-green-700',
        },
        Return: {
            title: 'Confirm Return',
            buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900',
        },
        Reject: {
            title: 'Confirm Rejection',
            buttonClass: 'bg-red-600 hover:bg-red-700',
        },
        Cancel: {
            title: 'Confirm Cancellation',
            buttonClass: 'bg-gray-600 hover:bg-gray-700',
        }
    };

    const config = actionConfig[action] || { title: `Confirm ${action}`, buttonClass: 'bg-indigo-600 hover:bg-indigo-700' };

    return (
        <div 
            // This creates the modal backdrop
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose} // Allow closing by clicking the backdrop
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{config.title}</h2>
                <p className="text-sm text-gray-600 mb-4">
                    A comment is required to {action.toLowerCase()} this ticket. Please provide a reason or justification below.
                </p>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide justification..."
                    className="w-full border-gray-300 rounded-md shadow-sm h-28 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!comment.trim()} // Disable button if comment is empty
                        className={`px-4 py-2 text-white rounded-md ${config.buttonClass} disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    >
                        Confirm {action}
                    </button>
                </div>
            </div>
        </div>
    );
}
