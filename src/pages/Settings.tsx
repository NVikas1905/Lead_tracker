import React from 'react';
import { RotateCcw, AlertTriangle, Send } from 'lucide-react';
import { resetLocalDatabase } from '../lib/localDatabase';

interface SettingsProps {
  onDatabaseUpdate: () => void;
  isDemo: boolean;
  setIsDemo: (val: boolean) => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({
  onDatabaseUpdate,
  isDemo,
  setIsDemo
}) => {
  const handleResetDatabase = () => {
    if (window.confirm('Are you sure you want to restore the simulation database to defaults? All custom enquiries and courses will be overwritten.')) {
      resetLocalDatabase();
      onDatabaseUpdate();
      alert('Local database successfully reset to default state.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      
      {/* Simulation Toggle */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Execution Mode</h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--muted))' }}>
              Toggle between the Client-side AI Simulation and Live Supabase backend.
            </p>
          </div>
          <button 
            onClick={() => setIsDemo(!isDemo)} 
            className={`btn ${isDemo ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isDemo ? 'Switch to Supabase Live' : 'Switch to Local Simulation'}
          </button>
        </div>
      </div>

      {/* Database Operations */}
      <div className="glass-card" style={{ border: '1px solid hsl(var(--danger) / 0.2)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--danger))' }}>
          <AlertTriangle size={18} />
          Danger Zone
        </h3>
        <p style={{ fontSize: '13px', color: 'hsl(var(--muted))', marginBottom: '16px' }}>
          Operations to manage the local database. These will clear your current entries and reset them to seed defaults.
        </p>
        <button 
          onClick={handleResetDatabase} 
          className="btn btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCcw size={16} />
          Reset Simulation Database
        </button>
      </div>


    </div>
  );
};
export default SettingsPage;
