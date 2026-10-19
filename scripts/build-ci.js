#!/usr/bin/env node
/**
 * Production build the way Vercel runs it: CI=true, so Create React App fails on any
 * ESLint warning ("Treating warnings as errors because process.env.CI = true").
 * A plain `npm run build` only prints those warnings, which is how the Vercel deploys
 * failed unnoticed from 24934fd (19 Oct 2026).
 *
 * Usage: npm run build:ci
 *
 * The ESLint cache is removed first: it decides what to re-lint from file metadata, and on
 * the Z: drive that was stale, so a cached run reported fixed files (and could pass broken ones).
 */
const fs = require('fs');
const path = require('path');

const eslintCache = path.join(__dirname, '..', 'node_modules', '.cache', '.eslintcache');
fs.rmSync(eslintCache, { force: true });

process.env.CI = 'true';
require('react-scripts/scripts/build');
