import React, { useMemo } from 'react';
import { UserData, DAYS_OF_WEEK, Log } from '../types';
import { Clock, Code, BookOpen, Target, Calendar, Flame, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: UserData;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const todayIndex = new Date().getDay(); 
  const mappedIndex = (todayIndex + 6) % 7;
  const todayName = DAYS_OF_WEEK[mappedIndex];
  const todaySchedule = user.schedule.find(s => s.day === todayName);

  // Helper: Calculate Streaks
  const calculateStreaks = (logs: Log[]) => {
    // Get unique dates sorted descending
    const dates: string[] = (Array.from(new Set(logs.map(l => l.date))) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (dates.length === 0) return { current: 0, best: 0, weekly: 0 };

    // Current Streak
    let current = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if streak is active (logged today or yesterday)
    let checkDate = new Date();
    if (dates.includes(today)) {
       // Good
    } else if (dates.includes(yesterday)) {
       checkDate.setDate(checkDate.getDate() - 1);
    } else {
       // Streak broken
       return { current: 0, best: calculateBestStreak(dates), weekly: 0 };
    }

    // Iterate backwards
    for (let i = 0; i < dates.length; i++) {
       // Reconstruct dates to ensure continuity
       const d = new Date();
       d.setDate(d.getDate() - (dates.includes(today) ? i : i + 1));
       const dStr = d.toISOString().split('T')[0];
       
       if (dates.includes(dStr)) {
         current++;
       } else {
         break;
       }
    }

    return { 
      current, 
      best: calculateBestStreak(dates), 
      weekly: 0 // Placeholder, could implement detailed weekly streak logic
    };
  };

  const calculateBestStreak = (sortedDates: string[]) => {
     let max = 0;
     let temp = 0;
     // Sort ascending for this check
     const dates = [...sortedDates].sort();
     
     if (dates.length === 0) return 0;
     
     temp = 1;
     max = 1;

     for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i-1]);
        const curr = new Date(dates[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
           temp++;
        } else {
           temp = 1;
        }
        if (temp > max) max = temp;
     }
     return max;
  };

  const streakStats = useMemo(() => calculateStreaks(user.logs), [user.logs]);

  const stats = useMemo(() => {
    const totalHours = user.logs.reduce((acc, log) => acc + log.hours, 0);
    const dsaCount = user.logs.filter(l => l.categories && l.categories.includes('dsa')).length;
    const projectCount = user.logs.filter(l => l.categories && l.categories.includes('project')).length;
    
    const totalGoals = user.goals.length;
    const completedGoals = user.goals.filter(g => g.completed).length;
    const consistency = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return { totalHours, dsaCount, projectCount, consistency };
  }, [user.logs, user.goals]);

  // Weekly Summary Data
  const weeklySummary = useMemo(() => {
     const curr = new Date();
     const first = curr.getDate() - curr.getDay() + 1; // Monday
     const last = first + 6; // Sunday
     
     const monday = new Date(curr.setDate(first)).toISOString().split('T')[0];
     const sunday = new Date(curr.setDate(last)).toISOString().split('T')[0];

     // Filter logs for this week
     const weekLogs = user.logs.filter(l => l.date >= monday && l.date <= sunday);
     
     const totalHours = weekLogs.reduce((acc, l) => acc + l.hours, 0);
     const subjects = [...new Set(weekLogs.map(l => l.subject))];
     const activeDays = new Set(weekLogs.map(l => l.date)).size;
     
     // Find weakest subject
     const subjectHours: Record<string, number> = {};
     weekLogs.forEach(l => {
        subjectHours[l.subject] = (subjectHours[l.subject] || 0) + l.hours;
     });
     
     let weakestSubject = "N/A";
     let minHours = Infinity;
     
     Object.entries(subjectHours).forEach(([sub, hrs]) => {
        if (hrs < minHours) {
           minHours = hrs;
           weakestSubject = sub;
        }
     });

     return { totalHours, subjectCount: subjects.length, activeDays, weakestSubject };
  }, [user.logs]);


  const activityData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hours = user.logs
        .filter(l => l.date === dateStr)
        .reduce((acc, l) => acc + l.hours, 0);
      
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: hours
      });
    }
    return data;
  }, [user.logs]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-300">
        <div>
          <h2 className="text-3xl font-bold text-text-primary tracking-tight">{user.profile.semester}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-text-secondary">Focus:</span>
            <span className="font-medium text-accent-primary">{user.profile.careerFocus}</span>
          </div>
        </div>
        <div className="flex gap-4">
             {/* Streak Badge */}
             <div className="flex items-center gap-3 bg-orange-500/10 px-5 py-3 rounded-xl border border-orange-500/20">
                <Flame className={`w-6 h-6 ${streakStats.current > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-text-secondary'}`} />
                <div>
                   <div className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Streak</div>
                   <div className="text-2xl font-bold text-text-primary">{streakStats.current} <span className="text-sm font-normal text-text-secondary">days</span></div>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-accent-primary/10 px-6 py-3 rounded-xl border border-accent-primary/20">
                <div>
                    <div className="text-xs text-accent-primary font-bold uppercase tracking-wider">Target SGPA</div>
                    <div className="text-3xl font-bold text-accent-primary">{user.profile.targetSgpa}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule (Today's Plan) - Source Order: 1 (Mobile Top) */}
          <div className="lg:col-span-1 lg:order-2 bg-bg-card rounded-xl shadow-sm border border-border p-6 transition-colors duration-300 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                 <Calendar className="w-5 h-5 text-accent-primary" />
                 <h3 className="font-bold text-text-primary text-lg">Today's Plan</h3>
                 <span className="text-xs text-text-secondary font-medium ml-auto bg-bg-hover px-2 py-1 rounded">{todayName}</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[300px] lg:max-h-none">
                {(!todaySchedule || todaySchedule.subjects.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 min-h-[150px]">
                      <p className="text-text-secondary text-sm italic">No subjects scheduled for today.</p>
                      <p className="text-xs text-text-secondary mt-1">Take a break or work on a project!</p>
                  </div>
                ) : (
                  todaySchedule.subjects.map((subject, idx) => (
                    <div key={idx} className="flex items-center p-4 bg-bg-hover/50 hover:bg-bg-hover rounded-lg border-l-4 border-accent-primary shadow-sm transition-colors">
                      <span className="font-medium text-text-primary">{subject}</span>
                    </div>
                  ))
                )}
              </div>
          </div>

          {/* Main Stats - Source Order: 2 (Mobile 2nd) */}
          <div className="lg:col-span-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-text-secondary text-xs font-bold uppercase">Study Hours</span>
                    <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{stats.totalHours.toFixed(1)}</div>
            </div>
            
            <div className="bg-bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-text-secondary text-xs font-bold uppercase">DSA Solved</span>
                    <Code className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{stats.dsaCount}</div>
            </div>

            <div className="bg-bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-text-secondary text-xs font-bold uppercase">Projects</span>
                    <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{stats.projectCount}</div>
            </div>

            <div className="bg-bg-card p-5 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-text-secondary text-xs font-bold uppercase">Goal Completion</span>
                    <Target className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{stats.consistency}%</div>
                <div className="w-full bg-bg-hover rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stats.consistency}%` }}></div>
                </div>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - Source Order: 3 (Mobile 3rd/4th after Stats) */}
          <div className="lg:col-span-2 bg-bg-card rounded-xl shadow-sm border border-border p-6 transition-colors duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-text-primary text-lg">Weekly Activity</h3>
                 <span className="text-sm text-text-secondary">Hours spent per day</span>
               </div>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: 'var(--text-secondary)'}} 
                        dy={10}
                     />
                     <YAxis 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: 'var(--text-secondary)'}}
                     />
                     <Tooltip 
                        cursor={{fill: 'var(--bg-hover)'}}
                        contentStyle={{
                            borderRadius: '8px', 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
                     />
                     <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 6 ? 'var(--accent-primary)' : 'var(--text-secondary)'} opacity={index === 6 ? 1 : 0.3} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
          </div>

          {/* Weekly Summary Panel - Source Order: 4 (Mobile Last) */}
          <div className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between">
              <div>
                  <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-accent-secondary" />
                      This Week
                  </h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-sm text-text-secondary">Hours Logged</span>
                          <span className="font-bold text-text-primary">{weeklySummary.totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-sm text-text-secondary">Subjects</span>
                          <span className="font-bold text-text-primary">{weeklySummary.subjectCount}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <span className="text-sm text-text-secondary">Consistency</span>
                          <span className="font-bold text-text-primary">{weeklySummary.activeDays}/7 days</span>
                      </div>
                      <div className="pt-1">
                          <span className="text-xs text-text-secondary block mb-1">Focus Area needed in:</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {weeklySummary.weakestSubject}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;