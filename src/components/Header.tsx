import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Bell } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTitleDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Admin Hub',
          subtitle: 'Type commands below to add, update, search, or delete enquiries.'
        };
      case 'pending-tasks':
        return {
          title: 'Activity Center',
          subtitle: 'View and manage all lead follow-ups organized by alert due date.'
        };
      case 'courses':
        return {
          title: 'Course Library',
          subtitle: 'Browse all available offering categories, courses, and fees.'
        };
      case 'manage-courses':
        return {
          title: 'Course Management',
          subtitle: 'Create and modify categories, courses, descriptions, and pricing structure.'
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Configure your Supabase backend and Gemini API keys.'
        };
      default:
        return {
          title: 'Enquiry Tracker',
          subtitle: 'Administrative Portal'
        };
    }
  };

  const { title, subtitle } = getTitleDetails();

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="header">
      <div className="header-title-section">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Bell Icon Notification Button */}
        <button
          onClick={() => setActiveTab('pending-tasks')}
          className="glass-card"
          title="View Pending Tasks & Alert Days"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            position: 'relative',
            cursor: 'pointer',
            border: activeTab === 'pending-tasks' ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--card-border))',
            backgroundColor: activeTab === 'pending-tasks' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
            transition: 'all 0.2s ease',
            padding: 0
          }}
        >
          <Bell size={18} style={{ color: activeTab === 'pending-tasks' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }} />
          {pendingCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'hsl(var(--danger))',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                border: '2px solid hsl(var(--background))'
              }}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>

        {/* Real-time Clock Card */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'hsl(var(--foreground))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid hsl(var(--card-border))', paddingRight: '12px' }}>
            <Calendar size={14} className="text-primary" style={{ color: 'hsl(var(--primary))' }} />
            <span>{formattedDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} className="text-accent" style={{ color: 'hsl(var(--accent))' }} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formattedTime}</span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
