# RESOLUTION CHECKLIST - MANDATORY REFERENCE

**Document Type:** 🚨 **MANDATORY REFERENCE FOR ALL ERROR RESOLUTION**
**Version:** 1.0
**Date:** September 25, 2025
**Status:** ENFORCED - Must be consulted before any error resolution

---

## 🚨 **FUNDAMENTAL RESOLUTION RULE - ALWAYS APPLY FIRST**

### **THE BASIC RULE - MANDATORY FOR ALL ERROR RESOLUTION:**

**1. SIMPLEST FIRST RESOLUTION STRATEGY:**
- ✅ **1st Resolution Attempt**: ALWAYS use the simplest possible solution
- ✅ **Complexity Gate**: Only add complexity if issue is CLEARLY APPARENT in simple approach
- ✅ **Pattern Priority**: Use proven working patterns before inventing new approaches

**2. SYSTEMATIC DOMAIN CHECKING:**
Check each technical domain independently with specific rules:
- ✅ **Frontend Domain**: 8 specific checks required
- ✅ **API Domain**: 7 specific checks required
- ✅ **AppScript Domain**: 9 specific checks required
- ✅ **Google Sheet Schema Domain**: 6 specific checks required

**3. ENFORCEMENT**: All resolution steps must follow this fundamental principle

---

## 📋 **MANDATORY RESOLUTION CHECKLIST**

### **STEP 1: IMMEDIATE ASSESSMENT (Required Before Any Action)**

**Basic Rule Application:**
- [ ] **SIMPLEST APPROACH IDENTIFIED**: What is the most basic solution possible?
- [ ] **WORKING PATTERN FOUND**: Is there a similar issue that was resolved successfully?
- [ ] **DOMAIN ISOLATED**: Which specific domain(s) have the issue?

### **STEP 2: COMPREHENSIVE DOMAIN-SPECIFIC ANALYSIS**

#### **🎨 FRONTEND DOMAIN CHECK (8 Required Checks)**

**Component Architecture:**
- [ ] **Pattern Consistency**: Does component follow same structure as similar working components?
- [ ] **Import Dependencies**: Are all imports following 7-layer dependency hierarchy?
- [ ] **Hook Usage**: Are React hooks (useState, useEffect, useCallback) using same patterns as successful components?

**Data Flow & State:**
- [ ] **State Management**: Is component state structure consistent with working implementations?
- [ ] **Props Handling**: Are props being processed same way as similar successful components?
- [ ] **Event Handlers**: Are event handling patterns copied from working components?

**Error & Loading States:**
- [ ] **Error Boundaries**: Does component have same error handling as working components?
- [ ] **Loading States**: Are loading patterns consistent with successful implementations?

**Specific Frontend Tests:**
- Can component render in isolation?
- Do props match expected structure?
- Are error states handled gracefully?

#### **🔌 API DOMAIN CHECK (7 Required Checks)**

**Endpoint Structure:**
- [ ] **URL Pattern**: Does endpoint follow same URL structure as working endpoints?
- [ ] **HTTP Method**: Is HTTP method (GET/POST) consistent with similar successful endpoints?
- [ ] **Payload Structure**: Does request payload match format of working endpoints?

**Data Processing:**
- [ ] **Payload Handling**: Is `data.payload || { prop1: data.prop1 }` pattern used like successful endpoints?
- [ ] **Response Format**: Does response structure match working API responses?
- [ ] **Error Handling**: Are try-catch patterns identical to successful endpoints?

**Integration Testing:**
- [ ] **Direct API Test**: Can endpoint be called directly with simple payload?

**Specific API Tests:**
- Does endpoint respond to ping/health check?
- Can simple test payload be processed successfully?
- Are error responses formatted consistently?

#### **⚙️ APPSCRIPT DOMAIN CHECK (9 Required Checks)**

**Function Structure:**
- [ ] **Function Pattern**: Does function follow same structure as working AppScript functions?
- [ ] **Parameter Processing**: Are parameters handled same way as successful functions?
- [ ] **Business Logic Flow**: Is logic flow consistent with working operations?

**Data Operations:**
- [ ] **Sheet Access**: Are Google Sheets accessed same way as working functions?
- [ ] **Data Writing**: Is data written to sheets using same pattern as successful operations?
- [ ] **Data Reading**: Are sheet reads following same pattern as working functions?

**Error & Logging:**
- [ ] **Error Logging**: Are Logger.log patterns consistent with working functions?
- [ ] **Success Validation**: Is success/failure validation same as working operations?
- [ ] **Version Consistency**: Are version references (pingAPI, headers) synchronized?

**Specific AppScript Tests:**
- Can function execute independently in Apps Script editor?
- Does function write test data to sheets successfully?
- Are all Logger.log statements appearing in execution log?

#### **📊 GOOGLE SHEET SCHEMA DOMAIN CHECK (6 Required Checks)**

