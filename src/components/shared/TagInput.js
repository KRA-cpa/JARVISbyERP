import React, { useState, useEffect, useRef } from 'react';
import Icons from './Icons';

/**
 * TagInput Component
 *
 * Advanced tag input with autocomplete, suggestions, and tag management
 * Supports creating new tags, selecting from existing tags, and bulk operations
 */
const TagInput = ({
  ticketId = null,
  selectedTags = [],
  onTagsChange,
  availableTags = [],
  placeholder = "Add tags...",
  disabled = false,
  maxTags = null,
  allowCreate = true,
  companyId = null,
  className = ""
}) => {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags
        .filter(tag =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.find(selected => selected.id === tag.id)
        )
        .sort((a, b) => {
          // Sort by usage count (higher first), then by name
          if (b.usage_count !== a.usage_count) {
            return b.usage_count - a.usage_count;
          }
          return a.name.localeCompare(b.name);
        })
        .slice(0, 10); // Limit to 10 suggestions

      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 || allowCreate);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setActiveSuggestionIndex(-1);
  }, [inputValue, availableTags, selectedTags, allowCreate]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setError(null);
  };

  // Handle input key events
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && filteredSuggestions[activeSuggestionIndex]) {
          handleTagSelect(filteredSuggestions[activeSuggestionIndex]);
        } else if (inputValue.trim() && allowCreate) {
          handleCreateTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (showSuggestions) {
          const maxIndex = allowCreate ? filteredSuggestions.length : filteredSuggestions.length - 1;
          setActiveSuggestionIndex(prev =>
            prev < maxIndex ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (showSuggestions) {
          setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && selectedTags.length > 0) {
          // Remove last tag if input is empty
          handleTagRemove(selectedTags[selectedTags.length - 1]);
        }
        break;

      case ',':
      case ';':
        e.preventDefault();
        if (inputValue.trim() && allowCreate) {
          handleCreateTag(inputValue.trim());
        }
        break;
    }
  };

  // Handle tag selection from suggestions
  const handleTagSelect = (tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    const newTags = [...selectedTags, tag];
    onTagsChange(newTags);
    setInputValue('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Handle creating new tag
  const handleCreateTag = async (tagName) => {
    if (!allowCreate) return;

    if (maxTags && selectedTags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    // Check if tag already exists
    const existingTag = availableTags.find(tag =>
      tag.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      handleTagSelect(existingTag);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create new tag (this would typically call an API)
      const newTag = {
        id: `temp_${Date.now()}`, // Temporary ID
        name: tagName,
        color: '#3B82F6',
        description: '',
        tag_category: 'general',
        usage_count: 0,
        is_new: true
      };

      const newTags = [...selectedTags, newTag];
      onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      inputRef.current?.focus();

    } catch (error) {
      setError('Failed to create tag');
      console.error('Error creating tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag removal
  const handleTagRemove = (tagToRemove) => {
    if (disabled) return;

    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim() || filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 150);
  };

  // Get tag color style
  const getTagStyle = (tag) => ({
    backgroundColor: tag.color || '#3B82F6',
    color: '#FFFFFF'
  });

  // Get suggestion item class
  const getSuggestionClass = (index) => {
    const baseClass = "px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100";
    return index === activeSuggestionIndex ? `${baseClass} bg-blue-50` : baseClass;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main input area */}
      <div className={`
        flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[40px] bg-white
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-text'}
        ${error ? 'border-red-300' : 'border-gray-300'}
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
      `} onClick={() => !disabled && inputRef.current?.focus()}>

        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <div
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium"
            style={getTagStyle(tag)}
          >
            <span>{tag.name}</span>
            {tag.is_new && (
              <span className="text-xs opacity-75">(new)</span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagRemove(tag);
                }}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5"
              >
                <Icons.X size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          disabled={disabled || isLoading || (maxTags && selectedTags.length >= maxTags)}
          className="flex-1 min-w-[120px] outline-none bg-transparent disabled:cursor-not-allowed"
        />

        {/* Loading indicator */}
        {isLoading && (
          <Icons.Loading className="animate-spin h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <Icons.Alert size={16} />
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Existing tag suggestions */}
          {filteredSuggestions.map((tag, index) => (
            <div
              key={tag.id}
              className={getSuggestionClass(index)}
              onClick={() => handleTagSelect(tag)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#3B82F6' }}
                />
                <span className="font-medium">{tag.name}</span>
                {tag.description && (
                  <span className="text-sm text-gray-500">- {tag.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {tag.usage_count > 0 && (
                  <span>{tag.usage_count} uses</span>
                )}
                <span className="capitalize">{tag.tag_category}</span>
              </div>
            </div>
          ))}

          {/* Create new tag option */}
          {allowCreate && inputValue.trim() &&
           !filteredSuggestions.find(tag =>
             tag.name.toLowerCase() === inputValue.toLowerCase()
           ) && (
            <div
              className={getSuggestionClass(filteredSuggestions.length)}
              onClick={() => handleCreateTag(inputValue.trim())}
            >
              <div className="flex items-center gap-2">
                <Icons.Plus size={16} className="text-blue-500" />
                <span>Create "<strong>{inputValue.trim()}</strong>"</span>
              </div>
              <span className="text-xs text-gray-400">New tag</span>
            </div>
          )}

          {/* No suggestions message */}
          {filteredSuggestions.length === 0 && (!allowCreate || !inputValue.trim()) && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              {inputValue.trim() ? 'No matching tags found' : 'Start typing to see suggestions'}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {!disabled && (
        <div className="mt-1 text-xs text-gray-500">
          {maxTags && `${selectedTags.length}/${maxTags} tags selected. `}
          Press Enter or comma to add tags
          {allowCreate && ', type to create new tags'}
          {selectedTags.length > 0 && ', backspace to remove last tag'}
        </div>
      )}
    </div>
  );
};

export default TagInput;