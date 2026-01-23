import React, { useState, useMemo } from 'react';
import { UserData, Goal } from '../types';
import { dataService } from '../services/db';
import { Plus, CheckCircle2, Circle, X, Trash2, CalendarRange, BookOpen, Laptop, Code, Trophy, Target, AlertTriangle, Check } from 'lucide-react';

interface GoalsProps {
  user: UserData;
  onUpdate: () => void;
}

const Goals: React.FC<GoalsProps> = ({ user, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Plan Your Week State
  const [planWeekNum, setPlanWeekNum] = useState('');
  const [academicInput, setAcademicInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [dsaInput, setDsaInput] = useState('');

  // Helper to get current week details
  const getWeekDetails = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDays = (today.getTime() - startOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    
    // Calculate range
    const curr = new Date(); 
    const first = curr.getDate() - curr.getDay(); // Sunday
    const last = first + 6; // Saturday

    const firstday = new Date(curr.setDate(first));
    const lastday = new Date(curr.setDate(last));

    const rangeString = `${firstday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return {
      id: `${today.getFullYear()}-W${weekNum}`,
      number: weekNum,
      range: rangeString
    };
  };

  const currentWeek = getWeekDetails();
  const currentGoals = user.goals.filter(g => g.weekId === currentWeek.id);

  // Stats Calculation
  const stats = useMemo(() => {
    const total = currentGoals.length;
    const completed = currentGoals.filter(g => g.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  }, [currentGoals]);

  const getCategoryStats = (category: Goal['category']) => {
    const goals = currentGoals.filter(g => g.category === category);
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { goals, total, completed, percentage };
  };

  const categories = {
    academics: getCategoryStats('academics'),
    skills: getCategoryStats('skills'),
    dsa: getCategoryStats('dsa')
  };

  const handleOpenModal = () => {
    setPlanWeekNum(currentWeek.number.toString());
    setAcademicInput('');
    setSkillInput('');
    setDsaInput('');
    setIsModalOpen(true);
  };

  const showToastMessage = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    
    const year = new Date().getFullYear();
    const cleanWeekNum = planWeekNum.trim();
    if (!cleanWeekNum) return;

    const targetWeekId = `${year}-W${cleanWeekNum}`;

    const createGoalsFromText = (text: string, category: Goal['category']) => {
      if (!text.trim()) return;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      lines.forEach(line => {
        const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const goal: Goal = {
          id: uniqueId,
          text: line,
          completed: false,
          weekId: targetWeekId,
          category: category
        };
        dataService.addGoal(user.email, goal);
      });
    };

    createGoalsFromText(academicInput, 'academics');
    createGoalsFromText(skillInput, 'skills');
    createGoalsFromText(dsaInput, 'dsa');

    onUpdate();
    setIsModalOpen(false);
    showToastMessage('Goals added successfully!');
  };

  const toggleGoal = (id: string) => {
    dataService.toggleGoal(user.email, id);
    onUpdate();
  };
  
  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dataService.deleteGoal(user.email, deleteId);
      onUpdate();
      showToastMessage('Goal deleted.');
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 relative">
       {/* Header Section */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">Weekly Focus</h2>
            <div className="flex items-center gap-3 mt-2 text-text-secondary">
               <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card border border-border text-sm font-medium shadow-sm">
                  <CalendarRange className="w-4 h-4" />
                  Week {currentWeek.number}
               </span>
               <span className="text-sm font-medium">{currentWeek.range}</span>
            </div>
          </div>
          
          <button
            onClick={handleOpenModal}
            className="group flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-accent-primary/25 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Plan Goals
          </button>
       </div>

       {/* Progress Overview Card */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Main Progress */}
         <div className="md:col-span-2 bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] dark:from-[#1e1b4b] dark:to-[#020617] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
            <div className="absolute top-0 right-0 p-32 bg-accent-primary/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
               <div>
                  <h3 className="text-lg font-medium text-indigo-200 mb-1">Overall Progress</h3>
                  <div className="text-4xl font-bold mb-2">{stats.percentage}% <span className="text-sm font-normal text-indigo-300">completed</span></div>
                  <p className="text-sm text-indigo-200/80">{stats.completed} of {stats.total} goals achieved</p>
               </div>
               <div className="h-24 w-24 relative flex items-center justify-center shrink-0">
                  <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 96 96">
                    <circle className="text-indigo-950/50" strokeWidth="8" stroke="currentColor" fill="transparent" r="36" cx="48" cy="48" />
                    <circle 
                      className="text-accent-primary transition-all duration-1000 ease-out" 
                      strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 36} 
                      strokeDashoffset={(2 * Math.PI * 36) - (stats.percentage / 100) * (2 * Math.PI * 36)} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="36" cx="48" cy="48" 
                    />
                  </svg>
                  {stats.percentage === 100 ? (
                    <Trophy className="absolute w-8 h-8 text-yellow-400 drop-shadow-lg" />
                  ) : (
                    <Target className="absolute w-8 h-8 text-indigo-300 drop-shadow-lg" />
                  )}
               </div>
            </div>
            
            <div className="mt-6 w-full bg-black/20 h-2 rounded-full overflow-hidden">
               <div 
                  className="bg-accent-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${stats.percentage}%` }}
               ></div>
            </div>
         </div>

         {/* Mini Stats */}
         <div className="grid grid-cols-2 md:grid-cols-1 md:grid-rows-2 gap-4">
            <div className="bg-bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
               <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-2xl font-bold text-text-primary">{stats.completed}</div>
                  <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">Completed</div>
               </div>
            </div>
            <div className="bg-bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
               <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Target className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-2xl font-bold text-text-primary">{stats.total - stats.completed}</div>
                  <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">Remaining</div>
               </div>
            </div>
         </div>
       </div>

       {/* Kanban Columns */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GoalColumn 
             title="Academics" 
             icon={<BookOpen className="w-5 h-5" />} 
             colorClass="text-blue-500 bg-blue-500"
             bgClass="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
             data={categories.academics} 
             onToggle={toggleGoal} 
             onDelete={initiateDelete} 
          />
          <GoalColumn 
             title="Skills" 
             icon={<Laptop className="w-5 h-5" />} 
             colorClass="text-purple-500 bg-purple-500"
             bgClass="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30"
             data={categories.skills} 
             onToggle={toggleGoal} 
             onDelete={initiateDelete} 
          />
          <GoalColumn 
             title="DSA" 
             icon={<Code className="w-5 h-5" />} 
             colorClass="text-orange-500 bg-orange-500"
             bgClass="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30"
             data={categories.dsa} 
             onToggle={toggleGoal} 
             onDelete={initiateDelete} 
          />
       </div>

       {/* Plan Modal - Bottom Sheet on Mobile */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
           {/* Modal Content */}
           <div className="bg-bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border-t sm:border border-border transform transition-all flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in-0">
             
             {/* Mobile Drag Handle */}
             <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-border/60"></div>
             </div>

             <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-bg-secondary/50 rounded-t-2xl">
               <div>
                 <h3 className="text-xl font-bold text-text-primary">Plan Your Week</h3>
                 <p className="text-sm text-text-secondary mt-1">Set clear targets for Week {planWeekNum}</p>
               </div>
               <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-bg-hover rounded-lg active:scale-95"
               >
                 <X className="w-6 h-6 sm:w-5 sm:h-5" />
               </button>
             </div>
             
             <form onSubmit={handleSavePlan} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-safe">
               <div>
                 <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wide">Week Number</label>
                 <input
                   type="text"
                   required
                   inputMode="numeric"
                   className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                   value={planWeekNum}
                   onChange={e => setPlanWeekNum(e.target.value)}
                 />
               </div>

               <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                       <BookOpen className="w-4 h-4" />
                       <label className="text-xs font-bold uppercase tracking-wide">Academic Goals</label>
                    </div>
                    <textarea
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-text-secondary/50 min-h-[80px]"
                      placeholder="• Complete Chapter 5&#10;• Submit Assignment 2"
                      value={academicInput}
                      onChange={e => setAcademicInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                       <Laptop className="w-4 h-4" />
                       <label className="text-xs font-bold uppercase tracking-wide">Skill Goals</label>
                    </div>
                    <textarea
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none placeholder-text-secondary/50 min-h-[80px]"
                      placeholder="• Build Login Component&#10;• Watch React Tutorial"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 text-orange-500">
                       <Code className="w-4 h-4" />
                       <label className="text-xs font-bold uppercase tracking-wide">DSA Goals</label>
                    </div>
                    <textarea
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none placeholder-text-secondary/50 min-h-[80px]"
                      placeholder="• Solve 5 DP Problems&#10;• Revise Graph Theory"
                      value={dsaInput}
                      onChange={e => setDsaInput(e.target.value)}
                    />
                  </div>
               </div>

               <div className="pt-2">
                 <button
                   type="submit"
                   className="w-full py-4 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-accent-primary/20 active:scale-[0.98]"
                 >
                   Save Weekly Plan
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Delete Goal?</h3>
                <p className="text-text-secondary text-sm">Are you sure you want to delete this goal? This action cannot be undone.</p>
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
          <div className="p-1 rounded-full bg-green-100 text-green-600">
             <Check className="w-4 h-4" />
          </div>
          <span className="font-medium text-text-primary text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// Helper Component for Columns
interface GoalColumnProps {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  data: {
    goals: Goal[];
    total: number;
    completed: number;
    percentage: number;
  };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const GoalColumn: React.FC<GoalColumnProps> = ({ title, icon, colorClass, bgClass, data, onToggle, onDelete }) => {
   const textColor = colorClass.split(' ')[0];
   const bgColor = colorClass.split(' ')[1];

   return (
      <div className={`rounded-2xl border flex flex-col h-full ${bgClass} transition-colors duration-300`}>
         <div className="p-5 border-b border-gray-200/10">
            <div className="flex items-center justify-between mb-3">
               <div className={`flex items-center gap-2 font-bold ${textColor}`}>
                  {icon}
                  {title}
               </div>
               <span className="text-xs font-medium px-2 py-1 rounded-md bg-bg-card text-text-secondary border border-border">
                  {data.completed}/{data.total}
               </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
               <div 
                  className={`h-full rounded-full transition-all duration-500 ${bgColor}`} 
                  style={{ width: `${data.percentage}%` }}
               ></div>
            </div>
         </div>

         <div className="p-4 flex-1 space-y-3">
            {data.goals.length === 0 ? (
               <div className="h-32 flex flex-col items-center justify-center text-text-secondary/50 border-2 border-dashed border-border/50 rounded-xl bg-bg-card/30">
                  <p className="text-sm">No goals set</p>
               </div>
            ) : (
               data.goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onToggle={onToggle} onDelete={onDelete} />
               ))
            )}
         </div>
      </div>
   );
};

interface GoalCardProps {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onToggle, onDelete }) => {
  return (
    <div className={`group relative p-4 rounded-xl border transition-all duration-200 shadow-sm ${
        goal.completed 
        ? 'bg-bg-card/50 border-border opacity-60' 
        : 'bg-bg-card border-border hover:border-accent-primary/30 hover:shadow-md'
    }`}>
      <div className="flex items-start gap-3">
         <button 
           onClick={() => onToggle(goal.id)}
           className={`flex-shrink-0 mt-0.5 transition-colors ${
             goal.completed ? 'text-accent-secondary' : 'text-text-secondary hover:text-text-primary'
           }`}
         >
            {goal.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
         </button>
         <div className="flex-1 min-w-0">
             <p className={`text-sm font-medium leading-relaxed break-words ${
                 goal.completed ? 'text-text-secondary line-through decoration-text-secondary/50' : 'text-text-primary'
             }`}>
               {goal.text}
             </p>
         </div>
      </div>
      
      <button 
        onClick={() => onDelete(goal.id)}
        className="absolute top-2 right-2 p-1.5 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
        title="Delete Goal"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Goals;