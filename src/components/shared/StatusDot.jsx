 import React from 'react';
import { cn } from '@/lib/utils';

const statusColors = {
  active: 'bg-emerald-400',
  completed: 'bg-primary',
  archived: 'bg-muted-foreground',
  found: 'bg-red-400',
  confirmed: 'bg-orange-400',
  mitigated: 'bg-emerald-400',
  false_positive: 'bg-gray-400',
};

export default function StatusDot({ status, pulse = false, className }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      statusColors[status] || 'bg-muted-foreground',
      pulse && 'animate-pulse-glow',
      className
    )} />
  );
}
