#!/usr/bin/env node

/**
 * Automated Test Runner for React Ticketing System
 * Provides comprehensive testing with reporting and CI/CD integration
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test suites to run
  suites: {
    unit: {
      pattern: 'src/**/*.test.js',
      description: 'Unit tests for components and utilities',
      timeout: 30000
    },
    integration: {
      pattern: 'src/tests/integration/**/*.test.js',
      description: 'Integration tests for workflows',
      timeout: 60000
    },
    hooks: {
      pattern: 'src/hooks/**/*.test.js',
      description: 'Tests for React hooks',
      timeout: 20000
    },
    api: {
      pattern: 'src/api/**/*.test.js',
      description: 'API integration tests',
      timeout: 30000
    }
  },

  // Coverage thresholds
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },

  // Reporters
  reporters: ['default', 'jest-junit'],

  // Output directories
  outputDir: 'test-results',
  coverageDir: 'coverage'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      coverage: null,
      suites: {}
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async ensureDirectories() {
    const dirs = [TEST_CONFIG.outputDir, TEST_CONFIG.coverageDir];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Created directory: ${dir}`, 'cyan');
      }
    }
  }

  async runTestSuite(suiteName, config) {
    this.log(`\n🧪 Running ${suiteName} tests...`, 'blue');
    this.log(`📝 ${config.description}`, 'cyan');

    const args = [
      'test',
      '--testPathPattern=' + config.pattern,
      '--testTimeout=' + config.timeout,
      '--passWithNoTests',
      '--verbose'
    ];

    // Add coverage for unit tests
    if (suiteName === 'unit') {
      args.push('--coverage');
      args.push('--coverageDirectory=' + TEST_CONFIG.coverageDir);
      args.push('--coverageReporters=text,lcov,html');
    }

    // Add JUnit reporter for CI/CD
    if (process.env.CI) {
      args.push('--reporters=default,jest-junit');
      args.push(`--outputFile=${TEST_CONFIG.outputDir}/${suiteName}-results.xml`);
    }

    return new Promise((resolve, reject) => {
      const child = spawn('npm', args, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        const success = code === 0;
        this.results.suites[suiteName] = {
          success,
          exitCode: code,
          duration: Date.now() - this.startTime
        };

        if (success) {
          this.log(`✅ ${suiteName} tests passed`, 'green');
          resolve();
        } else {
          this.log(`❌ ${suiteName} tests failed`, 'red');
          resolve(); // Don't reject to continue with other suites
        }
      });

      child.on('error', (error) => {
        this.log(`Error running ${suiteName} tests: ${error.message}`, 'red');
        reject(error);
      });
    });
  }

  async runAllSuites() {
    this.log('🚀 Starting automated test suite...', 'bright');
    this.log(`📊 Running ${Object.keys(TEST_CONFIG.suites).length} test suites\n`, 'cyan');

    await this.ensureDirectories();

    for (const [suiteName, config] of Object.entries(TEST_CONFIG.suites)) {
      try {
        await this.runTestSuite(suiteName, config);
      } catch (error) {
        this.log(`Failed to run ${suiteName}: ${error.message}`, 'red');
      }
    }
  }

  async generateReport() {
    const duration = Date.now() - this.startTime;
    const passed = Object.values(this.results.suites).filter(s => s.success).length;
    const total = Object.keys(this.results.suites).length;

    this.log('\n📊 TEST RESULTS SUMMARY', 'bright');
    this.log('=' .repeat(50), 'cyan');

    // Suite results
    for (const [suiteName, result] of Object.entries(this.results.suites)) {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const color = result.success ? 'green' : 'red';
      this.log(`${suiteName.padEnd(15)} ${status}`, color);
    }

    this.log('=' .repeat(50), 'cyan');

    // Overall results
    const overallStatus = passed === total ? 'PASSED' : 'FAILED';
    const overallColor = passed === total ? 'green' : 'red';

    this.log(`Total Suites:     ${total}`, 'cyan');
    this.log(`Passed:           ${passed}`, 'green');
    this.log(`Failed:           ${total - passed}`, failed > 0 ? 'red' : 'cyan');
    this.log(`Duration:         ${(duration / 1000).toFixed(2)}s`, 'cyan');
    this.log(`Overall Status:   ${overallStatus}`, overallColor);

    // Coverage summary (if available)
    if (fs.existsSync(path.join(TEST_CONFIG.coverageDir, 'coverage-summary.json'))) {
      try {
        const coverageData = JSON.parse(
          fs.readFileSync(path.join(TEST_CONFIG.coverageDir, 'coverage-summary.json'), 'utf8')
        );

        this.log('\n📈 COVERAGE SUMMARY', 'bright');
        this.log('=' .repeat(30), 'cyan');

        const total = coverageData.total;
        this.log(`Statements:       ${total.statements.pct}%`, 'cyan');
        this.log(`Branches:         ${total.branches.pct}%`, 'cyan');
        this.log(`Functions:        ${total.functions.pct}%`, 'cyan');
        this.log(`Lines:            ${total.lines.pct}%`, 'cyan');

        // Check coverage thresholds
        const thresholds = TEST_CONFIG.coverage;
        const warnings = [];

        if (total.statements.pct < thresholds.statements) warnings.push('statements');
        if (total.branches.pct < thresholds.branches) warnings.push('branches');
        if (total.functions.pct < thresholds.functions) warnings.push('functions');
        if (total.lines.pct < thresholds.lines) warnings.push('lines');

        if (warnings.length > 0) {
          this.log(`⚠️  Coverage below threshold: ${warnings.join(', ')}`, 'yellow');
        } else {
          this.log('✅ All coverage thresholds met', 'green');
        }
      } catch (error) {
        this.log('⚠️  Could not parse coverage summary', 'yellow');
      }
    }

    // Save results to JSON
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: duration,
      suites: this.results.suites,
      summary: {
        total: total,
        passed: passed,
        failed: total - passed,
        success: passed === total
      }
    };

    const reportPath = path.join(TEST_CONFIG.outputDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');

    return passed === total;
  }

  async checkEnvironment() {
    this.log('🔍 Checking test environment...', 'blue');

    // Check if npm is available
    try {
      await new Promise((resolve, reject) => {
        const child = spawn('npm', ['--version'], { stdio: 'pipe' });
        child.on('close', (code) => code === 0 ? resolve() : reject());
        child.on('error', reject);
      });
      this.log('✅ npm is available', 'green');
    } catch (error) {
      this.log('❌ npm is not available', 'red');
      process.exit(1);
    }

    // Check if jest is installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasJest = packageJson.dependencies?.['@testing-library/jest-dom'] ||
                   packageJson.devDependencies?.['@testing-library/jest-dom'];

    if (hasJest) {
      this.log('✅ Testing libraries are installed', 'green');
    } else {
      this.log('⚠️  Testing libraries may not be installed', 'yellow');
    }

    // Check for test files
    const hasTestFiles = fs.existsSync('src') &&
      fs.readdirSync('src', { recursive: true })
        .some(file => file.endsWith('.test.js'));

    if (hasTestFiles) {
      this.log('✅ Test files found', 'green');
    } else {
      this.log('⚠️  No test files found', 'yellow');
    }

    this.log('');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  // Parse command line arguments
  const options = {
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
    watch: args.includes('--watch'),
    coverage: args.includes('--coverage'),
    ci: args.includes('--ci') || process.env.CI
  };

  try {
    await runner.checkEnvironment();

    if (options.suite) {
      // Run specific suite
      if (TEST_CONFIG.suites[options.suite]) {
        await runner.runTestSuite(options.suite, TEST_CONFIG.suites[options.suite]);
      } else {
        runner.log(`❌ Unknown test suite: ${options.suite}`, 'red');
        runner.log(`Available suites: ${Object.keys(TEST_CONFIG.suites).join(', ')}`, 'cyan');
        process.exit(1);
      }
    } else {
      // Run all suites
      await runner.runAllSuites();
    }

    const success = await runner.generateReport();
    process.exit(success ? 0 : 1);

  } catch (error) {
    runner.log(`💥 Test runner failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Help text
function showHelp() {
  console.log(`
🧪 React Ticketing System Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --suite=<name>    Run specific test suite (unit, integration, hooks, api)
  --watch          Run tests in watch mode
  --coverage       Generate coverage report
  --ci             CI mode (generates JUnit reports)
  --help           Show this help

Examples:
  node scripts/test-runner.js                    # Run all tests
  node scripts/test-runner.js --suite=unit       # Run only unit tests
  node scripts/test-runner.js --coverage         # Run with coverage
  node scripts/test-runner.js --ci               # CI mode

Test Suites:
${Object.entries(TEST_CONFIG.suites).map(([name, config]) =>
  `  ${name.padEnd(12)} ${config.description}`
).join('\n')}
`);
}

// Run if called directly
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
  } else {
    main();
  }
}

module.exports = { TestRunner, TEST_CONFIG };