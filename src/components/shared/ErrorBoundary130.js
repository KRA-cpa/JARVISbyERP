import React from 'react';
import Icons from './Icons';

/**
 * Enhanced Error Boundary specifically for catching React Error #130
 *
 * React Error #130 occurs at runtime when components try to access undefined references.
 * Since these are not caught during compilation, we need runtime detection.
 */
class ErrorBoundary130 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isError130: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      isError130: error.message?.includes('Minified React error #130') ||
                  error.message?.includes('Cannot read properties of undefined') ||
                  error.message?.includes('undefined is not a function')
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    const isError130 = error.message?.includes('Minified React error #130') ||
                       error.message?.includes('Cannot read properties of undefined') ||
                       error.message?.includes('undefined is not a function');

    this.setState({
      error,
      errorInfo,
      isError130
    });

    // Enhanced logging for Error #130
    if (isError130) {
      console.group('🚨 REACT ERROR #130 DETECTED');
      console.error('Error message:', error.message);
      console.error('Component stack:', errorInfo.componentStack);
      console.error('Error object:', error);

      // Try to identify the problematic component
      const componentMatch = errorInfo.componentStack.match(/in (\w+)/);
      if (componentMatch) {
        console.error('Likely problematic component:', componentMatch[1]);
      }

      // Common causes
      console.group('🔍 Common Causes:');
      console.error('1. Undefined icon reference: <Icons.NonExistentIcon />');
      console.error('2. Incorrect hook destructuring: const { nonExistentMethod } = useHook()');
      console.error('3. Dynamic component rendering: <someVariable.component />');
      console.error('4. Missing component imports');
      console.groupEnd();

      // Debugging suggestions
      console.group('🛠️ Debugging Steps:');
      console.error('1. Check Icons.js for missing icon definitions');
      console.error('2. Verify hook exports match destructuring');
      console.error('3. Add null checks for dynamic components');
      console.error('4. Use React DevTools to inspect component tree');
      console.groupEnd();

      console.groupEnd();

      // Send error to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        this.reportError(error, errorInfo);
      }
    }
  }

  reportError = (error, errorInfo) => {
    // In a real app, you'd send this to your error monitoring service
    // For now, we'll just log it
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      isError130: this.state.isError130
    };

    console.error('📊 Error Report:', errorReport);

    // You could send this to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom error endpoint
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isError130: false
    });
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/admin';
    }
  };

  render() {
    if (this.state.hasError) {
      const { isError130, error } = this.state;

      if (isError130) {
        // Specific UI for React Error #130
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="flex items-center justify-center">
                  <div className="flex-shrink-0">
                    <Icons.Warning size={48} className="text-red-500" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Component Loading Error
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    A component failed to load properly (React Error #130). This usually happens when a component tries to access something that doesn't exist.
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Development Info:
                    </h3>
                    <p className="text-xs text-red-700 font-mono break-all">
                      {error?.message || 'Unknown error'}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Icons.Refresh size={16} className="mr-2" />
                    Try Again
                  </button>

                  <button
                    onClick={this.handleGoBack}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Icons.ArrowLeft size={16} className="mr-2" />
                    Go Back
                  </button>

                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Icons.Home size={16} className="mr-2" />
                    Return to Admin
                  </button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      🔧 Quick Fixes:
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Check Icons.js for missing icon definitions</li>
                      <li>• Verify all hook destructuring patterns</li>
                      <li>• Add null checks for dynamic components</li>
                      <li>• Ensure all imports exist</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Generic error UI for other errors
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <Icons.Error size={48} className="text-red-500" />
                </div>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for detecting Error #130 at runtime
export const useError130Detection = () => {
  React.useEffect(() => {
    const handleError = (event) => {
      if (event.error?.message?.includes('Minified React error #130')) {
        console.error('🚨 React Error #130 detected globally!');
        console.error('Error:', event.error);
        console.error('URL:', window.location.href);

        // You could trigger additional error reporting here
      }
    };

    const handleUnhandledRejection = (event) => {
      if (event.reason?.message?.includes('Minified React error #130')) {
        console.error('🚨 React Error #130 in Promise rejection!');
        console.error('Reason:', event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};

// Component validation helper
export const validateComponentReferences = (componentName, references) => {
  if (process.env.NODE_ENV !== 'development') return true;

  const errors = [];

  // Validate Icons
  if (references.icons) {
    references.icons.forEach(iconName => {
      try {
        const IconComponent = Icons[iconName];
        if (!IconComponent || typeof IconComponent !== 'function') {
          errors.push(`Missing icon: ${iconName}`);
        }
      } catch (err) {
        errors.push(`Error accessing icon ${iconName}: ${err.message}`);
      }
    });
  }

  // Validate Hooks
  if (references.hooks) {
    references.hooks.forEach(({ name, expectedMethods, hookResult }) => {
      if (!hookResult) {
        errors.push(`Hook ${name} returned undefined`);
        return;
      }

      expectedMethods.forEach(method => {
        if (!(method in hookResult) || typeof hookResult[method] !== 'function') {
          errors.push(`Hook ${name} missing method: ${method}`);
        }
      });
    });
  }

  if (errors.length > 0) {
    console.group(`🚨 ${componentName} validation errors:`);
    errors.forEach(error => console.error(`❌ ${error}`));
    console.groupEnd();
    return false;
  }

  console.log(`✅ ${componentName} validation passed`);
  return true;
};

export default ErrorBoundary130;