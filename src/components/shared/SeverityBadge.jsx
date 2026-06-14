 import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const severityConfig = {
  critical: { classes: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-400' },
  high: { classes: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  medium: { classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  low: { classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
  info: { classes: 'bg-gray-500/15 text-gray-400 border-gray-500/30', dot: 'bg-gray-400' },
};

export default function SeverityBadge({ severity, className }) {
  const config = severityConfig[severity] || severityConfig.info;
  return (
    <Badge variant="outline" className={cn('font-mono text-xs border', config.classes, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dot)} />
      {severity?.toUpperCase()}
    </Badge>
  );
}
