import React, { useState } from 'react';
import { LayoutDashboard, Bell, BookOpen, FolderEdit, Settings, Sun, Moon, LogOut, StickyNote, ChevronDown, ChevronRight, Activity, Users, ClipboardList } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemo: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  pendingCount?: number;
  pendingNotesCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDemo,
  theme,
  toggleTheme,
  pendingCount = 0,
  pendingNotesCount = 0,
  onLogout
}) => {
  const [isPendingOpen, setIsPendingOpen] = useState(
    activeTab === 'pending-tasks' || activeTab === 'pending-notes'
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'pending-group',
      label: 'Pending',
      icon: Bell,
      isDropdown: true,
      badge: pendingCount + pendingNotesCount,
      subItems: [
        { id: 'pending-tasks', label: 'Pending Tasks', badge: pendingCount, icon: Activity },
        { id: 'pending-notes', label: 'Pending Notes', badge: pendingNotesCount, icon: StickyNote }
      ]
    },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'manage-courses', label: 'Create Course', icon: FolderEdit },
    { id: 'notes', label: 'Recent Notes', icon: StickyNote },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'team-tasks', label: 'Team Tasks', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="sidebar">
      <div className="brand" style={{ padding: '12px 8px', display: 'flex', justifyContent: 'center' }}>
        <img
          src="/global_minds_logo.png"
          alt="Global Minds Logo"
          style={{
            width: '80px',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>

      <nav className="nav-links">
        {menuItems.map(item => {
          if (item.isDropdown) {
            const isAnySubActive = item.subItems?.some(sub => sub.id === activeTab);

            return (
              <div key={item.id}>
                <li
                  className={`nav-item ${isAnySubActive && !isPendingOpen ? 'active' : ''}`}
                >
                  <button
                    onClick={() => setIsPendingOpen(!isPendingOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isAnySubActive ? 'hsl(var(--primary))' : 'inherit',
                      padding: '12px',
                      fontFamily: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: isAnySubActive ? 600 : 500 }}>
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.badge > 0 && !isPendingOpen && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: 'hsl(var(--danger))',
                            color: '#fff',
                            borderRadius: '10px',
                            padding: '1px 7px'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isPendingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                </li>

                {isPendingOpen && (
                  <div style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {item.subItems?.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;
                      return (
                        <li key={sub.id} className={`nav-item ${isSubActive ? 'active' : ''}`}>
                          <a
                            href={`#${sub.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab(sub.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '13.5px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <SubIcon size={16} />
                              <span>{sub.label}</span>
                            </div>
                            {sub.badge && sub.badge > 0 ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: 'hsl(var(--warning))', // Different color for sub-badges
                                  color: '#fff',
                                  borderRadius: '10px',
                                  padding: '1px 7px'
                                }}
                              >
                                {sub.badge}
                              </span>
                            ) : null}
                          </a>
                        </li>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'hsl(var(--danger))',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 7px'
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', marginTop: '8px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
