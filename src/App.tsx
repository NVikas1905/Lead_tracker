import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PendingTasks from './pages/PendingTasks';
import Courses from './pages/Courses';
import ManageCourses from './pages/ManageCourses';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Notes from './pages/Notes';
import PendingNotes from './pages/PendingNotes';
import Employees from './pages/Employees';
import TeamTasks from './pages/TeamTasks';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { getLocalEnquiries, getLocalNotes } from './lib/localDatabase';

export const App: React.FC = () => {
  // Authentication State (defaults to false if not logged in)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingNotesCount, setPendingNotesCount] = useState<number>(0);
  
  // Decide default mode: if Supabase config is missing, fall back to offline simulation
  const [isDemo, setIsDemo] = useState<boolean>(!isSupabaseConfigured());

  // Theme control: read from localStorage or default to dark
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch count of pending tasks across application
  const updatePendingCount = async () => {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data: enqs } = await supabase.from('enquiries').select('interested, follow_up_done, can_follow_up');
        if (enqs) {
          const count = enqs.filter(e => e.interested === null || e.follow_up_done === null || e.can_follow_up === null).length;
          setPendingCount(count);
        }
        
        const { data: nts, error: notesError } = await supabase.from('notes').select('reminderDate, is_completed');
        if (!notesError && nts) {
          const nCount = nts.filter(n => n.reminderDate && !n.is_completed).length;
          setPendingNotesCount(nCount);
        } else {
          // Fallback to local storage
          const localNts = getLocalNotes();
          const nCount = localNts.filter(n => n.reminderDate && !n.is_completed).length;
          setPendingNotesCount(nCount);
        }
      } catch (err) {
        console.error('Error fetching pending counts:', err);
      }
    } else {
      const enqs = getLocalEnquiries();
      const count = enqs.filter(e => e.interested === null || e.follow_up_done === null || e.can_follow_up === null).length;
      setPendingCount(count);
      
      const nts = getLocalNotes();
      const nCount = nts.filter(n => n.reminderDate && !n.is_completed).length;
      setPendingNotesCount(nCount);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      updatePendingCount();
    }
  }, [isDemo, refreshTrigger, isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDatabaseUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // Keep Demo mode synced with env key availability if key is loaded/unloaded
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsDemo(true);
    }
  }, [refreshTrigger]);

  // IF NOT AUTHENTICATED: Show ONLY the Login screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
            onUpdate={handleDatabaseUpdate}
          />
        );
      case 'pending-tasks':
        return (
          <PendingTasks 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
            onUpdate={handleDatabaseUpdate}
          />
        );
      case 'pending-notes':
        return (
          <PendingNotes 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
            onUpdate={handleDatabaseUpdate}
          />
        );
      case 'courses':
        return (
          <Courses 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'manage-courses':
        return (
          <ManageCourses 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
            onUpdate={handleDatabaseUpdate}
          />
        );
      case 'notes':
        return <Notes />;
      case 'employees':
        return <Employees isDemo={isDemo} />;
      case 'team-tasks':
        return <TeamTasks isDemo={isDemo} />;
      case 'settings':
        return (
          <SettingsPage 
            isDemo={isDemo}
            setIsDemo={setIsDemo}
            onDatabaseUpdate={handleDatabaseUpdate}
          />
        );
      default:
        return (
          <Dashboard 
            isDemo={isDemo}
            refreshTrigger={refreshTrigger}
            onUpdate={handleDatabaseUpdate}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Background design elements */}
      <div className="bg-gradient-mesh" />

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemo={isDemo}
        theme={theme}
        toggleTheme={toggleTheme}
        pendingCount={pendingCount}
        pendingNotesCount={pendingNotesCount}
        onLogout={handleLogout}
      />

      {/* Main Administrative Portal Viewport */}
      <main className="main-content">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
        />
        
        {/* Banner indicating simulation state */}
        {isDemo && activeTab !== 'settings' && (
          <div className="demo-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))', animation: 'pulse-red 1.5s infinite' }} />
              <span>
                <strong>Sandbox Offline Mode Active:</strong> You are exploring using local browser memory. Configure keys on the Settings page to link live Supabase functions.
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('settings')} 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}
            >
              Configure Keys
            </button>
          </div>
        )}

        <div style={{ marginTop: '8px' }}>
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};

export default App;
