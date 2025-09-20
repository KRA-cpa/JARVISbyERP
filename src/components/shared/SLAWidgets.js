import React from 'react';
import { useSLAOverdueTickets, useSLADueTodayTickets } from '../../hooks/useAPI';
import Icons from './Icons';

/**
 * SLA Status Summary Widgets
 *
 * Displays real-time SLA status information in dashboard cards
 * Shows overdue tickets, due today, and performance metrics
 */

/**
 * Single SLA Status Card Component
 */
const SLAStatusCard = ({
  title,
  count,
  icon: IconComponent,
  color,
  loading = false,
  onClick = null,
  subtitle = null
}) => {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  const iconColors = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600'
  };

  return (
    <div
      className={`border rounded-lg p-4 ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full bg-white/50`}>
            <IconComponent size={24} className={iconColors[color]} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {loading ? (
                <div className="animate-pulse bg-gray-300 h-6 w-12 rounded"></div>
              ) : (
                count
              )}
            </h3>
            <p className="text-sm font-medium">{title}</p>
            {subtitle && (
              <p className="text-xs opacity-75 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {onClick && (
          <Icons.ChevronRight size={20} className={iconColors[color]} />
        )}
      </div>
    </div>
  );
};

/**
 * Overdue Tickets Widget
 */
export const SLAOverdueWidget = ({ onClick = null }) => {
  const { data: overdueTickets, loading, error } = useSLAOverdueTickets();

  if (error) {
    return (
      <SLAStatusCard
        title="Overdue Tickets"
        count="Error"
        icon={Icons.Warning}
        color="red"
        subtitle="Failed to load data"
      />
    );
  }

  const count = overdueTickets?.length || 0;
  const subtitle = count > 0 ? 'Immediate attention required' : 'All tickets on track';

  return (
    <SLAStatusCard
      title="Overdue Tickets"
      count={count}
      icon={Icons.Overdue}
      color={count > 0 ? 'red' : 'green'}
      loading={loading}
      onClick={onClick}
      subtitle={subtitle}
    />
  );
};

/**
 * Due Today Widget
 */
export const SLADueTodayWidget = ({ onClick = null }) => {
  const { data: dueTodayTickets, loading, error } = useSLADueTodayTickets();

  if (error) {
    return (
      <SLAStatusCard
        title="Due Today"
        count="Error"
        icon={Icons.Warning}
        color="yellow"
        subtitle="Failed to load data"
      />
    );
  }

  const count = dueTodayTickets?.length || 0;
  const subtitle = count > 0 ? 'Action needed today' : 'No tickets due today';

  return (
    <SLAStatusCard
      title="Due Today"
      count={count}
      icon={Icons.Urgent}
      color={count > 0 ? 'yellow' : 'green'}
      loading={loading}
      onClick={onClick}
      subtitle={subtitle}
    />
  );
};

/**
 * SLA Performance Summary Widget
 */
export const SLAPerformanceWidget = ({ onClick = null }) => {
  const { data: overdueTickets, loading: overdueLoading } = useSLAOverdueTickets();
  const { data: dueTodayTickets, loading: dueTodayLoading } = useSLADueTodayTickets();

  const loading = overdueLoading || dueTodayLoading;

  if (loading) {
    return (
      <SLAStatusCard
        title="SLA Performance"
        count="..."
        icon={Icons.Dashboard}
        color="blue"
        loading={true}
        subtitle="Calculating metrics"
      />
    );
  }

  const overdueCount = overdueTickets?.length || 0;
  const dueTodayCount = dueTodayTickets?.length || 0;
  const totalAtRisk = overdueCount + dueTodayCount;

  let performanceStatus;
  let color;
  if (overdueCount > 0) {
    performanceStatus = 'Needs Attention';
    color = 'red';
  } else if (dueTodayCount > 0) {
    performanceStatus = 'At Risk';
    color = 'yellow';
  } else {
    performanceStatus = 'On Track';
    color = 'green';
  }

  const subtitle = `${totalAtRisk} ticket${totalAtRisk !== 1 ? 's' : ''} need${totalAtRisk === 1 ? 's' : ''} attention`;

  return (
    <SLAStatusCard
      title="SLA Performance"
      count={performanceStatus}
      icon={Icons.Dashboard}
      color={color}
      onClick={onClick}
      subtitle={totalAtRisk > 0 ? subtitle : 'All SLAs are being met'}
    />
  );
};

/**
 * Complete SLA Summary Component
 */
export const SLASummaryWidgets = ({
  onOverdueClick = null,
  onDueTodayClick = null,
  onPerformanceClick = null
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SLAOverdueWidget onClick={onOverdueClick} />
      <SLADueTodayWidget onClick={onDueTodayClick} />
      <SLAPerformanceWidget onClick={onPerformanceClick} />
    </div>
  );
};

/**
 * Detailed SLA Metrics Component
 */
export const SLADetailedMetrics = () => {
  const { data: overdueTickets, loading: overdueLoading } = useSLAOverdueTickets();
  const { data: dueTodayTickets, loading: dueTodayLoading } = useSLADueTodayTickets();

  if (overdueLoading || dueTodayLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Metrics</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const overdueCount = overdueTickets?.length || 0;
  const dueTodayCount = dueTodayTickets?.length || 0;

  // Calculate average overdue time
  const averageOverdueHours = overdueTickets?.reduce((acc, ticket) => {
    if (ticket.sla_status?.hoursOverdue) {
      return acc + ticket.sla_status.hoursOverdue;
    }
    return acc;
  }, 0) / (overdueCount || 1);

  const metrics = [
    {
      label: 'Tickets Overdue',
      value: overdueCount,
      trend: overdueCount > 0 ? 'negative' : 'neutral',
      unit: 'tickets'
    },
    {
      label: 'Due Today',
      value: dueTodayCount,
      trend: dueTodayCount > 0 ? 'warning' : 'positive',
      unit: 'tickets'
    },
    {
      label: 'Avg. Overdue Time',
      value: overdueCount > 0 ? Math.round(averageOverdueHours) : 0,
      trend: overdueCount > 0 ? 'negative' : 'positive',
      unit: 'hours'
    },
    {
      label: 'SLA Compliance',
      value: overdueCount === 0 ? 100 : Math.max(0, 100 - (overdueCount * 10)),
      trend: overdueCount === 0 ? 'positive' : 'negative',
      unit: '%'
    }
  ];

  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    warning: 'text-yellow-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Metrics</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className={`text-2xl font-bold ${trendColors[metric.trend]}`}>
              {metric.value}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {metric.unit}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {(overdueCount > 0 || dueTodayCount > 0) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icons.Warning size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                SLA Action Required
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                {overdueCount > 0 && `${overdueCount} ticket${overdueCount !== 1 ? 's are' : ' is'} overdue and require${overdueCount === 1 ? 's' : ''} immediate attention. `}
                {dueTodayCount > 0 && `${dueTodayCount} ticket${dueTodayCount !== 1 ? 's are' : ' is'} due today.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SLASummaryWidgets;