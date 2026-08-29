import React, { useState, useEffect } from 'react';
import {
  Bell,
  CloudLightning,
  CheckCircle,
  Edit,
  X,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CommandBox from '../components/CommandBox';
import EnquiryCard from '../components/EnquiryCard';
import TerminalLog from '../components/TerminalLog';
import {
  getLocalEnquiries,
  getLocalCourses,
  getLocalCategories,
  updateLocalEnquiry
} from '../lib/localDatabase';
import type { Enquiry, Course, Category } from '../lib/localDatabase';
import { callAssistant } from '../lib/assistant';
import type { AssistantResponse } from '../lib/assistant';
import type { TerminalLine } from '../lib/geminiSim';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface DashboardProps {
  isDemo: boolean;
  refreshTrigger: number;
  onUpdate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isDemo,
  refreshTrigger,
  onUpdate
}) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<TerminalLine[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastReplySuccess, setLastReplySuccess] = useState<boolean>(true);

  // Edit Modal State
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // User input for dynamic reminder reschedule interval (in days)
  const [reminderDays, setReminderDays] = useState<number>(2);

  const fetchDashboardData = async () => {
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data: cats } = await supabase.from('categories').select('*');
        const { data: crs } = await supabase.from('courses').select('*');
        const { data: enqs } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });

        if (cats) setCategories(cats);
        if (crs) setCourses(crs);
        if (enqs) setEnquiries(enqs);
      } catch (err) {
        console.error('Supabase query failed, using local storage:', err);
        loadLocalData();
      }
    } else {
      loadLocalData();
    }
  };

  const loadLocalData = () => {
    setCategories(getLocalCategories());
    setCourses(getLocalCourses());

    // Sort enquiries so newest is first
    const enqs = getLocalEnquiries();
    const sorted = [...enqs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEnquiries(sorted);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isDemo, refreshTrigger]);

  // Handle Command Submission
  const handleCommandSubmit = async (command: string) => {
    setIsLoading(true);
    setLastReply(null);

    // Dispatch to assistant handler
    const response: AssistantResponse = await callAssistant(command, isDemo);

    // Merge new logs with existing logs
    setLogs(prev => [...prev, ...response.logs]);
    setLastReply(response.reply);
    setLastReplySuccess(response.success);
    setIsLoading(false);

    // If successful, reload data to update lists
    if (response.success) {
      fetchDashboardData();
      onUpdate();
    }
  };

  // Simulating the Supabase Cron Job Reminder checker
  const handleTriggerReminders = () => {
    const now = new Date();
    const dueEnquiries = enquiries.filter(e => {
      const isUnresolved = e.interested === null || e.follow_up_done === null || e.can_follow_up === null;
      const isDue = new Date(e.next_reminder_at) <= now;
      return isUnresolved && isDue;
    });

    const newLogLine = (content: string, type: 'system' | 'success' | 'error' = 'system') => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      prefix: type,
      content
    });

    setLogs(prev => [...prev, newLogLine('Cron Job check-reminders triggered.', 'system')]);

    if (dueEnquiries.length === 0) {
      setLogs(prev => [...prev, newLogLine('No unresolved enquiries are due for reminders at this time.', 'system')]);
      alert('All reminders are up-to-date! No enquiries are due for reminders.');
      return;
    }

    // Reschedule reminder times in DB using user input interval (reminderDays)
    dueEnquiries.forEach(e => {
      const newReminder = new Date();
      newReminder.setDate(now.getDate() + reminderDays); // delay by user input days

      if (!isDemo && isSupabaseConfigured() && supabase) {
        supabase.from('enquiries').update({
          next_reminder_at: newReminder.toISOString(),
          last_reminded_at: now.toISOString(),
          updated_at: now.toISOString()
        }).eq('id', e.id);
      } else {
        updateLocalEnquiry(e.id, {
          next_reminder_at: newReminder.toISOString(),
          last_reminded_at: now.toISOString()
        });
      }
    });

    setLogs(prev => [...prev, newLogLine(`Cron Job completed: Rescheduled ${dueEnquiries.length} reminders (+${reminderDays} days).`, 'success')]);

    // Refresh
    setTimeout(() => {
      fetchDashboardData();
    }, 500);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;

    setIsSavingEdit(true);

    try {
      if (!isDemo && isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('enquiries')
          .update({
            contact_name: editingEnquiry.contact_name,
            contact_phone: editingEnquiry.contact_phone || null,
            course_id: editingEnquiry.course_id,
            category_id: editingEnquiry.category_id,
            fee_shared: editingEnquiry.fee_shared,
            notes: editingEnquiry.notes || null,
            interested: editingEnquiry.interested,
            follow_up_done: editingEnquiry.follow_up_done,
            can_follow_up: editingEnquiry.can_follow_up,
            next_reminder_at: editingEnquiry.next_reminder_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEnquiry.id);

        if (error) throw error;
      } else {
        updateLocalEnquiry(editingEnquiry.id, {
          contact_name: editingEnquiry.contact_name,
          contact_phone: editingEnquiry.contact_phone || '',
          course_id: editingEnquiry.course_id,
          category_id: editingEnquiry.category_id,
          fee_shared: editingEnquiry.fee_shared,
          notes: editingEnquiry.notes || '',
          interested: editingEnquiry.interested,
          follow_up_done: editingEnquiry.follow_up_done,
          can_follow_up: editingEnquiry.can_follow_up,
          next_reminder_at: editingEnquiry.next_reminder_at
        });
      }

      setEditingEnquiry(null);
      fetchDashboardData();
      onUpdate();
    } catch (err: any) {
      alert(`Failed to save changes: ${err.message || err}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Helper to count active/unresolved enquiries
  const unresolvedEnquiries = enquiries.filter(e =>
    e.interested === null || e.follow_up_done === null || e.can_follow_up === null
  );

  // Helper to count due reminders
  const dueReminderCount = enquiries.filter(e => {
    const isUnresolved = e.interested === null || e.follow_up_done === null || e.can_follow_up === null;
    return isUnresolved && new Date(e.next_reminder_at) <= new Date();
  }).length;

  const totalPages = Math.ceil(enquiries.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedEnquiries = enquiries.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Main split grid: CLI Console & Cron scheduler controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* CLI input & console logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CommandBox
              onSubmit={handleCommandSubmit}
              isLoading={isLoading}
              lastReply={lastReply}
              lastReplySuccess={lastReplySuccess}
            />
            <TerminalLog
              logs={logs}
              onClear={() => setLogs([])}
            />
          </div>

          {/* Trigger Cron Reminder panel */}
          <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <CloudLightning size={20} style={{ color: 'hsl(var(--primary))' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cron Job Simulator</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--muted))', lineHeight: 1.4 }}>
                Supabase uses a PG Cron trigger to check reminders at interval. Clicking the button scans open leads and postpones due reminders by the specified interval.
              </p>

              <div
                style={{
                  margin: '16px 0',
                  padding: '12px',
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--card-border))',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Unresolved Leads:</span>
                  <span style={{ fontWeight: 'bold' }}>{unresolvedEnquiries.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Reminders Due:</span>
                  <span style={{ fontWeight: 'bold', color: dueReminderCount > 0 ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
                    {dueReminderCount}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '10px', marginTop: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted))' }}>
                    Reschedule Interval (Days):
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Enter days (e.g. 2, 5, 7)"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerReminders}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Bell size={16} /> Run Reminder Cron Job (+{reminderDays} Days)
            </button>
          </div>

        </div>
      </div>

      {/* Leads board requiring action */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Leads Needing Action ({unresolvedEnquiries.length})</h2>
          <span style={{ fontSize: '12px', color: 'hsl(var(--muted))' }}>
            System continues reminders until all three checklist fields are non-null.
          </span>
        </div>

        {unresolvedEnquiries.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '36px', color: 'hsl(var(--muted))' }}>
            <CheckCircle size={32} style={{ color: 'hsl(var(--success))', display: 'block', margin: '0 auto 12px' }} />
            All logged enquiries are fully resolved. No action items remaining!
          </div>
        ) : (
          <div className="enquiry-grid">
            {unresolvedEnquiries.map(enq => (
              <EnquiryCard
                key={enq.id}
                enquiry={enq}
                courses={courses}
                categories={categories}
                onEdit={(targetEnq) => setEditingEnquiry(targetEnq)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Database table showing everything */}
      <div className="glass-card">
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Full Leads Ledger</h2>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Course Interest</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Fee shared</th>
                <th>Next Alert</th>
                <th>Resolution Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnquiries.map(e => {
                const course = courses.find(c => c.id === e.course_id);
                const category = categories.find(c => c.id === e.category_id);
                const isRes = e.interested !== null && e.follow_up_done !== null && e.can_follow_up !== null;

                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.contact_name}</td>
                    <td>{course?.name || 'N/A'}</td>
                    <td>
                      <span className={`badge ${category?.name === 'Technologies' ? 'badge-tech' : 'badge-academy'}`}>
                        {category?.name || 'N/A'}
                      </span>
                    </td>
                    <td>{e.contact_phone || '-'}</td>
                    <td>
                      <span style={{ color: e.fee_shared ? 'hsl(var(--success))' : 'hsl(var(--muted))', fontWeight: 600 }}>
                        {e.fee_shared ? 'Shared' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'hsl(var(--muted))' }}>
                      {isRes ? 'Resolved' : new Date(e.next_reminder_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {/* Render miniature badges */}
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: e.interested === true ? 'hsl(var(--success))' : e.interested === false ? 'hsl(var(--danger))' : 'hsl(var(--warning))'
                          }}
                          title={`Interested: ${e.interested === null ? 'Pending' : e.interested}`}
                        />
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: e.follow_up_done === true ? 'hsl(var(--success))' : e.follow_up_done === false ? 'hsl(var(--danger))' : 'hsl(var(--warning))'
                          }}
                          title={`Follow Up: ${e.follow_up_done === null ? 'Pending' : e.follow_up_done}`}
                        />
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: e.can_follow_up === true ? 'hsl(var(--success))' : e.can_follow_up === false ? 'hsl(var(--danger))' : 'hsl(var(--warning))'
                          }}
                          title={`Reachable: ${e.can_follow_up === null ? 'Pending' : e.can_follow_up}`}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setEditingEnquiry(e)}
                        className="btn btn-ghost btn-icon"
                        style={{ width: '32px', height: '32px', padding: 0 }}
                        title="Edit Lead Details"
                      >
                        <Edit size={16} style={{ color: 'hsl(var(--primary))' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'hsl(var(--muted))' }}>
                    No leads recorded. Use the CLI input to log a new enquiry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid hsl(var(--card-border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="select-rows-per-page" style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
              Rows per page
            </label>
            <select
              id="select-rows-per-page"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid hsl(var(--card-border))',
                background: 'hsl(var(--background))',
                fontSize: '13px',
                color: 'hsl(var(--foreground))',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-icon"
                style={{ width: '32px', height: '32px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', border: '1px solid hsl(var(--card-border))' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-icon"
                style={{ width: '32px', height: '32px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', border: '1px solid hsl(var(--card-border))' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Enquiry Modal */}
      {editingEnquiry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'hsl(var(--card))',
              borderRadius: '12px',
              border: '1px solid hsl(var(--card-border))',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
              padding: '24px 32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid hsl(var(--card-border))', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit size={22} style={{ color: 'hsl(var(--primary))' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Edit Lead Details</h3>
              </div>
              <button
                onClick={() => setEditingEnquiry(null)}
                className="btn btn-ghost btn-icon"
                style={{ width: '32px', height: '32px', color: 'hsl(var(--muted-foreground))' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                  value={editingEnquiry.contact_name}
                  onChange={e => setEditingEnquiry({ ...editingEnquiry, contact_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                    value={editingEnquiry.contact_phone || ''}
                    onChange={e => setEditingEnquiry({ ...editingEnquiry, contact_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                    Course Choice *
                  </label>
                  <select
                    className="form-select"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                    value={editingEnquiry.course_id}
                    onChange={e => {
                      const selectedCourse = courses.find(c => c.id === e.target.value);
                      setEditingEnquiry({
                        ...editingEnquiry,
                        course_id: e.target.value,
                        category_id: selectedCourse ? selectedCourse.category_id : editingEnquiry.category_id
                      });
                    }}
                    required
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.fee})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, marginTop: '34px', color: 'hsl(var(--foreground))' }}>
                    <input
                      type="checkbox"
                      checked={editingEnquiry.fee_shared}
                      onChange={e => setEditingEnquiry({ ...editingEnquiry, fee_shared: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--primary))', borderRadius: '4px' }}
                    />
                    Fee Shared with Lead
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                    Next Reminder Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                    value={editingEnquiry.next_reminder_at ? editingEnquiry.next_reminder_at.substring(0, 10) : ''}
                    onChange={e => {
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        setEditingEnquiry({ ...editingEnquiry, next_reminder_at: d.toISOString() });
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%', minHeight: '90px', padding: '12px 14px', borderRadius: '8px', background: 'hsl(var(--background))', fontFamily: 'inherit', resize: 'vertical' }}
                  value={editingEnquiry.notes || ''}
                  onChange={e => setEditingEnquiry({ ...editingEnquiry, notes: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1px solid hsl(var(--card-border))', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'hsl(var(--foreground))' }}>
                  Tracking Checklist Statuses
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
                      Interested
                    </label>
                    <select
                      className="form-select"
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                      value={editingEnquiry.interested === null ? 'null' : editingEnquiry.interested ? 'true' : 'false'}
                      onChange={e => {
                        const val = e.target.value === 'null' ? null : e.target.value === 'true';
                        setEditingEnquiry({ ...editingEnquiry, interested: val });
                      }}
                    >
                      <option value="null">Pending (?)</option>
                      <option value="true">Yes (✓)</option>
                      <option value="false">No (✕)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
                      Follow-up Done
                    </label>
                    <select
                      className="form-select"
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                      value={editingEnquiry.follow_up_done === null ? 'null' : editingEnquiry.follow_up_done ? 'true' : 'false'}
                      onChange={e => {
                        const val = e.target.value === 'null' ? null : e.target.value === 'true';
                        setEditingEnquiry({ ...editingEnquiry, follow_up_done: val });
                      }}
                    >
                      <option value="null">Pending (?)</option>
                      <option value="true">Yes (✓)</option>
                      <option value="false">No (✕)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
                      Reachable
                    </label>
                    <select
                      className="form-select"
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', background: 'hsl(var(--background))' }}
                      value={editingEnquiry.can_follow_up === null ? 'null' : editingEnquiry.can_follow_up ? 'true' : 'false'}
                      onChange={e => {
                        const val = e.target.value === 'null' ? null : e.target.value === 'true';
                        setEditingEnquiry({ ...editingEnquiry, can_follow_up: val });
                      }}
                    >
                      <option value="null">Pending (?)</option>
                      <option value="true">Yes (✓)</option>
                      <option value="false">No (✕)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'hsl(var(--foreground))',
                    fontWeight: 500,
                    fontSize: '15px',
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '15px' }}
                >
                  <Save size={18} /> {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
export default Dashboard;
