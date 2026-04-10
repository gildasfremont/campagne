'use client';

import { getOccupancyColor, getOccupancyLabel } from '@/lib/dates';

interface OccupancyBadgeProps {
  count: number;
}

export default function OccupancyBadge({ count }: OccupancyBadgeProps) {
  if (count === 0) return null;
  const color = getOccupancyColor(count);
  const label = getOccupancyLabel(count);

  return (
    <div
      className="text-xs font-bold rounded px-1 py-0.5 text-center text-white leading-tight"
      style={{ backgroundColor: color }}
      title={`${count} pers. — ${label}`}
    >
      {count}
    </div>
  );
}
