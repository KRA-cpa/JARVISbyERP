import React, { useState, useEffect } from 'react';
import Icons from '../shared/Icons';
import TagInput from '../shared/TagInput';

/**
 * TicketTagManager Component
 *
 * Comprehensive tag management interface for ticket details
 * Handles tag assignment, removal, creation, and tag-based insights
 */
const TicketTagManager = ({
  ticketId,
  ticketNumber,
  companyId,
  currentUserId,
  canEdit = true,
  onTagsUpdated,
  className = ""
}) => {
  // State management
  const [currentTags, setCurrentTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tagHistory, setTagHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load ticket tags and available tags on mount
  useEffect(() => {
    if (ticketId) {
      loadTicketTags();
      loadAvailableTags();
      if (canEdit) {
        loadSmartSuggestions();
      }
    }
  }, [ticketId, companyId]);

  // Load current ticket tags
  const loadTicketTags = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tickets/${ticketId}/tags`);
      if (response.ok) {
        const data = await response.json();
        setCurrentTags(data.tags || []);
      } else {
        throw new Error('Failed to load ticket tags');
      }
    } catch (error) {
      console.error('Error loading ticket tags:', error);
      setError('Failed to load ticket tags');
      // Mock data for development
      setCurrentTags([
        {
          id: 'tag_1',
          name: 'High Priority',
          color: '#EF4444',
          description: 'High priority items',
          tag_category: 'priority',
          assigned_at: '2025-09-28T10:00:00Z',
          assigned_by: 'user_1'
        },
        {
          id: 'tag_2',
          name: 'Finance',
          color: '#10B981',
          description: 'Finance department related',
          tag_category: 'department',
          assigned_at: '2025-09-28T10:30:00Z',
          assigned_by: 'user_2'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load available tags for the company
  const loadAvailableTags = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tags?companyId=${companyId}&includeGlobal=true`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      } else {
        throw new Error('Failed to load available tags');
      }
    } catch (error) {
      console.error('Error loading available tags:', error);
      // Mock data for development
      setAvailableTags([
        { id: 'tag_1', name: 'High Priority', color: '#EF4444', usage_count: 45, tag_category: 'priority' },
        { id: 'tag_2', name: 'Finance', color: '#10B981', usage_count: 32, tag_category: 'department' },
        { id: 'tag_3', name: 'Urgent', color: '#F59E0B', usage_count: 28, tag_category: 'priority' },
        { id: 'tag_4', name: 'IT Support', color: '#3B82F6', usage_count: 22, tag_category: 'department' },
        { id: 'tag_5', name: 'Bug', color: '#EF4444', usage_count: 19, tag_category: 'issue_type' },
        { id: 'tag_6', name: 'Enhancement', color: '#8B5CF6', usage_count: 15, tag_category: 'issue_type' }
      ]);
    }
  };

  // Load smart tag suggestions based on ticket content
  const loadSmartSuggestions = async () => {
    try {
      // TODO: Replace with actual API call that analyzes ticket content
      const response = await fetch(`/api/tickets/${ticketId}/tag-suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      // Mock smart suggestions based on ticket content analysis
      setSmartSuggestions([
        { id: 'tag_3', name: 'Urgent', color: '#F59E0B', confidence: 0.85, reason: 'Keyword "urgent" found in title' },
        { id: 'tag_4', name: 'IT Support', color: '#3B82F6', confidence: 0.72, reason: 'Similar tickets tagged with IT Support' }
      ]);
    }
  };

  // Load tag history for this ticket
  const loadTagHistory = async () => {
    if (tagHistory.length > 0) return; // Already loaded

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tickets/${ticketId}/tag-history`);
      if (response.ok) {
        const data = await response.json();
        setTagHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading tag history:', error);
      // Mock tag history
      setTagHistory([
        {
          id: 'hist_1',
          action: 'added',
          tag_name: 'High Priority',
          tag_color: '#EF4444',
          user_name: 'John Doe',
          timestamp: '2025-09-28T10:00:00Z',
          notes: 'Escalated to high priority due to customer impact'
        },
        {
          id: 'hist_2',
          action: 'added',
          tag_name: 'Finance',
          tag_color: '#10B981',
          user_name: 'Jane Smith',
          timestamp: '2025-09-28T10:30:00Z',
          notes: 'Requires finance team review'
        }
      ]);
    }
  };

  // Handle tags change from TagInput component
  const handleTagsChange = async (newTags) => {
    if (!canEdit) return;

    setIsSaving(true);
    setError(null);

    try {
      // Determine which tags to add and remove
      const currentTagIds = currentTags.map(tag => tag.id);
      const newTagIds = newTags.map(tag => tag.id);

      const tagsToAdd = newTags.filter(tag => !currentTagIds.includes(tag.id));
      const tagsToRemove = currentTags.filter(tag => !newTagIds.includes(tag.id));

      // Add new tags
      if (tagsToAdd.length > 0) {
        const addResponse = await fetch(`/api/tickets/${ticketId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tagIds: tagsToAdd.map(tag => tag.id),
            assignedByUserId: currentUserId,
            notes: `Assigned via tag manager`
          })
        });

        if (!addResponse.ok) {
          throw new Error('Failed to add tags');
        }
      }

      // Remove tags
      if (tagsToRemove.length > 0) {
        const removeResponse = await fetch(`/api/tickets/${ticketId}/tags`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tagIds: tagsToRemove.map(tag => tag.id),
            removedByUserId: currentUserId,
            reason: 'Removed via tag manager'
          })
        });

        if (!removeResponse.ok) {
          throw new Error('Failed to remove tags');
        }
      }

      // Update local state
      setCurrentTags(newTags);

      // Notify parent component
      if (onTagsUpdated) {
        onTagsUpdated(newTags);
      }

    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Failed to update tags: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply smart suggestion
  const handleApplySuggestion = async (suggestion) => {
    const updatedTags = [...currentTags, suggestion];
    await handleTagsChange(updatedTags);

    // Remove applied suggestion
    setSmartSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Dismiss smart suggestion
  const handleDismissSuggestion = (suggestionId) => {
    setSmartSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  // Toggle tag history view
  const handleToggleHistory = () => {
    if (!showHistory) {
      loadTagHistory();
    }
    setShowHistory(prev => !prev);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get tag category color
  const getCategoryColor = (category) => {
    const colors = {
      priority: '#EF4444',
      department: '#10B981',
      issue_type: '#8B5CF6',
      status: '#F59E0B',
      project: '#3B82F6',
      general: '#6B7280'
    };
    return colors[category] || colors.general;
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Icons.Loading className="animate-spin h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Loading tags...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Tag className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              Tags {currentTags.length > 0 && `(${currentTags.length})`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {currentTags.length > 0 && (
              <button
                onClick={handleToggleHistory}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Icons.History size={14} />
                History
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Tags Display */}
      <div className="p-4">
        {currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentTags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: tag.color }}
                title={`${tag.description}\nAssigned: ${formatTimestamp(tag.assigned_at)}`}
              >
                <span>{tag.name}</span>
                {isExpanded && (
                  <span className="text-xs opacity-75 capitalize">
                    ({tag.tag_category})
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Icons.Tag className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No tags assigned</p>
            {canEdit && (
              <p className="text-xs mt-1">Use the tag input below to add tags</p>
            )}
          </div>
        )}

        {/* Tag Input (Edit Mode) */}
        {canEdit && (
          <div className="space-y-4">
            <TagInput
              ticketId={ticketId}
              selectedTags={currentTags}
              onTagsChange={handleTagsChange}
              availableTags={availableTags}
              placeholder="Add tags to categorize this ticket..."
              disabled={isSaving}
              companyId={companyId}
              maxTags={10}
            />

            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icons.Loading className="animate-spin h-4 w-4" />
                Saving changes...
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <Icons.Alert size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Smart Suggestions (Expanded Mode) */}
      {isExpanded && canEdit && smartSuggestions.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Icons.Lightbulb className="h-4 w-4 text-yellow-500" />
            Smart Suggestions
          </h4>

          <div className="space-y-2">
            {smartSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: suggestion.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-blue-900">
                      {suggestion.name}
                    </span>
                    <div className="text-xs text-blue-700 mt-1">
                      {suggestion.reason} ({Math.round(suggestion.confidence * 100)}% confidence)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleDismissSuggestion(suggestion.id)}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag History (Expanded Mode) */}
      {showHistory && tagHistory.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Icons.History className="h-4 w-4" />
            Tag History
          </h4>

          <div className="space-y-3">
            {tagHistory.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0">
                  {entry.action === 'added' ? (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Icons.Plus size={12} className="text-green-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <Icons.Minus size={12} className="text-red-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{entry.user_name}</span>
                    <span className="text-gray-600">
                      {entry.action} tag
                    </span>
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: entry.tag_color }}
                    >
                      {entry.tag_name}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(entry.timestamp)}
                    {entry.notes && (
                      <span className="block mt-1 text-gray-600">
                        Note: {entry.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Analytics (Expanded Mode) */}
      {isExpanded && currentTags.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Icons.BarChart className="h-4 w-4" />
            Tag Insights
          </h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-gray-600">Most Used Category</div>
              <div className="font-medium mt-1">
                {currentTags.reduce((acc, tag) => {
                  acc[tag.tag_category] = (acc[tag.tag_category] || 0) + 1;
                  return acc;
                }, {})}
                Priority
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-gray-600">Last Updated</div>
              <div className="font-medium mt-1">
                {currentTags.length > 0 ? formatTimestamp(
                  Math.max(...currentTags.map(tag => new Date(tag.assigned_at)))
                ) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTagManager;