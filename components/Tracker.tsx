import React, { useState } from 'react';
import { UserData, Log } from '../types';
import { dataService } from '../services/db';
import { PlusCircle, Clock, Book, Code, Zap, Calendar as CalendarIcon, CheckCircle2, Laptop, Edit2, Trash2, Save } from 'lucide-react';

interface TrackerProps {
  user: UserData;
  onUpdate: () => void;
  defaultCategory?: 'study' | 'dsa' | 'project';
}

const Tracker: React.FC<TrackerProps> = ({ user, onUpdate, defaultCategory }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Log['categories']>(
    defaultCategory ? [defaultCategory] : []
  );
  const [energy, setEnergy] = useState(3);

  const toggleCategory = (catId: 'study' | 'dsa' | 'project') => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const startEdit = (log: Log) => {
    setEditingId(log.id);
    setSubject(log.subject);
    setHours(log.hours.toString());
    // Extract Energy if present in notes or default
    // This is a simple parser assuming standard format [Energy: X/5 ⚡]
    const energyMatch = log.notes.match(/\[Energy: (\d)\/5 ⚡\]/);
    if (energyMatch) {
      setEnergy(parseInt(energyMatch[1]));
      setNotes(log.notes.replace(energyMatch[0], '').trim());
    } else {
      setEnergy(3);
      setNotes(log.notes);
    }
    setSelectedCategories(log.categories || []);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSubject('');
    setHours('');
    setNotes('');
    setEnergy(3);
    setSelectedCategories(defaultCategory ? [defaultCategory] : []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !hours || selectedCategories.length === 0) return;

    // Append Energy to notes for storage
    const noteContent = notes.trim() 
      ? `${notes}\n\n[Energy: ${energy}/5 ⚡]` 
      : `[Energy: ${energy}/5 ⚡]`;

    if (editingId) {
      // Update existing log
      const existingLog = user.logs.find(l => l.id === editingId);
      if (existingLog) {
        const updatedLog: Log = {
          ...existingLog,
          subject,
          hours: parseFloat(hours),
          notes: noteContent,
          categories: selectedCategories
        };
        dataService.updateLog(user.email, updatedLog);
      }
    } else {
      // Create new log
      const newLog: Log = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        subject,
        hours: parseFloat(hours),
        notes: noteContent,
        categories: selectedCategories
      };
      dataService.addLog(user.email, newLog);
    }

    onUpdate();
    cancelEdit();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this log entry?")) {
      dataService.deleteLog(user.email, id);
      if (editingId === id) cancelEdit();
      onUpdate();
    }
  };

  // Filter if defaultCategory is provided (show logs that contain this category)
  const filteredLogs = defaultCategory 
    ? user.logs.filter(log => log.categories && log.categories.includes(defaultCategory))
    : user.logs;

  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categories = [
    { id: 'study', label: 'Academics', icon: Book, description: 'Coursework, exams' },
    { id: 'project', label: 'Skill Dev', icon: Laptop, description: 'Projects, new tech' },
    { id: 'dsa', label: 'DSA', icon: Code, description: 'LeetCode, Algos' },
  ] as const;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="xl:col-span-1 space-y-6">
        <div className={`bg-bg-card rounded-2xl shadow-sm border p-6 md:p-8 transition-colors ${editingId ? 'border-accent-primary ring-1 ring-accent-primary' : 'border-border'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className={`p-3 rounded-xl text-white ${editingId ? 'bg-accent-primary' : 'bg-accent-primary/10 text-accent-primary'}`}>
              {editingId ? <Edit2 className="w-6 h-6" /> : <PlusCircle className="w-6 h-6 text-accent-primary" />}
            </div>
            <div>
               <h2 className="text-xl font-bold text-text-primary">{editingId ? 'Edit Entry' : 'New Entry'}</h2>
               <p className="text-sm text-text-secondary">{editingId ? 'Update your activity details.' : 'Log your progress and build consistency.'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Date Display */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Date</label>
              <div className="flex items-center p-4 bg-bg-input border border-border rounded-xl text-text-primary">
                <CalendarIcon className="w-5 h-5 mr-3 text-text-secondary" />
                <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Category Selection (Multi-select) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">What did you work on?</label>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 group active:scale-[0.98] ${
                        isSelected
                          ? 'border-accent-primary bg-accent-primary/5'
                          : 'border-border bg-bg-card hover:border-accent-primary/30 hover:bg-bg-hover'
                      }`}
                    >
                      <div className={`p-3 rounded-lg mr-4 transition-colors ${
                        isSelected ? 'bg-accent-primary text-text-inverse' : 'bg-bg-hover text-text-secondary group-hover:bg-white group-hover:text-accent-primary dark:group-hover:bg-gray-800'
                      }`}>
                          <cat.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <span className={`block font-bold ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>{cat.label}</span>
                        <span className="text-xs text-text-secondary">{cat.description}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-accent-primary bg-accent-primary text-text-inverse' : 'border-border text-transparent'
                      }`}>
                          <CheckCircle2 size={14} />
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-xs text-red-400 mt-2">Please select at least one category.</p>
              )}
            </div>

            {/* Specific Topic Input */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Specific Topic</label>
              <input
                required
                type="text"
                className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Graph Traversals, Portfolio Site"
              />
            </div>

            {/* Hours & Energy */}
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Hours</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-3.5 text-text-secondary text-sm font-medium">h</span>
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Energy (1-5)</label>
                <div className="flex justify-between bg-bg-input border border-border rounded-xl p-2 items-center h-[50px]">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergy(lvl)}
                      className={`p-1.5 rounded-lg transition-all flex-1 flex justify-center ${
                        energy >= lvl ? 'text-amber-400 bg-amber-400/10' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Zap size={24} fill={energy >= lvl ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Daily Notes</label>
              <textarea
                className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none resize-none"
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you learn today?"
              />
            </div>

            <div className="flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-4 bg-bg-hover text-text-secondary hover:text-text-primary font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={selectedCategories.length === 0}
                className={`flex-1 py-4 font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  editingId 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20' 
                  : 'bg-accent-primary hover:bg-accent-hover text-white shadow-accent-primary/20'
                }`}
              >
                {editingId ? <><Save size={20} /> Update</> : 'Log Progress'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: History */}
      <div className="xl:col-span-2 space-y-6">
         <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-bold text-text-primary">Recent Logs</h2>
         </div>
         
         {sortedLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-bg-card/50 text-text-secondary">
               <p>No logs yet. Start today!</p>
            </div>
         ) : (
            <div className="grid gap-4">
              {sortedLogs.map((log) => (
                <div key={log.id} className={`bg-bg-card p-4 sm:p-6 rounded-2xl border shadow-sm transition-all group relative ${editingId === log.id ? 'border-accent-primary ring-1 ring-accent-primary opacity-50 pointer-events-none' : 'border-border hover:shadow-md'}`}>
                   <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button 
                        onClick={() => startEdit(log)}
                        className="p-2 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                        title="Edit Log"
                      >
                         <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(log.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Log"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>

                   <div className="flex flex-col gap-3 mb-4 pr-16 sm:pr-0">
                      <div className="flex items-start gap-4">
                        <div className="flex -space-x-3 shrink-0">
                            {log.categories && log.categories.map(cat => (
                                <div key={cat} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border-2 border-bg-card relative z-10 ${
                                  cat === 'dsa' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' :
                                  cat === 'project' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300' :
                                  'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                                }`}>
                                   {cat === 'dsa' ? <Code size={18} /> : cat === 'project' ? <Laptop size={18} /> : <Book size={18} />}
                                </div>
                            ))}
                        </div>
                        <div className="min-w-0 flex-1">
                           <h4 className="font-bold text-text-primary text-base sm:text-lg break-words">{log.subject}</h4>
                           <p className="text-xs sm:text-sm text-text-secondary flex flex-wrap items-center gap-2 mt-1">
                              <span>{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="capitalize px-1.5 py-0.5 rounded bg-bg-hover">
                                {log.categories && log.categories.map(c => 
                                    c === 'study' ? 'Academics' : c === 'project' ? 'Skill Dev' : 'DSA'
                                ).join(', ')}
                              </span>
                              <span className="ml-auto font-mono font-medium text-text-primary bg-bg-input px-2 py-0.5 rounded text-xs">
                                {log.hours}h
                              </span>
                           </p>
                        </div>
                      </div>
                   </div>
                   {log.notes && (
                     <div className="pl-3 sm:pl-4 border-l-2 border-border ml-2">
                       <p className="text-text-secondary text-sm whitespace-pre-wrap">{log.notes}</p>
                     </div>
                   )}
                </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default Tracker;