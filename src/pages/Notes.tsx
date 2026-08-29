import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, BookOpen, Calendar, Edit2, Trash2, X, Check, Mic } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getLocalNotes, saveLocalNote, updateLocalNote, deleteLocalNote, type Note } from '../lib/localDatabase';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [shouldAutoSave, setShouldAutoSave] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (shouldAutoSave) {
      if (currentNote.trim()) {
        handleAddNote();
      }
      setShouldAutoSave(false);
    }
  }, [shouldAutoSave]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentNote((prev) => {
             const space = prev && !prev.endsWith(' ') ? ' ' : '';
             return prev + space + finalTranscript.trim();
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setShouldAutoSave(true);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('timestamp', { ascending: false });
          
        if (!error && data) {
          setNotes(data as Note[]);
        } else {
          console.error("Error fetching notes from Supabase:", error);
          setNotes(getLocalNotes());
        }
      } catch (err) {
        console.error(err);
        setNotes(getLocalNotes());
      }
    } else {
      setNotes(getLocalNotes());
    }
    setIsLoading(false);
  };

  const handleAddNote = async () => {
    if (!currentNote.trim()) return;
    
    const newNoteData = {
      content: currentNote,
      reminderDate: reminderDate || undefined
    };
    
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .insert([
             { 
               content: currentNote, 
               reminderDate: reminderDate || null,
               timestamp: new Date().toISOString()
             }
          ])
          .select();
          
        if (!error && data && data.length > 0) {
          setNotes([data[0] as Note, ...notes]);
        } else {
          console.error("Error saving note to Supabase. Falling back to local storage.", error);
          const localNote = saveLocalNote(newNoteData);
          setNotes([localNote, ...notes]);
        }
      } catch (err) {
         console.error(err);
         const localNote = saveLocalNote(newNoteData);
         setNotes([localNote, ...notes]);
      }
    } else {
      const localNote = saveLocalNote(newNoteData);
      setNotes([localNote, ...notes]);
    }
    
    setCurrentNote('');
    setReminderDate('');
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditReminderDate(note.reminderDate || '');
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditReminderDate('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editContent.trim()) return;
    
    const updates = {
      content: editContent,
      reminderDate: editReminderDate || undefined
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('notes')
          .update({ content: updates.content, reminderDate: updates.reminderDate || null })
          .eq('id', editingNoteId);
          
        if (!error) {
          setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...updates } : n));
        } else {
          console.error("Error updating in Supabase:", error);
          updateLocalNote(editingNoteId, updates);
          setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...updates } : n));
        }
      } catch (err) {
        updateLocalNote(editingNoteId, updates);
        setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...updates } : n));
      }
    } else {
      updateLocalNote(editingNoteId, updates);
      setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...updates } : n));
    }
    cancelEditing();
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);
          
        if (!error) {
          setNotes(notes.filter(n => n.id !== id));
        } else {
          console.error("Error deleting from Supabase:", error);
          deleteLocalNote(id);
          setNotes(notes.filter(n => n.id !== id));
        }
      } catch (err) {
        deleteLocalNote(id);
        setNotes(notes.filter(n => n.id !== id));
      }
    } else {
      deleteLocalNote(id);
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.4s ease-out' }}>
      
      {/* Input Section */}
      <div className="glass-card">
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, hsl(var(--foreground)) 60%, hsl(var(--primary)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '4px'
            }}>
              Meeting & Reminder Notes
            </h2>
            <p style={{ color: 'hsl(var(--muted))', fontSize: '14px' }}>
              Capture important details conveyed by clients or managers securely.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{ 
              position: 'relative', 
              borderRadius: '12px',
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--card-border))',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
            className="note-input-container"
          >
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Type your notes here... (e.g. Discuss new tracker features with the client)"
              className="form-textarea"
              style={{
                minHeight: '140px',
                resize: 'vertical',
                border: 'none',
                background: 'transparent',
                padding: '20px',
                paddingBottom: '60px',
                width: '100%',
                fontSize: '15px',
                lineHeight: '1.6'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddNote();
                }
              }}
            />
            
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Set a reminder date">
                <input 
                  type="date"
                  value={reminderDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReminderDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    paddingLeft: '32px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--card-border))',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                  className="reminder-date-input"
                />
                <Calendar size={14} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
              </div>

              <button
                onClick={toggleListening}
                className="btn btn-ghost btn-icon"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isListening ? 'hsl(var(--danger) / 0.1)' : 'transparent',
                  color: isListening ? 'hsl(var(--danger))' : 'hsl(var(--muted-foreground))',
                  border: isListening ? '1px solid hsl(var(--danger) / 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                <Mic size={18} style={isListening ? { animation: 'pulse-icon 1.5s infinite' } : {}} />
              </button>

              <button
                onClick={handleAddNote}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: currentNote.trim() ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  cursor: currentNote.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!currentNote.trim()}
              >
                <span>Save Note</span>
                <Send size={16} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textAlign: 'right', paddingRight: '8px' }}>
            Shortcut: <kbd style={{ background: 'hsl(var(--card-border))', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl</kbd> + <kbd style={{ background: 'hsl(var(--card-border))', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Enter</kbd> to save
          </div>
        </div>
      </div>

      {/* Saved Notes Section */}
      <div className="glass-card" style={{ padding: '0' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid hsl(var(--card-border))' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
            Recent Notes
          </h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          {notes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 24px', 
              backgroundColor: 'hsl(var(--background))',
              borderRadius: '12px',
              border: '2px dashed hsl(var(--card-border))',
              color: 'hsl(var(--muted-foreground))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'hsl(var(--card-border))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'hsl(var(--muted))'
              }}>
                <BookOpen size={32} />
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '16px', color: 'hsl(var(--foreground))', marginBottom: '4px' }}>No notes yet</p>
                <p style={{ fontSize: '14px' }}>Your saved notes will appear here in a beautiful layout.</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Created At</th>
                    <th style={{ width: '150px' }}>Reminder</th>
                    <th>Note Content</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note) => (
                    <tr key={note.id} style={{ transition: 'background-color 0.2s ease' }}>
                      <td style={{ 
                        color: 'hsl(var(--muted-foreground))',
                        verticalAlign: 'top',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {new Date(note.timestamp).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </td>
                      
                      {editingNoteId === note.id ? (
                        <>
                          <td style={{ verticalAlign: 'top' }}>
                            <input 
                              type="date"
                              value={editReminderDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setEditReminderDate(e.target.value)}
                              className="form-input reminder-date-input"
                              style={{ padding: '6px', fontSize: '12px', width: '120px' }}
                            />
                          </td>
                          <td style={{ verticalAlign: 'top' }}>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="form-textarea"
                              style={{ minHeight: '80px', padding: '10px', fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyItems: 'flex-end', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={handleSaveEdit} 
                                className="btn btn-primary btn-icon" 
                                style={{ width: '32px', height: '32px', minHeight: '32px' }} 
                                title="Save Changes"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={cancelEditing} 
                                className="btn btn-secondary btn-icon" 
                                style={{ width: '32px', height: '32px', minHeight: '32px' }} 
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ verticalAlign: 'top' }}>
                            {note.reminderDate ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                background: 'hsl(var(--primary) / 0.1)', 
                                color: 'hsl(var(--primary))', 
                                padding: '4px 10px', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '12px'
                              }}>
                                <Calendar size={12} />
                                {new Date(note.reminderDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            ) : (
                              <span style={{ color: 'hsl(var(--muted))', fontSize: '13px' }}>-</span>
                            )}
                          </td>
                          <td style={{ 
                            whiteSpace: 'pre-wrap',
                            verticalAlign: 'top',
                            color: 'hsl(var(--foreground))',
                            lineHeight: '1.6'
                          }}>
                            {note.content}
                          </td>
                          <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => startEditing(note)} 
                                className="btn btn-ghost btn-icon" 
                                style={{ width: '32px', height: '32px', minHeight: '32px', color: 'hsl(var(--primary))' }} 
                                title="Edit Note"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                onClick={() => handleDeleteNote(note.id)} 
                                className="btn btn-ghost btn-icon hover-danger" 
                                style={{ width: '32px', height: '32px', minHeight: '32px' }} 
                                title="Delete Note"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .note-input-container:focus-within {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15), inset 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .admin-table tbody tr:hover {
          background-color: hsl(var(--primary) / 0.03);
        }
        .reminder-date-input:focus {
          border-color: hsl(var(--primary)) !important;
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.15) !important;
        }
        /* Custom calendar icon styling inside webkit inputs */
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: 0.2s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .hover-danger {
          color: hsl(var(--muted-foreground));
          transition: all 0.2s ease;
        }
        .hover-danger:hover {
          color: hsl(var(--danger)) !important;
          background-color: hsl(var(--danger) / 0.1) !important;
        }
        @keyframes pulse-icon {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Notes;
