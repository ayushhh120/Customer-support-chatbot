import React from 'react';

const StatusIndicator = ({ status }) => {
  const statusConfig = {
    online: {
      color: 'bg-online',
      label: 'Online',
      pulse: true,
    },
    offline: {
      color: 'bg-muted-foreground',
      label: 'Offline',
      pulse: false,
    },
    busy: {
      color: 'bg-escalated',
      label: 'Busy',
      pulse: true,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        {config.pulse && (
          <div className={`absolute inset-0 rounded-full ${config.color} animate-pulse-ring`} />
        )}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{config.label}</span>
    </div>
  );
};

export default StatusIndicator;
