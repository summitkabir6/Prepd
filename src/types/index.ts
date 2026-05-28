export type UserRole = 'lawyer' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Case {
  id: string;
  lawyer_id: string;
  name: string;
  case_type: string;
  trial_date: string | null;
  court_name: string | null;
  summary: string;
  key_facts: string;
  created_at: string;
}

export interface CaseClient {
  id: string;
  case_id: string;
  client_id: string;
  invited_at: string;
  status: 'invited' | 'active';
  // joined
  users?: User;
}

export interface ClientInvite {
  id: string;
  case_id: string;
  lawyer_id: string;
  email: string;
  full_name: string;
  token: string;
  status: 'pending' | 'accepted';
  created_at: string;
  accepted_at: string | null;
  // joined
  cases?: Case;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  extracted_text: string | null;
  uploaded_at: string;
}

export type QuestionSetType =
  | 'Background & Timeline'
  | 'Relationship Questions'
  | 'Credibility Challenges'
  | 'Event-Specific Deep Dive'
  | 'Document Confrontation'
  | 'Hostile Cross-Examination'
  | 'Procedural Familiarity';

export const QUESTION_SET_TYPES: { value: QuestionSetType; label: string; description: string }[] = [
  {
    value: 'Background & Timeline',
    label: 'Background & Timeline',
    description: 'Basic facts, dates, and sequence of events',
  },
  {
    value: 'Relationship Questions',
    label: 'Relationship Questions',
    description: "Client's relationship to key parties in the case",
  },
  {
    value: 'Credibility Challenges',
    label: 'Credibility Challenges',
    description: 'Consistency, prior statements, and memory',
  },
  {
    value: 'Event-Specific Deep Dive',
    label: 'Event-Specific Deep Dive',
    description: 'Detailed questions about the core incident',
  },
  {
    value: 'Document Confrontation',
    label: 'Document Confrontation',
    description: 'Questions referencing specific uploaded documents',
  },
  {
    value: 'Hostile Cross-Examination',
    label: 'Hostile Cross-Examination',
    description: 'Aggressive, adversarial questioning style',
  },
  {
    value: 'Procedural Familiarity',
    label: 'Procedural Familiarity',
    description: 'What happens in the room, objections, rights',
  },
];

export interface QuestionSet {
  id: string;
  case_id: string;
  client_id: string;
  set_type: QuestionSetType;
  questions: string[];
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface SessionResponse {
  id: string;
  question_set_id: string;
  question_index: number;
  question_text: string;
  answer_text: string;
  answer_type: 'voice' | 'text';
  created_at: string;
}

export interface WeakPoint {
  question_refs: string[];
  finding: string;
  risk_level: 'High' | 'Medium' | 'Low';
}

export interface Contradiction {
  question_a: string;
  answer_a: string;
  question_b: string;
  answer_b: string;
  description: string;
}

export interface DocumentConflict {
  question_ref: string;
  client_answer: string;
  document_excerpt: string;
  description: string;
}

export interface Report {
  id: string;
  question_set_id: string;
  case_id: string;
  client_id: string;
  overall_assessment: string;
  consistency_score: number;
  strong_points: string[];
  weak_points: WeakPoint[];
  contradictions: Contradiction[];
  document_conflicts: DocumentConflict[];
  volunteered_information: string[];
  recommended_next_set: string;
  raw_report_text: string;
  created_at: string;
  // joined
  question_sets?: QuestionSet;
  users?: User;
}

export interface PendingInvite {
  id: string;
  case_id: string;
  case_name: string;
  lawyer_name: string;
  created_at: string;
}

export interface CaseStats {
  clientCount: number;
  hasNewReport: boolean;
  hasActiveSession: boolean;
}
