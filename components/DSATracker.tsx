
import React, { useState, useMemo } from 'react';
import { UserData, Log } from '../types';
import { dataService } from '../services/db';
import { Trophy, Target, Clock, Code, Plus, Filter, Trash2, ExternalLink, AlertTriangle, Check } from 'lucide-react';

interface DSATrackerProps {
  user: UserData;
  onUpdate: () => void;
}

const DSATracker: React.FC<DSATrackerProps> = ({ user, onUpdate }) => {
  const [problemName, setProblemName] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timeSpent, setTimeSpent] = useState('');

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  const showToastMessage = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const dsaLogs = useMemo(() => {
    return user.logs
      .filter(log => log.categories && log.categories.includes('dsa'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user.logs]);

  const stats = useMemo(() => {
    const totalSolved = dsaLogs.length;
    const hardCount = dsaLogs.filter(l => l.difficulty === 'Hard').length;
    
    let avgTime = 0;
    if (totalSolved > 0) {
      const totalMinutes = dsaLogs.reduce((acc, log) => acc + (log.hours * 60), 0);
      avgTime = Math.round(totalMinutes / totalSolved);
    }

    return { totalSolved, hardCount, avgTime };
  }, [dsaLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemName || !timeSpent) return;

    const mins = parseInt(timeSpent);
    const hours = mins / 60;

    const newLog: Log = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      subject: problemName,
      hours: parseFloat(hours.toFixed(2)),
      notes: `[DSA] Topic: ${topic} | Difficulty: ${difficulty}`, 
      categories: ['dsa'],
      difficulty: difficulty,
      topic: topic || 'General'
    };

    dataService.addLog(user.email, newLog);
    onUpdate();
    showToastMessage("Problem logged successfully!");
    
    setProblemName('');
    setTopic('');
    setDifficulty('Medium');
    setTimeSpent('');
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dataService.deleteLog(user.email, deleteId);
      onUpdate();
      showToastMessage("Problem deleted.");
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">DSA Tracker</h2>
        <p className="text-text-secondary mt-1">Master algorithms one problem at a time.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-bg-card p-5 md:p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between h-28 md:h-32">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 w-fit rounded-lg text-blue-600 dark:text-blue-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-secondary font-medium">Total Solved</p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary">{stats.totalSolved}</p>
          </div>
        </div>

        <div className="bg-bg-card p-5 md:p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between h-28 md:h-32">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 w-fit rounded-lg text-red-600 dark:text-red-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-secondary font-medium">Hard Problems</p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary">{stats.hardCount}</p>
          </div>
        </div>

        <div className="bg-bg-card p-5 md:p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between h-28 md:h-32">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/20 w-fit rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-text-secondary font-medium">Avg. Time/Prob</p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary">{stats.avgTime} <span className="text-base font-normal text-text-secondary">min</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-4">
            <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent-primary" />
              Log New Problem
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Problem Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Two Sum"
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                  value={problemName}
                  onChange={e => setProblemName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Arrays, Hash Map"
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Difficulty</label>
                   <select
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none appearance-none cursor-pointer"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                   >
                     <option>Easy</option>
                     <option>Medium</option>
                     <option>Hard</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Time (mins)</label>
                   <input
                    required
                    type="number"
                    inputMode="numeric"
                    placeholder="30"
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={timeSpent}
                    onChange={e => setTimeSpent(e.target.value)}
                   />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-accent-primary/20 active:scale-[0.98] mt-2"
              >
                Log Problem
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="xl:col-span-2">
           <div className="bg-bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
             <div className="p-5 border-b border-border flex justify-between items-center">
               <h3 className="font-bold text-text-primary flex items-center gap-2">
                 <Code className="w-5 h-5 text-text-secondary" />
                 Recent Solutions
               </h3>
               <span className="text-xs bg-bg-hover px-2 py-1 rounded text-text-secondary">Last 30 days</span>
             </div>

             {dsaLogs.length === 0 ? (
               <div className="p-12 text-center text-text-secondary">
                 <p className="italic">No problems solved yet. Go for it!</p>
               </div>
             ) : (
               <div className="overflow-x-auto touch-pan-x">
                 <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                   <thead>
                     <tr className="bg-bg-input/50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                       <th className="p-4 font-bold">Date</th>
                       <th className="p-4 font-bold">Problem</th>
                       <th className="p-4 font-bold">Topic</th>
                       <th className="p-4 font-bold">Difficulty</th>
                       <th className="p-4 font-bold text-right">Time</th>
                       <th className="p-4 font-bold text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {dsaLogs.map((log) => (
                       <tr key={log.id} className="group hover:bg-bg-hover/50 transition-colors">
                         <td className="p-4 text-sm text-text-secondary font-medium whitespace-nowrap">
                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </td>
                         <td className="p-4 text-sm font-bold text-text-primary">{log.subject}</td>
                         <td className="p-4 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-bg-hover text-text-secondary text-xs border border-border whitespace-nowrap">
                              {log.topic || 'General'}
                            </span>
                         </td>
                         <td className="p-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              log.difficulty === 'Easy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                              log.difficulty === 'Hard' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                            }`}>
                              {log.difficulty}
                            </span>
                         </td>
                         <td className="p-4 text-sm text-text-secondary font-mono text-right whitespace-nowrap">
                            {Math.round(log.hours * 60)}m
                         </td>
                         <td className="p-4 text-right">
                            <button 
                                onClick={() => initiateDelete(log.id)}
                                className="p-2 text-text-secondary hover:text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Delete Problem?</h3>
                <p className="text-text-secondary text-sm">Are you sure you want to delete this entry? This action cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="py-2.5 px-4 bg-bg-hover text-text-primary font-medium rounded-xl hover:bg-bg-input transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-bg-card border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="p-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
             <Check className="w-4 h-4" />
          </div>
          <span className="font-medium text-text-primary text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default DSATracker;
