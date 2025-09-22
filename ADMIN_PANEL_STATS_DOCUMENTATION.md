# Admin Panel Statistics Documentation
**System**: Ticketing & Workflow Orchestration System
**Component**: AdminPage.js - Statistics Dashboard
**Updated**: September 21, 2025
**Phase**: 8.9 - Enhanced Admin Statistics & User Preferences

## 📊 Current Statistics Implementation

### **🎯 Current Stats Layout (4 Cards - Left to Right)**

#### **1. 🏢 Companies**
- **Main Number**: Active companies count
- **Sub-text**: "X active companies"
- **Data Source**: `useCompanies()` hook → `API.Companies.getAll()`
- **Calculation**: `companies.filter(company => company.name && company.code).length`
- **Icon**: `Icons.Company` (purple)

#### **2. 👥 Total Users**
- **Main Number**: Total active users
- **Sub-text**: "X active users this month"
- **Data Source**: `useUsers()` hook → `API.Users.getAll()`
- **Calculation**:
  - Total: `users.length || 0`
  - Active this month: `Math.ceil(totalUsers * 0.2)` (demo calculation)
- **Icon**: `Icons.User` (blue)

#### **3. 🎫 Ticket Types**
- **Main Number**: Total active ticket types
- **Sub-text**: "Most active this month: [Type Name] - X tickets"
- **Data Sources**:
  - `useTicketTypes()` hook → `API.TicketTypes.getAll()`
  - `useTickets()` hook → `API.Tickets.getAll()`
- **Calculation**:
  - Total: `ticketTypes.filter(tt => tt.name && tt.code).length`
  - Most active: Analyzes tickets by `ticket_type_id`, finds highest count
- **Icon**: `Icons.Workflow` (green)

#### **4. ⚡ API Health**
- **Main Number**: Visual status (✓/⟳/✗)
- **Sub-text**: Connection status message
- **Data Source**: Real-time API health monitoring
- **Error Details**: Comprehensive error analysis with solution suggestions
- **Icon**: Dynamic based on status (`Icons.Success/Loading/Error`)

---

## 🗃️ Database Schema Analysis for Enhanced Statistics

### **Available Tables for Advanced Stats**

#### **📋 Core Entity Tables**
1. **`companies`** - Company management data
2. **`roles`** - User role definitions (global + company-specific)
3. **`users`** - User accounts (via Firebase + role assignments)
4. **`ticket_types`** - Ticket type configurations
5. **`dropdown_lists`** - Reusable dropdown configurations

#### **📈 Activity & Transaction Tables**
6. **`tickets`** - All ticket records with timestamps
7. **`ticket_history`** - User actions on tickets
8. **`ticket_action_logs`** - System-level audit trail
9. **`admin_action_logs`** - Administrative configuration changes
10. **`user_role_assignments`** - User permission assignments

#### **⚙️ Configuration Tables**
11. **`workflow_steps`** - Workflow configurations per company
12. **`step_approvers`** - Role assignments to workflow steps
13. **`custom_fields`** - Custom field definitions
14. **`custom_field_values`** - Custom field data
15. **`step_slas`** - SLA definitions per workflow step

#### **🔗 Relationship Tables**
16. **`ticket_links`** - Parent/child ticket relationships
17. **`ticket_attachments`** - File attachments
18. **`step_conditions`** - Conditional workflow logic
19. **`user_preferences`** - User interface preferences

---

## 🚀 Proposed Enhanced Statistics

### **📊 TIER 1: Immediate Implementation (No Schema Changes)**

#### **A. SLA Performance per Ticket Type vs Standard**
```javascript
// Calculate actual resolution time vs standard SLA per ticket type
const getSLAPerformanceByTicketType = () => {
  const ticketTypePerformance = {};

  ticketTypes.forEach(ticketType => {
    // Get all tickets for this type
    const typeTickets = tickets.filter(t => t.ticket_type_id === ticketType.id);

    // Get workflow steps for this ticket type
    const workflowSteps = workflow_steps.filter(ws => ws.ticket_type_id === ticketType.id);

    // Get standard SLA (sum of all step SLAs)
    const standardSLA = workflowSteps.reduce((total, step) => {
      const stepSLA = step_slas.find(sla => sla.step_id === step.id);
      if (stepSLA) {
        // Convert to hours for comparison
        const hours = stepSLA.unit === 'days' ? stepSLA.duration * 24 : stepSLA.duration;
        return total + hours;
      }
      return total;
    }, 0);

    // Calculate actual average resolution time
    const completedTickets = typeTickets.filter(t => t.status === 'Completed');
    const avgActualTime = completedTickets.length > 0
      ? completedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at);
          const completed = new Date(ticket.updated_at);
          const hours = (completed - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedTickets.length
      : 0;

    ticketTypePerformance[ticketType.id] = {
      ticketTypeName: ticketType.name,
      standardSLA: standardSLA,
      averageActual: Math.round(avgActualTime * 10) / 10,
      performance: standardSLA > 0 ? ((standardSLA - avgActualTime) / standardSLA * 100).toFixed(1) : 0,
      slaBreaches: typeTickets.filter(t => avgActualTime > standardSLA).length,
      totalTickets: typeTickets.length
    };
  });

  return ticketTypePerformance;
};
```

#### **B. SLA Performance Comparison per Company/Global (UPDATED FOR PER-COMPANY WORKFLOWS)**
```javascript
// Calculate actual vs standard SLA performance by company and global comparison
// UPDATED: Now supports per-company workflow configurations
const getSLAPerformanceByCompany = () => {
  const companyPerformance = {};
  let globalMetrics = {
    totalTickets: 0,
    totalStandardSLA: 0,
    totalActualTime: 0,
    totalBreaches: 0
  };

  companies.forEach(company => {
    // Get all tickets for this company
    const companyTickets = tickets.filter(t => t.company_id === company.id);
    const completedTickets = companyTickets.filter(t => t.status === 'Completed');

    let totalStandardSLAHours = 0;
    let totalActualResolutionHours = 0;
    let companyBreaches = 0;

    completedTickets.forEach(ticket => {
      // UPDATED: Get workflow steps for this ticket's type AND company
      // This now supports per-company workflow configurations
      const workflowSteps = workflow_steps.filter(ws =>
        ws.ticket_type_id === ticket.ticket_type_id && ws.company_id === company.id
      );

      // Calculate standard SLA target for this ticket (sum of all step SLAs)
      const ticketStandardSLAHours = workflowSteps.reduce((total, step) => {
        const stepSLA = step_slas.find(sla => sla.step_id === step.id);
        if (stepSLA) {
          const hours = stepSLA.unit === 'days' ? stepSLA.duration * 24 : stepSLA.duration;
          return total + hours;
        }
        return total;
      }, 0);

      // Calculate actual resolution time for this ticket
      const created = new Date(ticket.created_at);
      const completed = new Date(ticket.updated_at);
      const actualResolutionHours = (completed - created) / (1000 * 60 * 60);

      totalStandardSLAHours += ticketStandardSLAHours;
      totalActualResolutionHours += actualResolutionHours;

      // Check for SLA breach
      if (actualResolutionHours > ticketStandardSLAHours) {
        companyBreaches++;
      }

      // Add to global metrics
      globalMetrics.totalStandardSLA += ticketStandardSLAHours;
      globalMetrics.totalActualTime += actualResolutionHours;
      if (actualResolutionHours > ticketStandardSLAHours) globalMetrics.totalBreaches++;
    });

    // Calculate company averages
    const avgStandardSLAHours = completedTickets.length > 0 ? totalStandardSLAHours / completedTickets.length : 0;
    const avgActualResolutionHours = completedTickets.length > 0 ? totalActualResolutionHours / completedTickets.length : 0;
    const slaCompliance = completedTickets.length > 0
      ? ((completedTickets.length - companyBreaches) / completedTickets.length * 100).toFixed(1)
      : 0;

    companyPerformance[company.id] = {
      companyName: company.name,
      totalTickets: companyTickets.length,
      completedTickets: completedTickets.length,
      avgStandardSLAHours: Math.round(avgStandardSLAHours * 10) / 10,
      avgActualResolutionHours: Math.round(avgActualResolutionHours * 10) / 10,
      slaCompliance: slaCompliance,
      slaBreaches: companyBreaches,
      performanceVsStandard: avgStandardSLAHours > 0
        ? ((avgStandardSLAHours - avgActualResolutionHours) / avgStandardSLAHours * 100).toFixed(1)
        : 0
    };

    globalMetrics.totalTickets += companyTickets.length;
  });

  // Calculate global averages
  const totalCompleted = Object.values(companyPerformance)
    .reduce((sum, company) => sum + company.completedTickets, 0);

  const globalAvgs = {
    avgStandardSLA: totalCompleted > 0 ? globalMetrics.totalStandardSLA / totalCompleted : 0,
    avgActualTime: totalCompleted > 0 ? globalMetrics.totalActualTime / totalCompleted : 0,
    globalSlaCompliance: totalCompleted > 0
      ? ((totalCompleted - globalMetrics.totalBreaches) / totalCompleted * 100).toFixed(1)
      : 0,
    totalTicketsGlobal: globalMetrics.totalTickets,
    totalBreachesGlobal: globalMetrics.totalBreaches
  };

  return {
    companyPerformance,
    globalAverages: {
      ...globalAvgs,
      avgStandardSLA: Math.round(globalAvgs.avgStandardSLA * 10) / 10,
      avgActualTime: Math.round(globalAvgs.avgActualTime * 10) / 10
    }
  };
};
```

#### **C. SLA Performance per Ticket Type (PER-COMPANY SUPPORT)**
```javascript
// Calculate SLA performance per ticket type with per-company workflow support
const getSLAPerformanceByTicketTypeAndCompany = () => {
  const performanceMatrix = {};

  companies.forEach(company => {
    ticketTypes.forEach(ticketType => {
      // Get tickets for this specific company and ticket type combination
      const specificTickets = tickets.filter(t =>
        t.company_id === company.id && t.ticket_type_id === ticketType.id
      );

      if (specificTickets.length === 0) return;

      // Get company-specific workflow steps for this ticket type
      const companyWorkflowSteps = workflow_steps.filter(ws =>
        ws.ticket_type_id === ticketType.id && ws.company_id === company.id
      );

      // Calculate standard SLA target for this company's workflow
      const standardSLAHours = companyWorkflowSteps.reduce((total, step) => {
        const stepSLA = step_slas.find(sla => sla.step_id === step.id);
        if (stepSLA) {
          const hours = stepSLA.unit === 'days' ? stepSLA.duration * 24 : stepSLA.duration;
          return total + hours;
        }
        return total;
      }, 0);

      // Calculate actual performance for completed tickets
      const completedTickets = specificTickets.filter(t => t.status === 'Completed');
      const avgActualResolutionHours = completedTickets.length > 0
        ? completedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const completed = new Date(ticket.updated_at);
            const hours = (completed - created) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / completedTickets.length
        : 0;

      const slaBreaches = completedTickets.filter(ticket => {
        const created = new Date(ticket.created_at);
        const completed = new Date(ticket.updated_at);
        const actualHours = (completed - created) / (1000 * 60 * 60);
        return actualHours > standardSLAHours;
      }).length;

      const performanceKey = `${company.id}_${ticketType.id}`;
      performanceMatrix[performanceKey] = {
        companyId: company.id,
        companyName: company.name,
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        standardSLAHours: standardSLAHours,
        avgActualResolutionHours: Math.round(avgActualResolutionHours * 10) / 10,
        totalTickets: specificTickets.length,
        completedTickets: completedTickets.length,
        slaBreaches: slaBreaches,
        slaCompliance: completedTickets.length > 0
          ? ((completedTickets.length - slaBreaches) / completedTickets.length * 100).toFixed(1)
          : 0,
        performanceVsStandard: standardSLAHours > 0
          ? ((standardSLAHours - avgActualResolutionHours) / standardSLAHours * 100).toFixed(1)
          : 0
      };
    });
  });

  return performanceMatrix;
};
```

#### **D. Enhanced User Statistics**
```javascript
// Real active users calculation
const getUserActivityStats = () => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Users active this month (based on admin_action_logs)
  const activeUsers = admin_action_logs.filter(log =>
    log.action_type === 'USER_LOGIN' &&
    new Date(log.timestamp) >= thisMonth
  );

  return {
    totalUsers: users.length,
    activeThisMonth: new Set(activeUsers.map(log => log.admin_user_id)).size,
    newUsersThisMonth: user_role_assignments.filter(assignment =>
      new Date(assignment.created_at) >= thisMonth
    ).length
  };
};
```

#### **B. Workflow Complexity Metrics**
```javascript
// Average workflow steps per company
const getWorkflowComplexity = () => {
  const workflowsByCompany = {};
  workflow_steps.forEach(step => {
    if (!workflowsByCompany[step.company_id]) {
      workflowsByCompany[step.company_id] = [];
    }
    workflowsByCompany[step.company_id].push(step);
  });

  const avgStepsPerWorkflow = Object.values(workflowsByCompany)
    .map(steps => steps.length)
    .reduce((sum, count) => sum + count, 0) / Object.keys(workflowsByCompany).length;

  return {
    totalWorkflows: Object.keys(workflowsByCompany).length,
    avgStepsPerWorkflow: Math.round(avgStepsPerWorkflow * 10) / 10,
    mostComplexCompany: Object.entries(workflowsByCompany)
      .sort(([,a], [,b]) => b.length - a.length)[0]
  };
};
```

#### **C. Ticket Performance Metrics**
```javascript
// Ticket resolution times and statuses
const getTicketPerformance = () => {
  const completedTickets = tickets.filter(t => t.status === 'Completed');
  const pendingTickets = tickets.filter(t => t.status !== 'Completed' && t.status !== 'Rejected');

  // Calculate average resolution time
  const resolutionTimes = completedTickets.map(ticket => {
    const created = new Date(ticket.created_at);
    const updated = new Date(ticket.updated_at);
    return (updated - created) / (1000 * 60 * 60 * 24); // days
  });

  const avgResolutionDays = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, days) => sum + days, 0) / resolutionTimes.length
    : 0;

  return {
    totalTickets: tickets.length,
    completedTickets: completedTickets.length,
    pendingTickets: pendingTickets.length,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    completionRate: (completedTickets.length / tickets.length * 100).toFixed(1)
  };
};
```

### **📈 TIER 2: Advanced Analytics (PER-COMPANY WORKFLOW SUPPORT)**

#### **Enhanced Schema with Per-Company Support:**
```sql
-- UPDATED: workflow_steps table now includes company_id (from DATABASE_SCHEMA_UPDATES.txt)
-- workflow_steps: id|ticket_type_id|company_id|name|status_on_reach|step_type|approver_logic|sort_order|...
-- This enables per-company SLA configurations and performance tracking

-- Additional columns for advanced analytics
ALTER TABLE admin_action_logs ADD COLUMN session_id VARCHAR(255);
ALTER TABLE admin_action_logs ADD COLUMN ip_address VARCHAR(45);
ALTER TABLE admin_action_logs ADD COLUMN user_agent TEXT;

-- Add to tickets table for performance tracking
ALTER TABLE tickets ADD COLUMN resolution_time_hours INT;
ALTER TABLE tickets ADD COLUMN sla_breached BOOLEAN DEFAULT FALSE;

-- Add to workflow_steps table for usage analytics
ALTER TABLE workflow_steps ADD COLUMN avg_completion_time_hours INT;
ALTER TABLE workflow_steps ADD COLUMN usage_count INT DEFAULT 0;

-- Enhanced dropdown_lists with company_id support
-- dropdown_lists: id|name|company_id (from DATABASE_SCHEMA_UPDATES.txt)
-- This enables company-specific dropdown analytics
```

