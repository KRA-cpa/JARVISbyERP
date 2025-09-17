# JarvisByERP Production Requirements

**Date**: September 17, 2025
**Version**: 1.0
**Status**: Current Production Stack Documentation

## Runtime Environment Requirements

### **Node.js Runtime**
- **Current Version**: Node.js v22.14.0
- **Minimum Required**: Node.js v18.0.0 or higher
- **Package Manager**: npm v10.9.2
- **Deployment Platform**: Vercel (React SPA deployment)

### **Browser Support**
**Production Targets:**
- Chrome/Edge: >0.2% market share
- Firefox: >0.2% market share
- Safari: >0.2% market share
- **Excluded**: Opera Mini (not dead, not op_mini all)

**Development Targets:**
- Last 1 Chrome version
- Last 1 Firefox version
- Last 1 Safari version

## Core Dependencies (Production)

### **React Framework**
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.9.1",
  "react-scripts": "5.0.1"
}
```

### **Authentication & Backend**
```json
{
  "firebase": "^11.9.0",
  "@firebase/analytics": "^0.10.16"
}
```

### **UI Framework & Styling**
```json
{
  "tailwindcss": "^3.4.17",
  "@mui/material": "^7.1.1",
  "@mui/icons-material": "^7.1.1",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0"
}
```

### **Utilities & Performance**
```json
{
  "date-fns": "^4.1.0",
  "web-vitals": "^2.1.4"
}
```

### **Testing Framework**
```json
{
  "@testing-library/dom": "^10.4.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^13.5.0"
}
```

## Development Dependencies

### **CSS Processing**
```json
{
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.4"
}
```

## CSS Framework Configuration

### **Tailwind CSS Setup**
- **Version**: 3.4.17
- **Configuration**: Custom theme with primary color palette (blue spectrum)
- **Content Sources**: `./src/**/*.{js,jsx,ts,tsx}`, `./public/index.html`
- **Custom Animations**: `spin-slow`, `pulse-slow`
- **Font Stack**: System fonts prioritizing Apple/Windows native fonts

### **Custom Theme Extensions**
- **Primary Colors**: Blue palette (50-900 shades)
- **Font Family**: System font stack for optimal performance
- **Animations**: Slow-motion variants for subtle UI feedback

## Build Configuration

### **React Scripts Configuration**
- **Build Tool**: Create React App v5.0.1
- **Bundler**: Webpack (included in react-scripts)
- **Babel**: Included in react-scripts
- **ESLint**: react-app, react-app/jest configurations

### **Build Commands**
```bash
npm start      # Development server (localhost:3000)
npm run build  # Production build (optimized bundle)
npm test       # Test runner
npm run eject  # Eject from CRA (not recommended)
```

## External Service Dependencies

### **Google Services (Proof of Concept Architecture)**
- **Firebase Authentication**: Google Sign-In only
- **Google Sheets Database**: ⚠️ **PROOF OF CONCEPT** - 15+ sheet tabs as database tables
- **Google Apps Script API**: ⚠️ **PROOF OF CONCEPT** - RESTful web app providing backend API
- **Database Tables**: companies, roles, tickets, ticket_types, users, workflow_steps, custom_fields, dropdown_lists, dropdown_options, ticket_history, ticket_action_logs, admin_action_logs, sequence_counters

### **⚠️ PROOF OF CONCEPT DATABASE NOTICE**
**Current Implementation**: Google Sheets + Apps Script Web App
- **Purpose**: Serverless proof of concept for workflow orchestration system
- **Production Suitability**: Not recommended for production scale
- **Migration Path**: Future migration to traditional database (PostgreSQL, MySQL, etc.) planned
- **Data Structure**: 15+ Google Sheets tabs representing normalized database tables
- **API Layer**: Google Apps Script providing RESTful endpoints with JSON responses

### **Deployment Platform**
- **Primary**: Vercel (static React deployment)
- **CDN**: Vercel Edge Network
- **Environment Variables**: Configured via Vercel dashboard

## Architecture Requirements

### **SPA Architecture**
- **Type**: Single Page Application (React)
- **Routing**: Client-side routing with React Router v7
- **State Management**: React Context + Local State
- **API Communication**: Fetch API to Google Apps Script

### **Security Requirements**
- **Authentication**: Firebase Auth (Google OAuth only)
- **API Security**: Apps Script web app with authentication
- **Environment Variables**: Sensitive config via `.env` files
- **CSP**: Content Security Policy via Vercel headers

## Performance Requirements

### **Bundle Optimization**
- **Code Splitting**: React.lazy() for route-based splitting
- **Tree Shaking**: Automatic via Webpack
- **Image Optimization**: Vercel automatic optimization
- **Caching**: Browser caching + Vercel CDN

### **Runtime Performance**
- **Web Vitals**: Monitored via web-vitals package
- **Loading States**: Implemented across all async operations
- **Error Boundaries**: React error boundary components
- **Mobile Optimization**: Responsive design with Tailwind breakpoints

## Update Requirements Clause

### **🔄 DESIGN REQUIREMENT UPDATES**

**When design requirements change and necessitate different modules:**

1. **Assessment Phase**:
   - Review new design requirements against current stack
   - Identify gaps in current dependencies
   - Evaluate compatibility with existing architecture

2. **Documentation Updates Required**:
   - Update this `PRODUCTION_REQUIREMENTS.md` with new dependencies
   - Update `package.json` with new modules and versions
   - Update `DEVELOPMENT_PLAN.md` with architectural changes
   - Update `DEPENDENCY_MAPPING.md` if component relationships change

3. **Implementation Process**:
   - Follow superthink audit methodology for dependency changes
   - Conduct dependency impact analysis before implementation
   - Update all relevant documentation before code changes
   - Verify build and deployment compatibility

4. **Validation Requirements**:
   - Test production build with new dependencies
   - Verify browser compatibility remains intact
   - Confirm Vercel deployment compatibility
   - Update version numbers and compatibility matrices

**🚨 CRITICAL RULE**: No production dependency changes without updating this document first.

## Version Compatibility Matrix

| Component | Current Version | Minimum Required | Last Updated |
|-----------|----------------|------------------|--------------|
| Node.js | v22.14.0 | v18.0.0 | Sept 2025 |
| npm | v10.9.2 | v8.0.0 | Sept 2025 |
| React | v19.1.0 | v18.0.0 | Sept 2025 |
| Tailwind CSS | v3.4.17 | v3.0.0 | Sept 2025 |
| Firebase | v11.9.0 | v10.0.0 | Sept 2025 |
| Material-UI | v7.1.1 | v6.0.0 | Sept 2025 |

---

**Last Updated**: September 17, 2025
**Next Review**: Before any major feature development or deployment
**Maintainer**: Development Team
**Documentation Status**: ✅ Current and Complete