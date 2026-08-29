import React from 'react';
import { Phone, Calendar, CheckCircle2, XCircle, HelpCircle, FileText, BadgeDollarSign, Edit } from 'lucide-react';
import type { Enquiry, Course, Category } from '../lib/localDatabase';

interface EnquiryCardProps {
  enquiry: Enquiry;
  courses: Course[];
  categories: Category[];
  onEdit?: (enquiry: Enquiry) => void;
}

export const EnquiryCard: React.FC<EnquiryCardProps> = ({
  enquiry,
  courses,
  categories,
  onEdit
}) => {
  const course = courses.find(c => c.id === enquiry.course_id);
  const category = categories.find(c => c.id === enquiry.category_id);

  // Check if fully resolved
  const isResolved = 
    enquiry.interested !== null && 
    enquiry.follow_up_done !== null && 
    enquiry.can_follow_up !== null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStatus = (val: boolean | null, label: string) => {
    let statusClass = 'status-null';
    let icon = <HelpCircle size={16} />;
    let textValue = 'Pending';

    if (val === true) {
      statusClass = 'status-true';
      icon = <CheckCircle2 size={16} />;
      textValue = 'Yes';
    } else if (val === false) {
      statusClass = 'status-false';
      icon = <XCircle size={16} />;
      textValue = 'No';
    }

    return (
      <div className={`resolution-indicator ${statusClass}`} title={`${label}: ${textValue}`}>
        {icon}
        <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '9px', opacity: 0.8 }}>{textValue}</span>
      </div>
    );
  };

  return (
    <div className="glass-card enquiry-card" style={{ borderTop: isResolved ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--warning))' }}>
      <div>
        {/* Header */}
        <div className="enquiry-header">
          <div className="enquiry-title">
            <h3>{enquiry.contact_name}</h3>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <span>Registered {formatDate(enquiry.created_at)}</span>
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${category?.name === 'Technologies' ? 'badge-tech' : 'badge-academy'}`}>
              {category?.name || 'Catalog'}
            </span>
            {onEdit && (
              <button 
                onClick={() => onEdit(enquiry)} 
                className="btn btn-ghost btn-icon" 
                style={{ width: '28px', height: '28px', padding: 0 }}
                title="Edit Enquiry Details"
              >
                <Edit size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Course details */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: '4px' }}>
            Course Choice
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--background))', padding: '8px 12px', borderRadius: '6px', border: '1px solid hsl(var(--card-border))' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{course?.name || 'Loading Course...'}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--primary))' }}>{course?.fee || ''}</span>
          </div>
        </div>

        {/* Contact details */}
        <div className="enquiry-contact-info">
          <div className="enquiry-contact-item">
            <Phone size={13} style={{ color: 'hsl(var(--primary))' }} />
            <span>{enquiry.contact_phone || 'No phone provided'}</span>
          </div>
          <div className="enquiry-contact-item">
            <BadgeDollarSign size={13} style={{ color: enquiry.fee_shared ? 'hsl(var(--success))' : 'hsl(var(--muted))' }} />
            <span>Fee Shared: {enquiry.fee_shared ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Notes */}
        {enquiry.notes && (
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <FileText size={12} />
              Notes
            </span>
            <p className="enquiry-notes">{enquiry.notes}</p>
          </div>
        )}
      </div>

      {/* Resolution section */}
      <div className="resolution-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span className="resolution-title">Tracking Checklist</span>
          {!isResolved && (
            <span 
              style={{ 
                fontSize: '10px', 
                color: 'hsl(var(--warning))', 
                fontWeight: 'bold',
                animation: 'pulse-text 2s infinite'
              }}
            >
              • Reminders Active
            </span>
          )}
        </div>

        <div className="resolution-toggles">
          {renderStatus(enquiry.interested, 'Interested')}
          {renderStatus(enquiry.follow_up_done, 'Follow-up')}
          {renderStatus(enquiry.can_follow_up, 'Reachable')}
        </div>
      </div>
      
      {/* Keyframe animation for text pulse */}
      <style>{`
        @keyframes pulse-text {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
export default EnquiryCard;