#### **A. User Engagement Analytics**
```javascript
// Session-based user engagement
const getUserEngagement = () => {
  const sessions = admin_action_logs
    .filter(log => log.session_id)
    .reduce((acc, log) => {
      if (!acc[log.session_id]) {
        acc[log.session_id] = {
          user_id: log.admin_user_id,
          start_time: log.timestamp,
          actions: 0,
          duration: 0
        };
      }
      acc[log.session_id].actions++;
      // Calculate session duration
      return acc;
    }, {});

  return {
    avgSessionDuration: calculateAvgSessionDuration(sessions),
    avgActionsPerSession: calculateAvgActions(sessions),
    mostActiveUsers: getMostActiveUsers(sessions)
  };
};
```

#### **B. SLA Performance Dashboard**
```javascript
// SLA breach analysis
const getSLAPerformance = () => {
  const slaBreaches = tickets.filter(t => t.sla_breached);
  const onTimeTickets = tickets.filter(t => !t.sla_breached && t.status === 'Completed');

  return {
    totalSLABreaches: slaBreaches.length,
    slaComplianceRate: (onTimeTickets.length / tickets.length * 100).toFixed(1),
    avgResolutionTime: calculateAvgResolutionTime(tickets),
    worstPerformingSteps: getWorstPerformingSteps()
  };
};
```

### **📊 TIER 3: Business Intelligence (Major Additions)**

#### **Required New Tables:**
```sql
CREATE TABLE system_metrics (
  id VARCHAR(255) PRIMARY KEY,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15,4),
  metric_date DATE NOT NULL,
  company_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activity_summary (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  login_count INT DEFAULT 0,
  tickets_created INT DEFAULT 0,
  tickets_approved INT DEFAULT 0,
  admin_actions INT DEFAULT 0,
  session_duration_minutes INT DEFAULT 0
);

CREATE TABLE workflow_performance (
  id VARCHAR(255) PRIMARY KEY,
  workflow_step_id VARCHAR(255) NOT NULL,
  company_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  tickets_processed INT DEFAULT 0,
  avg_processing_time_hours DECIMAL(8,2),
  sla_breaches INT DEFAULT 0
);
```

#### **A. Predictive Analytics**
```javascript
// Workload forecasting
const getWorkloadForecast = () => {
  // Analyze ticket creation patterns
  const dailyTicketCounts = getTicketCountsByDay(last30Days);
  const trendAnalysis = calculateTrend(dailyTicketCounts);

  return {
    expectedTicketsNextWeek: forecastTickets(trendAnalysis, 7),
    peakWorkloadDays: identifyPeakDays(dailyTicketCounts),
    recommendedStaffing: calculateStaffingNeeds(trendAnalysis)
  };
};
```

#### **B. Multi-Company Benchmarking**
```javascript
// Company performance comparison
const getCompanyBenchmarks = () => {
  const companyMetrics = companies.map(company => ({
    company_id: company.id,
    company_name: company.name,
    avgTicketsPerDay: calculateAvgTicketsPerDay(company.id),
    avgResolutionTime: calculateAvgResolutionTime(company.id),
    slaCompliance: calculateSLACompliance(company.id),
    userProductivity: calculateUserProductivity(company.id)
  }));

  return {
    topPerformingCompany: getTopPerformer(companyMetrics),
    industryBenchmarks: calculateBenchmarks(companyMetrics),
    improvementOpportunities: identifyImprovements(companyMetrics)
  };
};
```

---

## 🎨 Proposed UI Enhancements

