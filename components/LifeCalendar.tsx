
import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Log } from '../types';

interface LifeCalendarProps {
  logs?: Log[];
}

const LifeCalendar: React.FC<LifeCalendarProps> = ({ logs = [] }) => {
  const dots = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const daysInYear = ((year % 4 === 0 && year % 100 > 0) || year % 400 === 0) ? 366 : 365;

    // Create a Set of active dates for O(1) lookup
    const activeDates = new Set(logs.map(l => l.date));
    const todayStr = now.toISOString().split('T')[0];

    return Array.from({ length: daysInYear }, (_, i) => {
       const date = new Date(year, 0, i + 1);
       const dateStr = date.toISOString().split('T')[0];
       const isPast = dateStr <= todayStr;
       const isActive = activeDates.has(dateStr);
       const isToday = dateStr === todayStr;

       return {
         index: i + 1,
         date: dateStr,
         status: isToday ? 'today' : (isActive ? 'active' : (isPast ? 'missed' : 'future'))
       };
    });
  }, [logs]);

  const activeCount = dots.filter(d => d.status === 'active' || (d.status === 'today' && logs.some(l => l.date === d.date))).length;
  const missedCount = dots.filter(d => d.status === 'missed').length;

  return (
    <div className="space-y-6">
      <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
         <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-primary" />
              Life Calendar ({new Date().getFullYear()})
            </h2>
            <p className="text-sm text-text-secondary mt-1">Visualize your consistency. Each row represents 2 weeks.</p>
         </div>
         <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-green-500"></span>
              <span className="font-medium text-text-secondary">Studied ({activeCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-red-400/50"></span>
              <span className="font-medium text-text-secondary">Missed ({missedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-bg-hover border border-border"></span>
              <span className="font-medium text-text-secondary">Future</span>
            </div>
         </div>
      </div>

      <div className="bg-bg-card p-6 rounded-xl shadow-sm border border-border flex justify-center overflow-x-auto transition-colors duration-300">
        <div className="grid gap-2 min-w-fit" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
          {dots.map((dot) => {
             let bgClass = '';
             if (dot.status === 'today') {
                // If logged today, show green with border, else gray with accent border
                const hasLog = logs.some(l => l.date === dot.date);
                bgClass = hasLog ? 'bg-green-500 ring-2 ring-green-300 dark:ring-green-900' : 'bg-bg-hover ring-2 ring-accent-primary';
             } else if (dot.status === 'active') {
                bgClass = 'bg-green-500 hover:bg-green-600';
             } else if (dot.status === 'missed') {
                bgClass = 'bg-red-200 dark:bg-red-900/20 hover:bg-red-300';
             } else {
                bgClass = 'bg-bg-hover';
             }

             return (
              <div
                key={dot.index}
                title={`${dot.date} - ${dot.status}`}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-all duration-300 ${bgClass}`}
              />
            );
          })}
        </div>
      </div>
      
      <div className="text-center text-text-secondary text-sm italic">
        "Time is the scarcest resource and unless it is managed nothing else can be managed."
      </div>
    </div>
  );
};

export default LifeCalendar;
