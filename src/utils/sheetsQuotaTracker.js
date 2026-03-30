/**
 * Google Sheets / Apps Script Quota Tracker
 *
 * Tracks client-side API call counts against known Google Apps Script
 * daily quota limits. Persists counts in localStorage so the counter
 * survives page refreshes within the same calendar day (UTC).
 *
 * Hard limits (per Google documentation, as of 2026):
 *   Free (gmail.com) account  : 20,000 URL Fetch calls / day
 *   Google Workspace account  : 100,000 URL Fetch calls / day
 *   Concurrent executions     : ~30 across all users
 *   Script execution per run  : 6 minutes
 *   Daily trigger runtime     : 90 min (free) / 6 hrs (Workspace)
 *
 * Warning thresholds:
 *   WARN  : 70% of daily limit
 *   DANGER: 90% of daily limit
 */

const STORAGE_KEY = 'jarvis_sheets_quota';

// Daily URL Fetch call limits by account tier
export const QUOTA_LIMITS = {
  free: 20000,
  workspace: 100000,
};

// Concurrent execution ceiling (applies regardless of tier)
export const CONCURRENT_LIMIT = 30;

const WARNING_PCT = 0.7;
const DANGER_PCT = 0.9;

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — degrade silently
  }
}

function freshState(tier = 'workspace') {
  return {
    date: getTodayUTC(),
    tier,
    callCount: 0,
    concurrentPeak: 0,
    lastReset: new Date().toISOString(),
  };
}

class SheetsQuotaTracker {
  constructor() {
    this._state = this._hydrate();
    this._concurrent = 0;
    this._listeners = new Set();
  }

  // Rehydrate from localStorage, reset if a new UTC day has started
  _hydrate() {
    const saved = loadState();
    const today = getTodayUTC();
    if (saved && saved.date === today) {
      return saved;
    }
    const tier = saved?.tier || 'workspace';
    return freshState(tier);
  }

  _persist() {
    saveState(this._state);
    this._listeners.forEach(fn => fn(this.getStatus()));
  }

  // Call this once when the account tier is known (e.g. from admin settings)
  setTier(tier) {
    if (tier !== this._state.tier) {
      this._state.tier = tier;
      this._persist();
    }
  }

  // Call before every API request
  recordCallStart() {
    this._state = this._hydrate(); // reset if new day
    this._state.callCount += 1;
    this._concurrent += 1;
    if (this._concurrent > this._state.concurrentPeak) {
      this._state.concurrentPeak = this._concurrent;
    }
    this._persist();
  }

  // Call after every API request completes (success or failure)
  recordCallEnd() {
    if (this._concurrent > 0) this._concurrent -= 1;
  }

  getStatus() {
    const state = this._hydrate();
    const limit = QUOTA_LIMITS[state.tier] || QUOTA_LIMITS.workspace;
    const used = state.callCount;
    const pct = used / limit;

    let level = 'ok';
    if (pct >= DANGER_PCT) level = 'danger';
    else if (pct >= WARNING_PCT) level = 'warn';

    return {
      tier: state.tier,
      date: state.date,
      callCount: used,
      limit,
      remaining: Math.max(0, limit - used),
      percentUsed: Math.min(100, Math.round(pct * 100)),
      level,                          // 'ok' | 'warn' | 'danger'
      concurrentNow: this._concurrent,
      concurrentPeak: state.concurrentPeak,
      concurrentLimit: CONCURRENT_LIMIT,
      concurrentLevel: this._concurrent >= CONCURRENT_LIMIT * 0.8 ? 'warn' : 'ok',
      lastReset: state.lastReset,
    };
  }

  // Subscribe to status changes
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  reset() {
    this._state = freshState(this._state.tier);
    this._concurrent = 0;
    this._persist();
  }
}

// Singleton — import this everywhere
export const quotaTracker = new SheetsQuotaTracker();
