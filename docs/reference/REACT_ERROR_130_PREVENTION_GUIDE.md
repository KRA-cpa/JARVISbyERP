# React Error #130 Prevention Guide

**Comprehensive Best Practices to Avoid React Minified Error #130**

---

## 🚨 WHAT IS REACT ERROR #130?

React error #130 occurs when your application tries to access **undefined components, hooks, or references** at runtime. The error message typically looks like:

```
Error: Minified React error #130; visit https://react.dev/errors/130?args[]=undefined&args[]= for the full message
```

This is a **runtime error**, not a compilation error, which makes it particularly tricky to debug.

---

## 🔍 ROOT CAUSES & EXAMPLES

### **1. Undefined Component References**

❌ **WRONG - Causes Error #130:**
```javascript
// Trying to use a component that doesn't exist
<Icons.NonExistentIcon size={16} />
<SomeUndefinedComponent />
```

✅ **CORRECT:**
```javascript
// Always verify the component exists first
<Icons.Edit size={16} />  // Edit icon exists in Icons.js
```

### **2. Incorrect Hook Destructuring**

❌ **WRONG - Causes Error #130:**
```javascript
// Destructuring properties that don't exist in the hook
const { showToast } = useToast();  // showToast doesn't exist
const { nonExistentMethod } = useAPI();
```

✅ **CORRECT:**
```javascript
// Use the actual exports from the hook
const { success, error, warning, ToastContainer } = useToast();
const { data, loading, error: apiError } = useAPI();
```

### **3. Missing Route Definitions**

❌ **WRONG - Causes Error #130:**
```javascript
// Navigating to routes that don't exist
navigate('/admin/undefined-page');
navigate('/admin/custom-fields/123/edit');  // No route defined
```

✅ **CORRECT:**
```javascript
// Ensure routes exist in App.js first
<Route path="/admin/custom-fields/:id/edit" element={<EditPage />} />

// Then navigate safely
navigate('/admin/custom-fields/123/edit');
```

### **4. Missing or Incorrect Imports**

❌ **WRONG - Causes Error #130:**
```javascript
// Importing things that don't exist
import { nonExistentHook } from '../hooks/useAPI';
import { UndefinedComponent } from '../components/Missing';
```

✅ **CORRECT:**
```javascript
// Import only what actually exists
import { useCustomFields, useTicketTypes } from '../hooks/useAPI';
import { AdminCustomFieldList } from '../components/admin/AdminCustomFieldList';
```

### **5. Conditional Rendering Issues**

❌ **WRONG - Causes Error #130:**
```javascript
// Using undefined variables in conditions
{someUndefinedVariable && <Component />}
{data.nonExistentProperty?.map(item => <Item key={item.id} />)}
```

✅ **CORRECT:**
```javascript
// Always check for existence first
{data && data.items && data.items.map(item => <Item key={item.id} />)}
{isLoggedIn && user && <UserProfile user={user} />}
```

---

## 🛡️ PREVENTION STRATEGIES

### **A. Development-Time Prevention**

#### **1. Strict TypeScript/JSDoc Usage**
```javascript
/**
 * @typedef {Object} ToastHook
 * @property {function} success - Show success toast
 * @property {function} error - Show error toast
 * @property {function} warning - Show warning toast
 * @property {React.Component} ToastContainer - Toast container component
 */

/** @returns {ToastHook} */
export const useToast = () => {
  return {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    ToastContainer
  };
};
```

#### **2. Icon Inventory Management**
```javascript
// Always maintain a complete icon inventory
const AVAILABLE_ICONS = [
  'Edit', 'Delete', 'Plus', 'Warning', 'Success', 'Info',
  'Calendar', 'DateRange', 'Currency', 'Attachment',
  'ChevronUp', 'ChevronDown', 'Eye', 'EyeOff'
];

// Use this for validation during development
const validateIconExists = (iconName) => {
  if (!AVAILABLE_ICONS.includes(iconName)) {
    console.error(`Icon "${iconName}" does not exist. Available icons:`, AVAILABLE_ICONS);
  }
};
```

#### **3. Hook Export Validation**
```javascript
// In your hooks file, always document exports clearly
export const useAPI = () => {
  // ... hook logic

  return {
    // Document each export
    data,           // ✅ Available
    loading,        // ✅ Available
    error,          // ✅ Available
    refetch         // ✅ Available
    // showToast,   // ❌ NOT available - would cause error #130
  };
};
```

### **B. Build-Time Prevention**

#### **1. Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run build && npm run lint"
    }
  }
}
```

#### **2. ESLint Rules**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "no-undef": "error",
    "react/jsx-no-undef": "error",
    "import/no-unresolved": "error"
  }
};
```

### **C. Runtime Prevention**

#### **1. Defensive Programming**
```javascript
// Always check for existence before using
const MyComponent = () => {
  const { success, error, ToastContainer } = useToast() || {};

  const handleSave = () => {
    if (typeof success === 'function') {
      success('Saved successfully');
    } else {
      console.error('Toast success method not available');
    }
  };

  return (
    <div>
      {/* Component content */}
      {ToastContainer && <ToastContainer />}
    </div>
  );
};
```

