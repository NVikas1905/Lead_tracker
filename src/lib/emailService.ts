export const sendTaskEmail = async (
  employeeEmail: string,
  employeeName: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: string,
  priority: string,
  assignedBy: string
) => {
  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not defined in .env');
    return { success: false, message: 'RESEND_API_KEY is missing from .env file' };
  }

  let priorityColor = '#3b82f6'; // Blue
  if (priority === 'High') priorityColor = '#ef4444'; // Red
  if (priority === 'Low') priorityColor = '#22c55e'; // Green

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827; margin-bottom: 20px;">New Task Assigned: ${taskTitle}</h2>
      <p style="color: #374151; font-size: 16px;">Hello ${employeeName},</p>
      <p style="color: #374151; font-size: 16px;">A new task has been assigned to you by <strong>${assignedBy}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #111827;"><strong>Title:</strong> ${taskTitle}</p>
        <p style="margin: 0 0 10px 0; color: #111827;"><strong>Description:</strong> ${taskDescription || 'No description provided.'}</p>
        <p style="margin: 0 0 10px 0; color: #111827;">
          <strong>Priority:</strong> 
          <span style="color: ${priorityColor}; font-weight: bold;">${priority}</span>
        </p>
        <p style="margin: 0; color: #111827;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Please log in to the employee portal or contact your manager for more details.
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Global Minds <onboarding@resend.dev>', // resend.dev only allows sending to the email you signed up with
        to: [employeeEmail],
        subject: `New Task Assigned: ${taskTitle}`,
        html: htmlContent,
      }),
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errorData = await res.json();
      console.error('Failed to send email via Resend:', errorData);
      return { success: false, message: errorData.message || JSON.stringify(errorData) };
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};