### **📱 Responsive Stats Grid with Per-Company SLA Metrics**
```jsx
{/* Enhanced 2x4 Grid Layout with Per-Company SLA Performance */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-8">
  {/* Row 1: Core Metrics */}
  <StatCard title="Companies" value={companies.length} subtitle="3 active this month" />
  <StatCard title="Users" value={users.length} subtitle="12 active this month" />
  <StatCard title="Tickets" value={tickets.length} subtitle="87% completion rate" />
  <StatCard title="API Health" value="✓" subtitle="All systems operational" />

  {/* Row 2: Per-Company SLA Performance Metrics */}
  <StatCard
    title="Global SLA Compliance"
    value="94.2%"
    subtitle="Across all companies"
    trend="+2.1% vs last month"
    color="green"
  />
  <StatCard
    title="Avg Resolution Time"
    value="2.3 days"
    subtitle="Per-company weighted avg"
    trend="23% under company SLA targets"
    color="blue"
  />
  <StatCard
    title="Company SLA Variations"
    value="±1.2 days"
    subtitle="Between companies"
    trend="CompanyA: 1.8d, CompanyB: 3.0d"
    color="orange"
  />
  <StatCard
    title="Best Performing Company"
    value="TechCorp"
    subtitle="98% SLA compliance"
    trend="1.2 days avg resolution"
    color="purple"
  />
</div>

{/* Per-Company SLA Performance Table - ENHANCED */}
<div className="bg-white rounded-lg shadow mb-6">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">Per-Company SLA Performance</h3>
    <p className="text-sm text-gray-600 mt-1">
      Each company can have different workflow configurations and SLA targets for the same ticket types
    </p>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg SLA Target</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Resolution</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow Steps</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Object.values(slaPerformanceByCompany.companyPerformance).map(company => {
          const companyWorkflowSteps = workflow_steps.filter(ws => ws.company_id === company.companyId);
          return (
            <tr key={company.companyName}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {company.companyName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {company.avgStandardSLAHours}h
                <div className="text-xs text-gray-400">Company-specific</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {company.avgActualResolutionHours}h
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  company.performanceVsStandard > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {company.performanceVsStandard > 0 ? '↗' : '↘'} {Math.abs(company.performanceVsStandard)}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {company.slaCompliance}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {companyWorkflowSteps.length} steps
                <div className="text-xs text-gray-400">across {new Set(companyWorkflowSteps.map(ws => ws.ticket_type_id)).size} types</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {company.completedTickets}/{company.totalTickets}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

{/* SLA Performance by Ticket Type & Company Matrix */}
<div className="bg-white rounded-lg shadow mb-6">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">SLA Performance by Ticket Type & Company</h3>
    <p className="text-sm text-gray-600 mt-1">
      Same ticket types can have different SLA targets and performance across companies
    </p>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA Target</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Resolution</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Object.values(slaPerformanceByTicketTypeAndCompany).map(entry => (
          <tr key={`${entry.companyId}_${entry.ticketTypeId}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {entry.companyName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
              {entry.ticketTypeName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {entry.standardSLAHours}h
              <div className="text-xs text-gray-400">Company-specific</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {entry.avgActualResolutionHours}h
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                entry.performanceVsStandard > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {entry.performanceVsStandard > 0 ? '↗' : '↘'} {Math.abs(entry.performanceVsStandard)}%
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {entry.slaCompliance}%
              <div className="text-xs text-gray-400">{entry.slaBreaches} breaches</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {entry.completedTickets}/{entry.totalTickets}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### **📊 Interactive Dashboard Elements**
```jsx
{/* Expandable Stats with Charts */}
<ExpandableStatCard
  title="Ticket Trends"
  value="↗ 15%"
  subtitle="This month vs last month"
  expandedContent={<TicketTrendChart data={ticketTrends} />}
/>

<ExpandableStatCard
  title="Top Performers"
  value="5 users"
  subtitle="Above average productivity"
  expandedContent={<UserPerformanceTable data={topUsers} />}
/>
```

---

## 🛠️ Implementation Roadmap

### **Phase 1: Enhanced Current Stats (2-4 hours)**
- ✅ **COMPLETED**: Rearranged stats layout per specifications
- ✅ **COMPLETED**: Real data integration for companies, users, ticket types
- ✅ **COMPLETED**: Most active ticket type calculation
- [ ] Add user activity calculation (based on admin_action_logs)
- [ ] Add ticket performance metrics (completion rate, avg resolution time)

### **Phase 2: Basic Analytics Dashboard (8-12 hours)**
- [ ] Implement workflow complexity metrics
- [ ] Add SLA performance tracking
- [ ] Create expandable stat cards with mini-charts
- [ ] Add time-based filtering (this month, last month, etc.)

### **Phase 3: Advanced Analytics (20-30 hours)**
- [ ] Implement session tracking in admin_action_logs
- [ ] Add performance metrics tables
- [ ] Create predictive analytics
- [ ] Build company benchmarking system

### **Phase 4: Business Intelligence (40-60 hours)**
- [ ] Implement system_metrics table
- [ ] Add automated metric collection
- [ ] Create advanced dashboard with charts
- [ ] Build reporting and export capabilities

---

## 🔧 Required Backend Changes

### **Immediate (Phase 1):**
✅ **NO BACKEND CHANGES NEEDED** - Current API endpoints sufficient

### **Near-term (Phase 2): Per-Company API Enhancements**
```javascript
// Add to Google Apps Script - Enhanced for per-company support
function getUserActivityStats(companyId = null) {
  // Query admin_action_logs for login activity
  // Calculate user engagement metrics per company or globally
}

function getTicketPerformanceStats(companyId = null) {
  // Analyze ticket resolution times by company
  // Calculate completion rates by company/type with per-company workflows
}

function getSLAPerformanceByCompany(companyId = null) {
  // NEW: Calculate SLA performance using company-specific workflow configurations
  // Support for different SLA targets per company for same ticket type
}

function getWorkflowComplexityByCompany(companyId) {
  // NEW: Analyze workflow complexity per company
  // Count steps, approvers, conditions per company's workflows
}
```

### **Long-term (Phase 3-4): Advanced Per-Company Analytics**
```javascript
// New API endpoints needed - Enhanced for multi-company support
function recordUserSession(sessionData) {
  // Track user session data with company context
}

function getAdvancedMetrics(companyId, dateRange) {
  // Return comprehensive analytics with per-company breakdown
  // Support for cross-company benchmarking
}

function generatePerformanceReport(reportType, filters) {
  // Generate detailed performance reports
  // Support for company-specific and comparative reporting
}

function getCompanyBenchmarkingData(targetCompanyId) {
  // NEW: Compare target company against industry averages
  // Identify best practices from top-performing companies
}

function getCrossCompanyWorkflowAnalysis() {
  // NEW: Analyze workflow efficiency across companies
  // Identify optimization opportunities
}
```

---

## 📋 Development Notes

### **Current Implementation Status**
- ✅ **Phase 8.9 COMPLETE**: Enhanced admin panel statistics
- ✅ **Phase 8.9 COMPLETE**: Dark mode user preferences integration
- ✅ **Phase 8.95 COMPLETE**: Per-company SLA support documentation
- 🔄 **Phase 8.10**: Advanced per-company analytics implementation (planning)

### **Testing Checklist**
- [x] Stats display correctly with real API data
- [x] Loading states show during data fetching
- [x] Error handling for API failures
- [x] Responsive layout on mobile devices
- [ ] Performance with large datasets
- [ ] Real-time updates with data changes

### **Dependencies**
- **Current**: `useCompanies`, `useUsers`, `useTickets`, `useTicketTypes` hooks
- **Future**: Enhanced API endpoints for analytics
- **UI**: Chart.js or D3.js for advanced visualizations
- **Performance**: React.memo for stat card optimization

---

## 🎯 Success Metrics

### **User Experience Goals**
- **Load Time**: Stats visible within 2 seconds
- **Accuracy**: Real-time data with 100% accuracy
- **Usability**: One-click access to detailed metrics
- **Mobile**: Full functionality on mobile devices

### **Business Value Goals**
- **Visibility**: Clear performance indicators for administrators
- **Actionable**: Metrics that drive business decisions
- **Scalable**: Works with growing data volumes
- **Comparative**: Multi-company benchmarking capabilities

---

**📝 Last Updated**: September 22, 2025
**👨‍💻 Implementation**: Phase 8.95 Complete - Per-company SLA support and documentation
**🔮 Next Phase**: Advanced per-company analytics dashboard with cross-company benchmarking
**🏢 Key Enhancement**: Full per-company workflow and SLA configuration support