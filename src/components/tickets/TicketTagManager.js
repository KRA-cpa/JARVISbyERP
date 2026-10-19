import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../api/googleSheet';
import Icons from '../shared/Icons';
import TagInput from '../shared/TagInput';

/**
 * TicketTagManager - the Tags tab of TicketDetail (AppScript v9.3).
 *
 * Shows the ticket's tags and, when canEdit, adds / removes them with TagInput. A tag typed that doesn't
 * exist yet is created for the ticket's company first. Only shown when the ticket type has tags turned on;
 * the backend refuses tagging otherwise. Changes are logged in the ticket's system log (TAGS_ADDED /
 * TAGS_REMOVED).
 *
 * Props: ticketId, companyId, currentUserId, canEdit, onTagsUpdated(tags)
 */
const TicketTagManager = ({
  ticketId,
  companyId,
  currentUserId,
  canEdit = true,
  onTagsUpdated,
  className = ''
}) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ticketTags, companyTags] = await Promise.all([
        API.Tags.getForTicket(ticketId),
        API.Tags.getAll(companyId)
      ]);
      setCurrentTags(ticketTags);
      setAvailableTags(companyTags);
    } catch (err) {
      setError(err.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  // TagInput hands back the whole new selection: work out what was added / removed
  const handleTagsChange = async (newTags) => {
    if (!canEdit) return;
    setIsSaving(true);
    setError(null);
    try {
      const currentIds = currentTags.map(tag => String(tag.id));
      const keptIds = newTags.filter(tag => !tag.is_new).map(tag => String(tag.id));

      // New names typed into TagInput become tags of this company
      const created = [];
      for (const tag of newTags.filter(t => t.is_new)) {
        created.push(await API.Tags.create({ name: tag.name, color: tag.color, company_id: companyId || '' }, currentUserId));
      }

      const toAdd = keptIds.filter(id => !currentIds.includes(id)).concat(created.map(tag => String(tag.id)));
      const toRemove = currentIds.filter(id => !keptIds.includes(id));

      let latest = currentTags;
      if (toAdd.length > 0) latest = await API.Tags.assign(ticketId, toAdd, currentUserId);
      if (toRemove.length > 0) latest = await API.Tags.remove(ticketId, toRemove, currentUserId, 'Removed in ticket details');
      setCurrentTags(latest);
      if (created.length > 0) setAvailableTags(await API.Tags.getAll(companyId));
      onTagsUpdated?.(latest);
    } catch (err) {
      setError(err.message || 'Failed to update tags');
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icons.Tag size={18} className="text-gray-500" />
          <h4 className="text-sm font-medium text-gray-900">Tags {currentTags.length > 0 && `(${currentTags.length})`}</h4>
        </div>
        {(isLoading || isSaving) && <Icons.Loading size={16} className="text-gray-400" />}
      </div>

      {canEdit ? (
        <TagInput
          ticketId={ticketId}
          selectedTags={currentTags}
          onTagsChange={handleTagsChange}
          availableTags={availableTags}
          disabled={isSaving || isLoading}
          companyId={companyId}
          placeholder="Add a tag..."
        />
      ) : currentTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {currentTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: tag.color || '#3B82F6' }}
              title={tag.description || ''}
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : (
        !isLoading && <p className="text-sm text-gray-500">No tags</p>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <Icons.Alert size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default TicketTagManager;