#### **2. Safe Navigation**
```javascript
// Use safe navigation patterns
const handleNavigation = (path) => {
  // Validate path exists in your routing configuration
  const validPaths = [
    '/admin/ticket-types/create',
    '/admin/custom-fields/create',
    '/admin/custom-fields/:id/edit'
  ];

  if (validPaths.some(validPath => path.match(validPath.replace(':id', '\\d+')))) {
    navigate(path);
  } else {
    console.error(`Invalid navigation path: ${path}`);
    navigate('/admin'); // Safe fallback
  }
};
```

---

## 🔧 DEBUGGING METHODOLOGY

### **Step 1: Enable Development Mode**
```javascript
// Set NODE_ENV=development for detailed error messages
if (process.env.NODE_ENV === 'development') {
  // React will show detailed error messages instead of minified errors
}
```

### **Step 2: Browser DevTools Investigation**
```javascript
// Add debugging to suspect areas
console.log('Hook return value:', useToast());
console.log('Icons object:', Icons);
console.log('Available routes:', routeConfig);
```

### **Step 3: Systematic Component Testing**
```javascript
// Test components in isolation
const TestComponent = () => {
  try {
    const hookResult = useToast();
    console.log('Hook methods:', Object.keys(hookResult));

    return (
      <div>
        <Icons.Edit size={16} />  {/* Test icon rendering */}
        {hookResult.ToastContainer && <hookResult.ToastContainer />}
      </div>
    );
  } catch (error) {
    console.error('Component error:', error);
    return <div>Error in component</div>;
  }
};
```

### **Step 4: Compilation Verification**
```bash
# Always test compilation
npm run build

# Check for any warnings or errors
npm run lint

# Test in production mode
npm run start
```

---

## 📋 PREVENTION CHECKLIST

### **Before Writing Code:**
- [ ] Verify all imported components exist
- [ ] Check hook exports match your usage
- [ ] Confirm icon names are available
- [ ] Validate route definitions exist

### **During Development:**
- [ ] Use TypeScript or JSDoc for type safety
- [ ] Test components in isolation
- [ ] Run compilation checks frequently
- [ ] Use defensive programming patterns

### **Before Committing:**
- [ ] Run `npm run build` successfully
- [ ] Test navigation flows
- [ ] Verify all hooks work correctly
- [ ] Check browser console for errors

### **During Code Review:**
- [ ] Verify all new imports exist
- [ ] Check for undefined component usage
- [ ] Validate hook destructuring patterns
- [ ] Confirm route additions in App.js

---

## 🚀 AUTOMATED PREVENTION TOOLS

### **1. Custom ESLint Plugin**
```javascript
// Create custom rule to check icon usage
const checkIconUsage = {
  meta: {
    type: "problem",
    docs: { description: "Check if icon exists" }
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.object && node.name.object.name === 'Icons') {
          const iconName = node.name.property.name;
          if (!AVAILABLE_ICONS.includes(iconName)) {
            context.report({
              node,
              message: `Icon "${iconName}" does not exist`
            });
          }
        }
      }
    };
  }
};
```

### **2. Hook Validation Utility**
```javascript
// Utility to validate hook exports
export const validateHookExports = (hookName, expectedExports, actualExports) => {
  const missing = expectedExports.filter(exp => !(exp in actualExports));
  if (missing.length > 0) {
    console.error(`Hook ${hookName} missing exports:`, missing);
    return false;
  }
  return true;
};

// Usage:
const toastHook = useToast();
validateHookExports('useToast', ['success', 'error', 'warning', 'ToastContainer'], toastHook);
```

### **3. Route Validation**
```javascript
// Validate routes exist before navigation
export const safeNavigate = (navigate, path) => {
  // Get all defined routes from your router configuration
  const definedRoutes = getDefinedRoutes(); // Implement this based on your setup

  const routeExists = definedRoutes.some(route =>
    path.match(route.replace(/:\w+/g, '[^/]+'))
  );

  if (routeExists) {
    navigate(path);
  } else {
    console.error(`Route ${path} is not defined`);
    navigate('/admin'); // Safe fallback
  }
};
```

---

## 📚 QUICK REFERENCE

### **Common Error Patterns:**
1. `<Icons.UndefinedIcon />` → Check Icons.js
2. `const { showToast } = useToast()` → Check hook exports
3. `navigate('/undefined-route')` → Check App.js routes
4. `data.property.map()` → Add null checks

### **Quick Fixes:**
1. **Icon Error** → Add to Icons.js or use existing icon
2. **Hook Error** → Fix destructuring to match exports
3. **Navigation Error** → Add route to App.js
4. **Import Error** → Verify import path and export

### **Emergency Debugging:**
```javascript
// Add to suspect component for immediate debugging
console.log('Available methods:', Object.keys(useToast()));
console.log('Icons object:', Object.keys(Icons));
console.log('Current props:', props);
```

---

## 🎯 CONCLUSION

React error #130 is **100% preventable** with proper development practices:

1. **Verify Before Use** - Always check components/hooks exist
2. **Defensive Programming** - Add null checks and error boundaries
3. **Systematic Testing** - Test compilation and runtime regularly
4. **Automated Validation** - Use ESLint and custom tools

**Following these practices ensures you'll never encounter React error #130 again!** 🚀

---

*Last Updated: September 21, 2025*
*For JarvisByERP Ticketing & Workflow Orchestration System*