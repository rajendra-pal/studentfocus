import React, { useState } from 'react';
import { UserData, DaySchedule } from '../types';
import { dataService } from '../services/db';
import { Save, Check, User, Mail, GraduationCap, Calendar, Plus, X, Download, Archive, Target } from 'lucide-react';

interface AccountProps {
  user: UserData;
  onUpdate: () => void;
}

const Account: React.FC<AccountProps> = ({ user, onUpdate }) => {
  const [semester, setSemester] = useState(user.profile.semester);
  const [targetSgpa, setTargetSgpa] = useState(user.profile.targetSgpa);
  const [careerFocus, setCareerFocus] = useState(user.profile.careerFocus);
  const [enableDsa, setEnableDsa] = useState(user.profile.enableDsa ?? true);
  const [showToast, setShowToast] = useState(false);
  
  // Local schedule state for editing
  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(
    JSON.parse(JSON.stringify(user.schedule)) // Deep clone
  );

  const handleAddSubject = (dayIndex: number, inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      const newSched = [...localSchedule];
      newSched[dayIndex].subjects = [...newSched[dayIndex].subjects, value];
      setLocalSchedule(newSched);
      input.value = '';
    }
  };

  const handleRemoveSubject = (dayIndex: number, subIndex: number) => {
    const newSched = [...localSchedule];
    newSched[dayIndex].subjects = newSched[dayIndex].subjects.filter((_, i) => i !== subIndex);
    setLocalSchedule(newSched);
  };

  const handleSaveAll = () => {
    // 1. Update Profile
    dataService.updateProfile(user.email, {
      semester,
      targetSgpa,
      careerFocus,
      enableDsa
    });

    // 2. Update Schedule
    dataService.updateSchedule(user.email, localSchedule);

    onUpdate();
    
    // Show Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleArchive = () => {
    if (window.confirm("This will archive your current semester data and reset your tracker for a new one. Your projects will remain. Proceed?")) {
      dataService.archiveSemester(user.email);
      onUpdate();
      alert('Semester archived. Welcome to your new semester!');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(user, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-focus-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-4 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Account & Settings</h2>
          <p className="text-text-secondary mt-1">Manage your academic profile and weekly routine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Profile Settings */}
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-6">
              <User className="w-5 h-5 text-accent-primary" />
              Profile Information
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Account Email</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-bg-input border border-border rounded-xl text-text-secondary cursor-not-allowed">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Current Semester</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none transition-all"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                  <GraduationCap className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Target SGPA</label>
                  <input 
                    type="text" 
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none transition-all"
                    value={targetSgpa}
                    onChange={(e) => setTargetSgpa(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">DSA Tracking</label>
                  <button 
                    onClick={() => setEnableDsa(!enableDsa)}
                    className={`w-full h-[50px] border rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                      enableDsa ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-bg-input border-border text-text-secondary'
                    }`}
                  >
                    {enableDsa ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {enableDsa ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Career Focus</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-bg-input border border-border rounded-xl pl-4 pr-10 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none transition-all"
                    placeholder="e.g. Full Stack Developer"
                    value={careerFocus}
                    onChange={(e) => setCareerFocus(e.target.value)}
                  />
                  <Target className="absolute right-4 top-3.5 w-4 h-4 text-text-secondary" />
                </div>
              </div>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-500" />
              Data & Continuity
            </h3>
            
            <div className="space-y-4">
              <button 
                onClick={handleArchive}
                className="w-full flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-sm">Archive Semester</p>
                  <p className="text-xs opacity-80">Start a fresh semester with new goals.</p>
                </div>
                <Archive className="w-5 h-5" />
              </button>

              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-sm">Export Data (JSON)</p>
                  <p className="text-xs opacity-80">Download a backup of your entire history.</p>
                </div>
                <Download className="w-5 h-5" />
              </button>

              {user.archives && user.archives.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Past Semesters</p>
                  <div className="space-y-2">
                    {user.archives.map(archive => (
                      <div key={archive.id} className="flex items-center justify-between p-3 bg-bg-hover rounded-lg text-sm">
                        <span className="font-medium">{archive.semesterName}</span>
                        <span className="text-xs text-text-secondary">{new Date(archive.archivedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Weekly Schedule Editor */}
        <div className="xl:col-span-2">
          <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
            <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-6">
              <Calendar className="w-5 h-5 text-accent-primary" />
              Weekly Academic Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localSchedule.map((dayData, dIdx) => {
                const inputId = `subject-input-${dIdx}`;
                return (
                  <div key={dayData.day} className="bg-bg-input/50 border border-border rounded-xl p-4 flex flex-col">
                    <h4 className="font-bold text-accent-primary mb-3">{dayData.day}</h4>
                    
                    <div className="flex-1 space-y-2 mb-4">
                      {dayData.subjects.length === 0 ? (
                        <p className="text-xs text-text-secondary italic py-2">No subjects scheduled.</p>
                      ) : (
                        dayData.subjects.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between bg-bg-card px-3 py-2 rounded-lg border border-border group">
                            <span className="text-sm font-medium">{sub}</span>
                            <button 
                              onClick={() => handleRemoveSubject(dIdx, sIdx)}
                              className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        id={inputId}
                        type="text" 
                        placeholder="Add subject..."
                        className="flex-1 min-w-0 bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddSubject(dIdx, inputId);
                        }}
                      />
                      <button 
                        onClick={() => handleAddSubject(dIdx, inputId)}
                        className="p-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
         <button 
           onClick={handleSaveAll}
           className="w-full py-4 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold shadow-lg shadow-accent-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
         >
           <Save className="w-5 h-5" />
           Save All Changes
         </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white/20 p-1 rounded-full">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default Account;