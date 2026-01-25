import React, { useState } from 'react';
import { UserData } from '../types';
import { dataService } from '../services/db';
import { Save, Check } from 'lucide-react';

interface SettingsProps {
  user: UserData;
  onUpdate: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const [semester, setSemester] = useState(user.profile.semester);
  const [targetSgpa, setTargetSgpa] = useState(user.profile.targetSgpa);
  const [careerFocus, setCareerFocus] = useState(user.profile.careerFocus);
  const [enableDsa, setEnableDsa] = useState(user.profile.enableDsa ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateProfile(user.email, {
      semester,
      targetSgpa,
      careerFocus,
      enableDsa
    });
    onUpdate();
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Semester Settings</h2>
        <p className="text-text-secondary mt-1">Define your targets and timelines.</p>
      </div>

      {/* Active Goal Card */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200">
           <Save className="w-6 h-6" />
        </div>
        <div>
           <h3 className="font-bold text-lg text-text-primary">Active Goal: {user.profile.semester}</h3>
           <p className="text-text-secondary mt-1">Targeting {user.profile.targetSgpa} SGPA • {user.profile.careerFocus}</p>
           <p className="text-xs text-text-secondary mt-2">Jan 09 - May 09, {currentYear}</p>
        </div>
      </div>

      {/* Update Goals Form */}
      <div className="bg-bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="mb-6">
           <h3 className="text-xl font-bold text-text-primary">Update Goals</h3>
           <p className="text-text-secondary text-sm">Creating a new goal will supersede the current active one.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-text-primary mb-1.5">Semester Name</label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none transition-all"
                 value={semester}
                 onChange={(e) => setSemester(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-text-primary mb-1.5">Target SGPA</label>
               <input 
                 type="text" 
                 required
                 className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none transition-all"
                 value={targetSgpa}
                 onChange={(e) => setTargetSgpa(e.target.value)}
               />
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-text-primary mb-1.5">Primary Skill Track</label>
               <select 
                 className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary outline-none appearance-none cursor-pointer transition-all"
                 value={careerFocus}
                 onChange={(e) => setCareerFocus(e.target.value)}
               >
                 <option>Data Analyst</option>
                 <option>Full Stack Developer</option>
                 <option>Machine Learning Engineer</option>
                 <option>Product Manager</option>
                 <option>DevOps Engineer</option>
                 <option>Cybersecurity</option>
                 <option>Other</option>
               </select>
             </div>
             
             <div className="flex items-end">
               <div 
                 className="w-full p-2 border border-border rounded-lg flex items-center justify-between bg-bg-hover/30 hover:bg-bg-hover/50 transition-colors cursor-pointer select-none h-[46px]" 
                 onClick={() => setEnableDsa(!enableDsa)}
               >
                  <div className="px-2">
                    <span className="block font-medium text-text-primary text-sm">Require DSA?</span>
                    <span className="text-[10px] text-text-secondary block -mt-0.5">Enable DSA tracking module</span>
                  </div>
                  <div className={`w-5 h-5 mr-2 rounded border flex items-center justify-center transition-colors ${enableDsa ? 'bg-blue-600 border-blue-600' : 'border-text-secondary'}`}>
                    {enableDsa && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
               </div>
             </div>
           </div>

           <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                Save Semester Goals
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;