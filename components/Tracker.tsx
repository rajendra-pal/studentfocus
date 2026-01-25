
import React, { useState } from 'react';
import { UserData, Log } from '../types';
import { dataService } from '../services/db';
import { PlusCircle, Clock, Book, Code, Zap, Calendar as CalendarIcon, CheckCircle2, Laptop, Edit2, Trash2, Save, AlertTriangle, Check } from 'lucide-react';

interface TrackerProps {
  user: UserData;
  onUpdate: () => void;
  defaultCategory?: 'study' | 'dsa' | 'project';
}

const Tracker: React.FC<TrackerProps> = ({ user, onUpdate, defaultCategory }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Log['categories']>(
    defaultCategory ? [defaultCategory] : []
  );
  const [energy, setEnergy] = useState(3);

  const showToastMessage = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

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
    const energyMatch = log.notes.match(/\[Energy: (\d)\/5 ⚡\]/);
    if (energyMatch) {
      setEnergy(parseInt(energyMatch[1]));
      setNotes(log.notes.replace(energyMatch[0], '').trim());
    } else {
      setEnergy(3);
      setNotes(log.notes);
    }
    setSelectedCategories(log.categories || []);
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
        showToastMessage("Entry updated successfully!");
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
      showToastMessage("New entry logged!");
    }

    onUpdate();
    cancelEdit();
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dataService.deleteLog(user.email, deleteId);
      if (editingId === deleteId) cancelEdit();
      onUpdate();
      showToastMessage("Entry deleted.");
    }
    setShowDeleteModal(false);
    setDeleteId(null);
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

  const getLogEnergy = (notes: string) => {
    const match = notes.match(/\[Energy: (\d)\/5 ⚡\]/);
    return match ? parseInt(match[1]) : null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative">
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
              {sortedLogs.map((log) => {
                const energyVal = getLogEnergy(log.notes);
                const primaryCat = log.categories?.[0] || 'study';
                
                return (
                  <div key={log.id} className={`bg-bg-card p-5 rounded-2xl border transition-all group relative flex flex-col md:flex-row gap-4 md:items-start ${editingId === log.id ? 'border-accent-primary ring-1 ring-accent-primary opacity-50 pointer-events-none' : 'border-border hover:shadow-md'}`}>
                     
                     {/* Actions - Top Right */}
                     <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <button 
                          onClick={() => startEdit(log)}
                          className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                           <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => initiateDelete(log.id)}
                          className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>

                     {/* Icon Box */}
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                        primaryCat === 'dsa' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' :
                        primaryCat === 'project' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                     }`}>
                        {primaryCat === 'dsa' ? <Code size={24} /> : primaryCat === 'project' ? <Laptop size={24} /> : <Book size={24} />}
                     </div>

                     {/* Content */}
                     <div className="flex-1 min-w-0 pr-16">
                        <h4 className="font-bold text-text-primary text-lg leading-tight mb-1">{log.subject}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary mb-3">
                           <span>{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                           <span className="w-1 h-1 rounded-full bg-text-secondary/50"></span>
                           <span className="px-2 py-0.5 rounded-md bg-bg-hover text-xs font-medium border border-border">
                              {primaryCat === 'study' ? 'Academics' : primaryCat === 'project' ? 'Skill Dev' : 'DSA'}
                           </span>
                        </div>

                        {energyVal !== null && (
                           <div className="flex items-center gap-2 text-sm text-text-secondary border-l-2 border-accent-primary/30 pl-3">
                              <span className="text-text-secondary/70">|</span>
                              <span className="font-medium text-text-primary">[Energy: {energyVal}/5 ⚡]</span>
                           </div>
                        )}
                     </div>

                     {/* Time Badge - Bottom Right (or right aligned on desktop) */}
                     <div className="md:ml-auto md:self-end flex items-center justify-end">
                        <span className="font-mono font-bold text-xs bg-bg-input px-2.5 py-1 rounded-lg text-text-primary border border-border">
                          {log.hours}h
                        </span>
                     </div>
                  </div>
                );
              })}
            </div>
         )}
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
                <h3 className="text-xl font-bold text-text-primary mb-2">Delete Entry?</h3>
                <p className="text-text-secondary text-sm">Are you sure you want to delete this log? This action cannot be undone.</p>
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

export default Tracker;