**Schema Structure:**
- [ ] **Column Count**: Does sheet have correct number of columns for data structure?
- [ ] **Column Names**: Do column headers match model definitions exactly?
- [ ] **Data Types**: Are column data types consistent with API expectations?

**Data Integrity:**
- [ ] **Schema Migration**: Have recent schema changes been applied correctly?
- [ ] **Sample Data**: Does existing data match expected column structure?
- [ ] **Foreign Keys**: Are relationship columns (IDs) consistent across related sheets?

**Specific Schema Tests:**
- Can sample data be written directly to sheet?
- Do column headers match models.js definitions?
- Are all required columns present?

### **STEP 3: DOMAIN-SPECIFIC SIMPLE SOLUTIONS**

#### **Frontend Simple Solutions:**
- [ ] **Copy Working Component**: Found similar working component to copy pattern from
- [ ] **Use Established Hooks**: Using same hooks pattern as successful components
- [ ] **Match Prop Structure**: Props match structure of working similar components

#### **API Simple Solutions:**
- [ ] **Copy Working Endpoint**: Found similar working endpoint to copy pattern from
- [ ] **Use Standard Pattern**: Using `data.payload || { prop: data.prop }` pattern
- [ ] **Match Response Format**: Response structure matches working endpoints

#### **AppScript Simple Solutions:**
- [ ] **Copy Working Function**: Found similar working function to copy pattern from
- [ ] **Use Standard Flow**: Using same business logic flow as successful operations
- [ ] **Match Error Handling**: Error handling copied from working functions

#### **Schema Simple Solutions:**
- [ ] **Copy Working Schema**: Found similar working sheet structure to copy from
- [ ] **Use Standard Columns**: Column structure matches working sheet definitions
- [ ] **Match Data Types**: Data types consistent with working implementations

### **STEP 4: COMPLEXITY GATE (Only If Simple Domain-Specific Approach Failed)**

**Domain-Specific Complexity Justification:**
- [ ] **Frontend Complexity**: Simple component patterns clearly inadequate for this specific use case
- [ ] **API Complexity**: Standard payload pattern cannot handle this specific data structure
- [ ] **AppScript Complexity**: Standard business logic insufficient for this specific operation
- [ ] **Schema Complexity**: Standard column structure cannot support this specific data requirement

### **STEP 5: RESOLUTION VERIFICATION WITH DOMAIN VALIDATION**

**Domain-Specific Success Validation:**
- [ ] **Frontend Success**: Component renders and functions correctly in all states
- [ ] **API Success**: Endpoint processes requests and returns correct responses
- [ ] **AppScript Success**: Function executes successfully and logs confirm operations
- [ ] **Schema Success**: Data is written and read correctly from sheet structure

---

## 🎯 **DOMAIN-SPECIFIC WORKING PATTERNS (Reference Library)**

### **✅ Frontend Working Patterns:**
- **AdminCompanyManager.js**: Company CRUD with form validation
- **AdminRoleManager.js**: Role management with permission handling
- **UserContext.js**: Authentication state management
- **useAPI.js**: Data fetching hooks with error handling

### **✅ API Working Patterns:**
- **Company Creation**: `data.payload || { name: data.name, code: data.code }`
- **Role Management**: Simple payload with comprehensive fallbacks
- **User Operations**: Standard authentication pattern

### **✅ AppScript Working Patterns:**
- **createCompany()**: Standard business object creation
- **createRole()**: Standard entity creation with validation
- **doPost()**: Standard request routing and processing

### **✅ Schema Working Patterns:**
- **companies**: 10 columns with audit fields
- **roles**: 12 columns with company assignment
- **users**: Standard user table structure

---

## 🚨 **ENFORCEMENT WITH DOMAIN SPECIFICITY**

### **MANDATORY DOMAIN CHECKS:**
- **ALL 8 Frontend checks** must be completed for frontend issues
- **ALL 7 API checks** must be completed for API issues
- **ALL 9 AppScript checks** must be completed for AppScript issues
- **ALL 6 Schema checks** must be completed for schema issues

### **CROSS-DOMAIN ISSUES:**
If issue spans multiple domains, ALL relevant domain checks must be completed independently

### **DOCUMENTATION REQUIREMENT:**
Must document which working pattern from each domain was used as reference

---

## ✅ **QUICK DOMAIN REFERENCE**

**Frontend Issues:** Check component patterns, state management, props, error handling
**API Issues:** Check endpoint structure, payload handling, response format, error patterns
**AppScript Issues:** Check function patterns, sheet operations, logging, business logic
**Schema Issues:** Check column structure, data types, relationships, migration status

**Remember:** Each domain has specific successful patterns to copy from. Always start with the simplest working pattern from the relevant domain.

---

**Document Status:** 🚨 MANDATORY REFERENCE
**Last Updated:** September 25, 2025
**Enforcement:** REQUIRED for all development error resolution