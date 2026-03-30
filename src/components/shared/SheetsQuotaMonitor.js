import React, { useState, useEffect } from 'react';
import { quotaTracker, QUOTA_LIMITS } from '../../utils/sheetsQuotaTracker';
import Icons from './Icons';

const LEVEL_STYLES = {
  ok:     { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-800',  border: 'border-green-200' },
  warn:   { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' },
  danger: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-800',      border: 'border-red-200' },
};

const TIER_LABELS = { free: 'Free (gmail)', workspace: 'Workspace' };

const SheetsQuotaMonitor = ({ minimized = true, className = '' }) => {
  const [status, setStatus] = useState(() => quotaTracker.getStatus());
  const [expanded, setExpanded] = useState(!minimized);

  useEffect(() => {
    setStatus(quotaTracker.getStatus());
    const unsub = quotaTracker.subscribe(setStatus);
    return unsub;
  }, []);

  const handleTierChange = (e) => {
    quotaTracker.setTier(e.target.value);
    setStatus(quotaTracker.getStatus());
  };

  const handleReset = () => {
    if (window.confirm('Reset today\'s quota counter?')) {
      quotaTracker.reset();
      setStatus(quotaTracker.getStatus());
    }
  };

  const styles = LEVEL_STYLES[status.level] || LEVEL_STYLES.ok;
  const concStyles = LEVEL_STYLES[status.concurrentLevel] || LEVEL_STYLES.ok;

  return (
    <div className={`rounded-lg border ${styles.border} bg-white shadow-sm ${className}`}>
      {/* Header row */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          <Icons.Info size={16} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Sheets Quota</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${styles.badge}`}>
            {status.percentUsed}%
          </span>
          {status.level === 'danger' && (
            <span className="text-xs text-red-600 font-semibold animate-pulse">NEAR LIMIT</span>
          )}
        </div>
        <Icons.ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Daily call progress bar (always visible) */}
      <div className="px-3 pb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${styles.bar}`}
            style={{ width: `${status.percentUsed}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-gray-400">{status.callCount.toLocaleString()} used</span>
          <span className="text-xs text-gray-400">{status.limit.toLocaleString()} limit</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2 space-y-3">
          {/* Tier selector */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account tier</label>
            <select
              value={status.tier}
              onChange={handleTierChange}
              className="text-xs border border-gray-200 rounded px-2 py-1 w-full"
            >
              {Object.entries(QUOTA_LIMITS).map(([tier, limit]) => (
                <option key={tier} value={tier}>
                  {TIER_LABELS[tier]} — {limit.toLocaleString()} calls/day
                </option>
              ))}
            </select>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500">Remaining</span>
            <span className="font-mono font-medium text-gray-800">
              {status.remaining.toLocaleString()}
            </span>

            <span className="text-gray-500">Concurrent now</span>
            <span className={`font-mono font-medium ${status.concurrentLevel === 'warn' ? 'text-yellow-600' : 'text-gray-800'}`}>
              {status.concurrentNow} / {status.concurrentLimit}
            </span>

            <span className="text-gray-500">Concurrent peak</span>
            <span className="font-mono font-medium text-gray-800">
              {status.concurrentPeak}
            </span>

            <span className="text-gray-500">Resets at</span>
            <span className="font-mono text-gray-800">
              {status.date} 00:00 UTC
            </span>
          </div>

          {/* Concurrent bar */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-gray-500">Concurrent executions</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${concStyles.bar}`}
                style={{ width: `${Math.min(100, (status.concurrentPeak / status.concurrentLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Warnings */}
          {status.level === 'warn' && (
            <div className="text-xs text-yellow-700 bg-yellow-50 rounded p-2">
              Approaching daily limit. Consider enabling caching or reducing poll frequency.
            </div>
          )}
          {status.level === 'danger' && (
            <div className="text-xs text-red-700 bg-red-50 rounded p-2">
              90%+ of daily quota used. New requests may fail until midnight UTC.
            </div>
          )}
          {status.concurrentLevel === 'warn' && (
            <div className="text-xs text-yellow-700 bg-yellow-50 rounded p-2">
              High concurrency ({status.concurrentNow}/{status.concurrentLimit}). Requests may be queued.
            </div>
          )}

          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Reset counter
          </button>
        </div>
      )}
    </div>
  );
};

export default SheetsQuotaMonitor;
