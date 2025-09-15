import React, { useState, useEffect, useRef } from 'react';
import Icons from './Icons';

const ActionCommentModal = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  ticketTitle,
  isCommentRequired = true,
  placeholder = "Please provide a comment for this action...",
  confirmButtonText = "Confirm",
  confirmButtonColor = "blue",
  maxLength = 500
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // Reset comment when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setComment('');
      // Focus on textarea after modal renders
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      setComment('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    // Validate required comment
    if (isCommentRequired && !comment.trim()) {
      return; // Don't submit if comment is required but empty
    }

    setIsSubmitting(true);
    try {
      await onConfirm(comment.trim());
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  const getActionIcon = () => {
    switch (action?.toLowerCase()) {
      case 'approve':
        return <Icons.Approval size={24} className="text-green-600" />;
      case 'reject':
        return <Icons.Rejected size={24} className="text-red-600" />;
      case 'return':
        return <Icons.ChevronLeft size={24} className="text-yellow-600" />;
      case 'cancel':
        return <Icons.Close size={24} className="text-gray-600" />;
      case 'complete':
        return <Icons.Success size={24} className="text-blue-600" />;
      default:
        return <Icons.Comment size={24} className="text-blue-600" />;
    }
  };

  const getActionColor = () => {
    switch (action?.toLowerCase()) {
      case 'approve':
        return 'green';
      case 'reject':
        return 'red';
      case 'return':
        return 'yellow';
      case 'cancel':
        return 'gray';
      case 'complete':
        return 'blue';
      default:
        return confirmButtonColor;
    }
  };

  const getButtonClasses = (color) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    switch (color) {
      case 'green':
        return `${baseClasses} bg-green-600 hover:bg-green-700 text-white`;
      case 'red':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
      case 'yellow':
        return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white`;
      case 'gray':
        return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`;
      case 'blue':
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
    }
  };

  const isCommentValid = !isCommentRequired || comment.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {getActionIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {action} Ticket
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {ticketTitle}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <Icons.Close size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment {isCommentRequired && <span className="text-red-500">*</span>}
              </label>

              <textarea
                ref={textareaRef}
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={4}
                maxLength={maxLength}
                disabled={isSubmitting}
                className={`
                  w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${!isCommentValid && isCommentRequired ? 'border-red-300 focus:ring-red-500' : ''}
                `}
              />

              <div className="flex justify-between items-center mt-2">
                <div>
                  {isCommentRequired && !isCommentValid && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <Icons.Warning size={16} />
                      <span>Comment is required for this action</span>
                    </p>
                  )}
                </div>

                <span className="text-xs text-gray-500">
                  {comment.length}/{maxLength}
                </span>
              </div>
            </div>

            {/* Help text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Icons.Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Action: {action}</p>
                  <p>
                    This action will change the ticket status.
                    {isCommentRequired && " A comment is required to proceed."}
                  </p>
                  <p className="mt-2 text-xs">
                    <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Ctrl+Enter</kbd> to submit,
                    <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs ml-1">Esc</kbd> to cancel
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={!isCommentValid || isSubmitting}
              className={getButtonClasses(getActionColor())}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {getActionIcon()}
                  <span>{confirmButtonText || action}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pre-configured action modals for common workflow actions
export const ApprovalModal = (props) => (
  <ActionCommentModal
    {...props}
    action="Approve"
    confirmButtonText="Approve Ticket"
    placeholder="Please provide a reason for approval (optional)..."
    isCommentRequired={false}
  />
);

export const RejectModal = (props) => (
  <ActionCommentModal
    {...props}
    action="Reject"
    confirmButtonText="Reject Ticket"
    placeholder="Please explain why this ticket is being rejected..."
    isCommentRequired={true}
  />
);

export const ReturnModal = (props) => (
  <ActionCommentModal
    {...props}
    action="Return"
    confirmButtonText="Return Ticket"
    placeholder="Please explain what needs to be addressed..."
    isCommentRequired={true}
  />
);

export const CancelModal = (props) => (
  <ActionCommentModal
    {...props}
    action="Cancel"
    confirmButtonText="Cancel Ticket"
    placeholder="Please provide a reason for cancellation..."
    isCommentRequired={true}
  />
);

export const CompleteModal = (props) => (
  <ActionCommentModal
    {...props}
    action="Complete"
    confirmButtonText="Mark Complete"
    placeholder="Add any final notes about the completion (optional)..."
    isCommentRequired={false}
  />
);

export default ActionCommentModal;