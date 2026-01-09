export enum PipelineStage {
  NewLead = "New Lead",
  Contacted = "Contacted",
  AppointmentBooked = "Appointment Booked",
  Attended = "Attended",
  Proposal = "Proposal",
  ClientOnboarded = "Client Onboarded"
}

export interface TranscriptLine {
  speaker: 'AI' | 'Client' | 'Advisor';
  text: string;
  time: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'sms' | 'web_message' | 'meeting' | 'note' | 'workshop';
  subType?: 'ai' | 'human';
  direction?: 'inbound' | 'outbound';
  date: string;
  time?: string;
  description: string;
  user: string;
  // Call specific
  duration?: string;
  status?: 'Completed' | 'Missed' | 'Voicemail' | 'Escalated';
  recordingUrl?: string;
  transcript?: TranscriptLine[];
  aiAnalysis?: {
    summary: string[];
    intent: string;
    sentiment: 'Positive' | 'Neutral' | 'Concerned';
    nextAction: string;
    confidenceScore?: number;
  };
  // Message specific
  thread?: { sender: string; text: string; time: string; isAi: boolean }[];
  tags?: string[];
}

// --- Phone & Email Types ---
export type PhoneType = 'MOBILE' | 'WORK' | 'HOME' | 'FAX' | 'OTHER';
export type EmailType = 'PERSONAL' | 'WORK' | 'OTHER';

export interface ClientPhone {
  id: string;
  number: string;
  type: PhoneType;
  label?: string;
  isPrimary: boolean;
}

export interface ClientEmail {
  id: string;
  email: string;
  type: EmailType;
  label?: string;
  isPrimary: boolean;
}

export interface Client {
  id: string;
  clientId: string; // Human-readable ID (e.g., CL-0001)
  name: string;
  email?: string; // Legacy field - deprecated
  phone?: string; // Legacy field - deprecated
  phones: ClientPhone[]; // Multiple phone numbers
  emails: ClientEmail[]; // Multiple email addresses
  status: 'Active' | 'Prospect' | 'Lead' | 'Churned';
  advisor?: string;
  advisorId?: string;
  aum?: number; // Assets Under Management
  lastContact?: string;
  nextStep?: string;
  pipelineStage?: PipelineStage | string;
  riskProfile?: 'Conservative' | 'Moderate' | 'Aggressive';
  activities?: Activity[];
  tags?: string[];
  imageUrl?: string;
  portfolioHealth?: 'On Track' | 'Review Needed' | 'Rebalance';
}

// --- Import Types ---
export type DuplicateStrategy = 'skip' | 'update' | 'create_new';

export interface ImportPreview {
  jobId: string;
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'phone_format';
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: ImportError[];
}

export interface ImportJob {
  id: string;
  filename: string;
  totalRecords: number;
  processedCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors?: ImportError[];
  createdAt: string;
  completedAt?: string;
}

export interface KPIData {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: any;
}

export interface Workshop {
  id: string;
  title: string;
  date: string;
  registered: number;
  capacity: number;
  status: 'Upcoming' | 'Completed' | 'Draft';
}

export interface Task {
  id: string;
  title: string;
  due: string;
  type: 'Follow-up' | 'Prep' | 'Call';
  priority: 'High' | 'Medium' | 'Low';
  clientName: string;
  clientId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'Meeting' | 'Call' | 'Workshop' | 'Personal';
  clientId?: string;
  clientName?: string;
  advisorId?: string;
  advisorName?: string;
  createdAt?: Date;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'folder';
  size?: string;
  dateModified: string;
  category: 'Client' | 'Internal' | 'Compliance';
}