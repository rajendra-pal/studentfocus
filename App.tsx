
import React, { useState, useEffect } from 'react';
import { authService } from './services/db';
import { UserData } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import Goals from './components/Goals';
import LifeCalendar from './components/LifeCalendar';
import DSATracker from './components/DSATracker';
import Projects from './components/Projects';
import Account from './components/Account';

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Initial Load - Safe Persistence Check
  useEffect(() => {
    const loadedUser = authService.getCurrentUser();
    if (loadedUser) {
      setUser(loadedUser);
    }
    setLoading(false);
  }, [refreshKey]);

  const handleLogin = (loggedInUser: UserData) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleDataUpdate = () => {
    const updated = authService.getCurrentUser();
    if (updated) {
        setUser(updated);
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleOnboardingComplete = () => {
    handleDataUpdate();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-bg-primary text-accent-primary">Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Check the persistence flag strictly
  if (!user.hasCompletedSetup) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'tracker':
        return <Tracker user={user} onUpdate={handleDataUpdate} />;
      case 'projects': 
        return <Projects user={user} onUpdate={handleDataUpdate} />;
      case 'dsa': 
        return <DSATracker user={user} onUpdate={handleDataUpdate} />;
      case 'goals':
        return <Goals user={user} onUpdate={handleDataUpdate} />;
      case 'life':
        return <LifeCalendar logs={user.logs} />;
      case 'account':
        return <Account user={user} onUpdate={handleDataUpdate} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onLogout={handleLogout}
      userEmail={user.email}
      isDark={isDark}
      toggleTheme={toggleTheme}
      enableDsa={user.profile.enableDsa ?? true}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
