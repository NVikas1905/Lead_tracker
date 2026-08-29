export interface Category {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  category_id: string;
  name: string;
  fee: string;
  description: string;
  active: boolean;
  created_at: string;
}

export interface Enquiry {
  id: string;
  contact_name: string;
  contact_phone: string;
  category_id: string;
  course_id: string;
  fee_shared: boolean;
  notes: string;
  interested: boolean | null;
  follow_up_done: boolean | null;
  can_follow_up: boolean | null;
  next_reminder_at: string;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  reminderDate?: string;
  is_completed?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  age: string;
  role: string;
  address: string;
  contact_number: string;
  email?: string;
  aadhar_number?: string;
  pan_number?: string;
  aadhar_doc_url?: string;
  pan_doc_url?: string;
}

export interface EmployeeTask {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date: string;
  assigned_by?: string;
  created_at: string;
}

// Initial mock data
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-tech', name: 'Technologies' },
  { id: 'cat-academy', name: 'Academy' }
];

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-fs',
    category_id: 'cat-tech',
    name: 'Full Stack Developer',
    fee: '₹45,000',
    description: 'HTML, CSS, Javascript, React, Node.js, and SQL/NoSQL databases.',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-ds',
    category_id: 'cat-tech',
    name: 'Data Science & AI',
    fee: '₹60,000',
    description: 'Python, statistical analysis, Machine Learning algorithms, and Generative AI.',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-ml',
    category_id: 'cat-tech',
    name: 'Machine Learning',
    fee: '₹50,000',
    description: 'Deep learning, neural networks, computer vision, and NLP frameworks.',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-neet',
    category_id: 'cat-academy',
    name: 'NEET Coaching',
    fee: '₹1,20,000/year',
    description: 'Complete coaching for national eligibility cum entrance test for medical aspirants.',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-jee',
    category_id: 'cat-academy',
    name: 'JEE Coaching',
    fee: '₹1,30,000/year',
    description: 'Coaching for Joint Entrance Examination for top engineering institutions.',
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-german',
    category_id: 'cat-academy',
    name: 'German Language Classes',
    fee: '₹15,000/level',
    description: 'German language learning from levels A1 to B2 with certified exam practice.',
    active: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-1',
    contact_name: 'Ashok Kumar',
    contact_phone: '+91 98765 43210',
    category_id: 'cat-tech',
    course_id: 'course-fs',
    fee_shared: true,
    notes: 'Interested in evening batch. Inquired via call.',
    interested: null,
    follow_up_done: null,
    can_follow_up: null,
    next_reminder_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (due now)
    last_reminded_at: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'enq-2',
    contact_name: 'Priya Sharma',
    contact_phone: '+91 87654 32109',
    category_id: 'cat-academy',
    course_id: 'course-neet',
    fee_shared: false,
    notes: 'Parent called. Asked for demo class schedule.',
    interested: true,
    follow_up_done: null,
    can_follow_up: null,
    next_reminder_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    last_reminded_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// LocalStorage helpers
const STORAGE_PREFIX = 'enquiry_tracker_';

function getStorageItem<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(STORAGE_PREFIX + key);
  if (!item) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// APIs
export function getLocalCategories(): Category[] {
  return getStorageItem<Category[]>('categories', DEFAULT_CATEGORIES);
}

export function saveLocalCategory(name: string): Category {
  const categories = getLocalCategories();
  const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;

  const newCat: Category = {
    id: 'cat-' + Math.random().toString(36).substr(2, 9),
    name
  };
  categories.push(newCat);
  setStorageItem('categories', categories);
  return newCat;
}

export function getLocalCourses(): Course[] {
  return getStorageItem<Course[]>('courses', DEFAULT_COURSES);
}

