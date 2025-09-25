#!/usr/bin/env node

/**
 * Test Environment Setup Script
 * Prepares the environment for running automated tests
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function installDependencies() {
  log('📦 Checking test dependencies...', 'blue');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event'
  ];

  const missingDeps = requiredDeps.filter(dep =>
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );

  if (missingDeps.length > 0) {
    log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`, 'yellow');
    log('Installing missing test dependencies...', 'cyan');

    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install', ...missingDeps, '--save-dev'], {
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          log('✅ Dependencies installed successfully', 'green');
          resolve();
        } else {
          log('❌ Failed to install dependencies', 'red');
          reject(new Error('Dependency installation failed'));
        }
      });
    });
  } else {
    log('✅ All test dependencies are installed', 'green');
  }
}

function createTestDirectories() {
  log('📁 Creating test directories...', 'blue');

  const dirs = [
    'src/tests',
    'src/tests/integration',
    'src/tests/e2e',
    'src/tests/mocks',
    'test-results',
    'coverage'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created: ${dir}`, 'cyan');
    }
  });

  log('✅ Test directories ready', 'green');
}

function createJestConfig() {
  log('⚙️  Setting up Jest configuration...', 'blue');

  const jestConfig = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
      '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
    ],
    collectCoverageFrom: [
      'src/**/*.{js,jsx}',
      '!src/index.js',
      '!src/reportWebVitals.js',
      '!src/setupTests.js',
      '!src/**/*.test.js',
      '!src/tests/**/*'
    ],
    coverageThreshold: {
      global: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    transformIgnorePatterns: [
      'node_modules/(?!([@]?react-router|[@]?testing-library)/)'
    ],
    testTimeout: 30000
  };

  // Check if jest.config.js already exists
  if (!fs.existsSync('jest.config.js')) {
    const configContent = `module.exports = ${JSON.stringify(jestConfig, null, 2)};`;
    fs.writeFileSync('jest.config.js', configContent);
    log('Created: jest.config.js', 'cyan');
  }

  log('✅ Jest configuration ready', 'green');
}

function updatePackageJsonScripts() {
  log('📝 Updating package.json scripts...', 'blue');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const testScripts = {
    'test': 'react-scripts test',
    'test:unit': 'node scripts/test-runner.js --suite=unit',
    'test:integration': 'node scripts/test-runner.js --suite=integration',
    'test:hooks': 'node scripts/test-runner.js --suite=hooks',
    'test:api': 'node scripts/test-runner.js --suite=api',
    'test:all': 'node scripts/test-runner.js',
    'test:coverage': 'npm test -- --coverage --watchAll=false',
    'test:ci': 'node scripts/test-runner.js --ci',
    'test:watch': 'npm test -- --watch',
    'test:debug': 'node --inspect-brk scripts/test-runner.js',
    'test:setup': 'node scripts/setup-tests.js'
  };

  let updated = false;
  for (const [script, command] of Object.entries(testScripts)) {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
      updated = true;
      log(`Added script: ${script}`, 'cyan');
    }
  }

  if (updated) {
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    log('✅ Package.json updated', 'green');
  } else {
    log('✅ Package.json scripts are up to date', 'green');
  }
}

function createTestMocks() {
  log('🎭 Creating test mocks...', 'blue');

  // Firebase mock
  const firebaseMock = `// Firebase Mock for Testing
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
};

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
  signOut: mockAuth.signOut,
  onAuthStateChanged: mockAuth.onAuthStateChanged
}));

export default mockAuth;`;

  // API mock
  const apiMock = `// API Mock for Testing
export const mockAPIResponses = {
  companies: { success: true, data: [] },
  users: { success: true, data: [] },
  tickets: { success: true, data: [] },
  ticketTypes: { success: true, data: [] },
  roles: { success: true, data: [] }
};

export const mockFetch = jest.fn((url) => {
  const action = new URL(url).searchParams.get('action');
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockAPIResponses[action] || { success: false })
  });
});

// Setup global fetch mock
beforeEach(() => {
  global.fetch = mockFetch;
});

export default mockFetch;`;

  const mockFiles = [
    { path: 'src/tests/mocks/firebase.js', content: firebaseMock },
    { path: 'src/tests/mocks/api.js', content: apiMock }
  ];

  mockFiles.forEach(({ path, content }) => {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, content);
      log(`Created: ${path}`, 'cyan');
    }
  });

  log('✅ Test mocks ready', 'green');
}

function createGitHubActions() {
  log('🔧 Creating GitHub Actions workflow...', 'blue');

  const workflowDir = '.github/workflows';
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const workflowContent = `name: Automated Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run test setup
      run: npm run test:setup

    - name: Run all tests
      run: npm run test:ci

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        directory: ./coverage

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-\${{ matrix.node-version }}
        path: test-results/
`;

  const workflowPath = path.join(workflowDir, 'tests.yml');
  if (!fs.existsSync(workflowPath)) {
    fs.writeFileSync(workflowPath, workflowContent);
    log('Created: .github/workflows/tests.yml', 'cyan');
  }

  log('✅ GitHub Actions workflow ready', 'green');
}

async function main() {
  try {
    log('🚀 Setting up test environment for React Ticketing System...', 'bright');
    log('');

    await installDependencies();
    createTestDirectories();
    createJestConfig();
    updatePackageJsonScripts();
    createTestMocks();
    createGitHubActions();

    log('');
    log('🎉 Test environment setup complete!', 'bright');
    log('');
    log('Available test commands:', 'cyan');
    log('  npm run test:all        - Run all test suites', 'cyan');
    log('  npm run test:unit       - Run unit tests only', 'cyan');
    log('  npm run test:integration - Run integration tests', 'cyan');
    log('  npm run test:coverage   - Run tests with coverage', 'cyan');
    log('  npm run test:watch      - Run tests in watch mode', 'cyan');
    log('');
    log('To run tests now: npm run test:all', 'green');

  } catch (error) {
    log(`💥 Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };