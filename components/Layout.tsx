
import React from 'react';
import { LayoutDashboard, Calendar, CheckSquare, Activity, LogOut, Code, FolderGit2, Moon, Sun, GraduationCap, User, Mic2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userEmail: string;
  isDark: boolean;
  toggleTheme: () => void;
  enableDsa?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout, 
  userEmail,
  isDark,
  toggleTheme,
  enableDsa = true
}) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'Tracker', icon: Calendar },
    { id: 'life', label: 'Life', icon: Activity },
    { id: 'goals', label: 'Goals', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'speaking', label: 'Speaking Lab', icon: Mic2 },
    { id: 'dsa', label: 'DSA', icon: Code, hidden: !enableDsa },
    { id: 'account', label: 'Account', icon: User },
  ];

  const navItems = allNavItems.filter(item => !item.hidden);

  return (
    <div className="flex h-screen h-[100dvh] bg-bg-primary flex-col md:flex-row overflow-hidden text-text-primary transition-colors duration-300">
      <aside className="hidden md:flex flex-col w-72 bg-bg-secondary border-r border-border shadow-xl transition-colors duration-300 z-20">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 text-accent-primary">
             <GraduationCap className="w-10 h-10" />
             <div className="flex flex-col">
                <span className="text-xl font-bold leading-none tracking-tight">Student</span>
                <span className="text-xl font-bold leading-none tracking-tight">Focus</span>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-4 py-3.5 text-sm rounded-xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-accent-primary text-white font-bold shadow-lg shadow-accent-primary/40 scale-[1.02]'
                  : 'text-text-secondary font-medium hover:bg-bg-hover hover:text-text-primary hover:translate-x-1'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                  activeTab === item.id ? 'text-white' : 'text-text-secondary group-hover:text-accent-primary'
                }`} 
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 pt-2 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
               <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-text-primary truncate" title={userEmail}>{userEmail.split('@')[0]}</p>
               <button onClick={onLogout} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-400 transition-colors mt-0.5 font-medium">
                  <LogOut className="w-3 h-3" /> Sign Out
               </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 transition-colors hover:bg-accent-primary/10">
             <h4 className="text-sm font-bold text-text-primary mb-1">Keep Going!</h4>
             <p className="text-xs text-text-secondary italic">"Consistency is the scarcest resource."</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-bg-secondary border-b border-border p-4 pt-safe flex justify-between items-center z-10 transition-colors duration-300 shadow-sm">
           <div className="flex items-center gap-2 md:hidden">
             <GraduationCap className="w-6 h-6 text-accent-primary" />
             <h1 className="text-lg font-bold text-accent-primary">StudentFocus</h1>
           </div>
           
           <div className="hidden md:block text-sm text-text-secondary font-medium pl-4">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </div>

           <div className="flex items-center gap-3 ml-auto">
             <button 
               onClick={toggleTheme}
               className="flex items-center justify-center p-2 rounded-full border border-border bg-bg-primary text-text-secondary hover:text-accent-primary hover:border-accent-primary hover:shadow-md transition-all duration-200 active:scale-90"
               title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
               aria-label="Toggle Theme"
             >
               {isDark ? (
                 <Sun className="w-5 h-5" />
               ) : (
                 <Moon className="w-5 h-5" />
               )}
             </button>

             <button 
                onClick={onLogout} 
                className="md:hidden p-2 text-text-secondary hover:text-red-400 transition-colors active:scale-90"
                aria-label="Sign Out"
             >
               <LogOut className="w-6 h-6" />
             </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-bg-primary transition-colors duration-300 scroll-smooth p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8">
          <div className="max-w-6xl mx-auto min-h-full">
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-bg-secondary border-t border-border flex justify-between px-2 pb-safe pt-2 z-30 transition-colors duration-300 overflow-x-auto gap-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg min-w-[60px] flex-1 transition-colors duration-200 active:bg-bg-hover ${
                activeTab === item.id ? 'text-accent-primary' : 'text-text-secondary'
              }`}
              aria-label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-1 truncate max-w-[64px] ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