export function saveLocalCourse(courseData: Omit<Course, 'id' | 'created_at'> & { id?: string }): Course {
  const courses = getLocalCourses();
  
  if (courseData.id) {
    // Update
    const index = courses.findIndex(c => c.id === courseData.id);
    if (index !== -1) {
      courses[index] = {
        ...courses[index],
        ...courseData,
        id: courseData.id
      };
      setStorageItem('courses', courses);
      return courses[index];
    }
  }

  // Create
  const newCourse: Course = {
    ...courseData,
    id: 'course-' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  courses.push(newCourse);
  setStorageItem('courses', courses);
  return newCourse;
}

export function deleteLocalCourse(id: string): void {
  const courses = getLocalCourses();
  const filtered = courses.filter(c => c.id !== id);
  setStorageItem('courses', filtered);
}

export function getLocalEnquiries(): Enquiry[] {
  return getStorageItem<Enquiry[]>('enquiries', DEFAULT_ENQUIRIES);
}

export function addLocalEnquiry(enquiry: Omit<Enquiry, 'id' | 'created_at' | 'updated_at' | 'next_reminder_at' | 'last_reminded_at'>): Enquiry {
  const enquiries = getLocalEnquiries();
  const now = new Date();
  
  // reminder date is 2 days from now
  const nextReminder = new Date();
  nextReminder.setDate(now.getDate() + 2);

  const newEnq: Enquiry = {
    ...enquiry,
    id: 'enq-' + Math.random().toString(36).substr(2, 9),
    next_reminder_at: nextReminder.toISOString(),
    last_reminded_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  enquiries.push(newEnq);
  setStorageItem('enquiries', enquiries);
  return newEnq;
}

export function updateLocalEnquiry(id: string, updates: Partial<Enquiry>): Enquiry {
  const enquiries = getLocalEnquiries();
  const index = enquiries.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error(`Enquiry not found with ID: ${id}`);
  }

  const current = enquiries[index];
  const updated: Enquiry = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };

  enquiries[index] = updated;
  setStorageItem('enquiries', enquiries);
  return updated;
}

export function deleteLocalEnquiry(id: string): void {
  const enquiries = getLocalEnquiries();
  const filtered = enquiries.filter(e => e.id !== id);
  setStorageItem('enquiries', filtered);
}

export function resetLocalDatabase(): void {
  localStorage.removeItem(STORAGE_PREFIX + 'categories');
  localStorage.removeItem(STORAGE_PREFIX + 'courses');
  localStorage.removeItem(STORAGE_PREFIX + 'enquiries');
  localStorage.removeItem(STORAGE_PREFIX + 'notes');
}

export function getLocalNotes(): Note[] {
  return getStorageItem<Note[]>('notes', []);
}

export function saveLocalNote(note: Omit<Note, 'id' | 'timestamp'>): Note {
  const notes = getLocalNotes();
  const newNote: Note = {
    ...note,
    id: 'note-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  notes.unshift(newNote); // Add to beginning
  setStorageItem('notes', notes);
  return newNote;
}

export function updateLocalNote(id: string, updates: Partial<Note>): Note {
  const notes = getLocalNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    throw new Error(`Note not found with ID: ${id}`);
  }

  const current = notes[index];
  const updated: Note = {
    ...current,
    ...updates,
    // Keep original timestamp
  };

  notes[index] = updated;
  setStorageItem('notes', notes);
  return updated;
}

export function deleteLocalNote(id: string): void {
  const notes = getLocalNotes();
  const filtered = notes.filter(n => n.id !== id);
  setStorageItem('notes', filtered);
}

// ==========================================
// EMPLOYEES
// ==========================================

export function getLocalEmployees(): Employee[] {
  return getStorageItem<Employee[]>('employees', []);
}

export function saveLocalEmployee(employee: Omit<Employee, 'id'>): Employee {
  const employees = getLocalEmployees();
  const newEmployee: Employee = {
    ...employee,
    id: 'emp-' + Math.random().toString(36).substr(2, 9),
  };
  employees.unshift(newEmployee);
  setStorageItem('employees', employees);
  return newEmployee;
}

export function updateLocalEmployee(id: string, updates: Partial<Employee>): Employee {
  const employees = getLocalEmployees();
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error(`Employee not found with ID: ${id}`);
  }

  const current = employees[index];
  const updated: Employee = {
    ...current,
    ...updates,
  };

  employees[index] = updated;
  setStorageItem('employees', employees);
  return updated;
}

export function deleteLocalEmployee(id: string): void {
  const employees = getLocalEmployees();
  const filtered = employees.filter(e => e.id !== id);
  setStorageItem('employees', filtered);
}

// --- Employee Tasks Data ---
export const getLocalEmployeeTasks = (): EmployeeTask[] => {
  try {
    const data = localStorage.getItem('local_employee_tasks');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local tasks:', error);
    return [];
  }
};

export const saveLocalEmployeeTask = (task: Omit<EmployeeTask, 'id' | 'created_at'>): EmployeeTask => {
  const tasks = getLocalEmployeeTasks();
  const newTask: EmployeeTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  tasks.push(newTask);
  localStorage.setItem('local_employee_tasks', JSON.stringify(tasks));
  return newTask;
};

export const updateLocalEmployeeTask = (id: string, updates: Partial<EmployeeTask>): EmployeeTask | null => {
  const tasks = getLocalEmployeeTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    localStorage.setItem('local_employee_tasks', JSON.stringify(tasks));
    return tasks[index];
  }
  return null;
};

