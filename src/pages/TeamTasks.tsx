import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Flag, User, Clock, CheckCircle, Search } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getLocalEmployeeTasks, updateLocalEmployeeTask, getLocalEmployees, type EmployeeTask, type Employee } from '../lib/localDatabase';

interface TeamTasksProps {
  isDemo: boolean;
}

const TeamTasks: React.FC<TeamTasksProps> = ({ isDemo }) => {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    let fetchedTasks: EmployeeTask[] = [];
    let fetchedEmployees: Employee[] = [];

    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const [tasksRes, empRes] = await Promise.all([
          supabase.from('employee_tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('employees').select('*')
        ]);
        if (!tasksRes.error) fetchedTasks = tasksRes.data;
        if (!empRes.error) fetchedEmployees = empRes.data;
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    } else {
      fetchedTasks = getLocalEmployeeTasks();
      fetchedEmployees = getLocalEmployees();
    }

    setTasks(fetchedTasks);
    
    // Create employee lookup map
    const empMap: Record<string, Employee> = {};
    fetchedEmployees.forEach(emp => {
      empMap[emp.id] = emp;
    });
    setEmployees(empMap);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [isDemo]);

  const updateTaskStatus = async (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    if (!isDemo && isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('employee_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task status in database.');
        fetchData(); // revert
      }
    } else {
      updateLocalEmployeeTask(taskId, { status: newStatus });
    }
  };

  const filteredTasks = tasks.filter(task => {
    const q = searchTerm.toLowerCase();
    const empName = employees[task.employee_id]?.name || '';
    return !q || task.title.toLowerCase().includes(q) || empName.toLowerCase().includes(q);
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'hsl(var(--danger))';
      case 'Medium': return 'hsl(var(--primary))';
      case 'Low': return 'hsl(var(--success))';
      default: return 'hsl(var(--muted))';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'Completed') return false;
    return new Date(dueDate) < new Date(new Date().setHours(0,0,0,0));
  };

  const renderColumn = (title: string, status: string, icon: React.ReactNode, bgColor: string, dotColor: string) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);
    
    return (
      <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: bgColor, borderRadius: '12px', border: '1px solid hsl(var(--card-border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            <span style={{ display: 'flex', width: '24px', height: '24px', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', borderRadius: '6px', color: dotColor }}>
              {icon}
            </span>
            {title}
          </div>
          <div style={{ background: 'var(--card)', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, color: dotColor }}>
            {columnTasks.length}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {columnTasks.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'hsl(var(--muted))', fontSize: '13px', border: '2px dashed hsl(var(--card-border))', borderRadius: '12px' }}>
              No tasks
            </div>
          ) : (
            columnTasks.map(task => {
              const overdue = isOverdue(task.due_date, task.status);
              
              return (
                <div key={task.id} className="glass-card" style={{ padding: '16px', borderLeft: `3px solid ${getPriorityColor(task.priority)}`, position: 'relative', overflow: 'hidden' }}>
                  {overdue && (
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '2px 8px', background: 'hsl(var(--danger))', color: 'white', fontSize: '10px', fontWeight: 800, borderBottomLeftRadius: '8px' }}>
                      OVERDUE
                    </div>
                  )}
                  
                  <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'hsl(var(--foreground))', marginBottom: '8px', paddingRight: overdue ? '40px' : '0' }}>
                    {task.title}
                  </h4>
                  
                  {task.description && (
                    <p style={{ fontSize: '13px', color: 'hsl(var(--muted))', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--muted))' }}>
                      <User size={13} />
                      <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {employees[task.employee_id]?.name || 'Unknown Employee'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: overdue ? 'hsl(var(--danger))' : 'hsl(var(--muted))', fontWeight: overdue ? 600 : 400 }}>
                      <Calendar size={13} />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    {status !== 'Pending' && (
                      <button onClick={() => updateTaskStatus(task.id, 'Pending')} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px', height: '28px' }}>
                        Set Pending
                      </button>
                    )}
                    {status !== 'In Progress' && (
                      <button onClick={() => updateTaskStatus(task.id, 'In Progress')} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px', height: '28px', color: 'hsl(var(--primary))' }}>
                        Set In Progress
                      </button>
                    )}
                    {status !== 'Completed' && (
                      <button onClick={() => updateTaskStatus(task.id, 'Completed')} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px', height: '28px', color: 'hsl(var(--success))', background: 'hsl(var(--success) / 0.1)', borderColor: 'transparent' }}>
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.4s ease-out' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--foreground))', marginBottom: '4px' }}>Team Tasks</h2>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '0.95rem' }}>Track and manage employee assignments.</p>
          </div>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))' }} />
          <input
            type="text"
            placeholder="Search tasks or employees..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '40px', borderRadius: '20px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--primary) / 0.3)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px' }}>
          {renderColumn('Pending', 'Pending', <Clock size={14} />, 'hsl(var(--card-border) / 0.3)', 'hsl(var(--muted))')}
          {renderColumn('In Progress', 'In Progress', <Flag size={14} />, 'hsl(var(--primary) / 0.05)', 'hsl(var(--primary))')}
          {renderColumn('Completed', 'Completed', <CheckCircle size={14} />, 'hsl(var(--success) / 0.05)', 'hsl(var(--success))')}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TeamTasks;
