
export interface DaySchedule {
  day: string; // "Monday", "Tuesday", etc.
  subjects: string[];
}

export interface UserProfile {
  semester: string;
  targetSgpa: string;
  careerFocus: string;
  enableDsa?: boolean; // Controls visibility of DSA module
}

export interface Log {
  id: string;
  date: string; // ISO Date string
  subject: string;
  hours: number;
  notes: string;
  categories: ('study' | 'dsa' | 'project')[]; // Changed to array to support multiple selection
  // Optional fields for DSA Tracker
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  weekId: string; // e.g., "2023-44" (Year-Week)
  category: 'academics' | 'skills' | 'dsa';
}

export interface Project {
  id: string;
  name: string;
  category: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  techStack: string[];
  githubLink?: string;
  keyLearnings?: string;
  startDate?: string;
  endDate?: string;
  lastUpdated: string;
}

export interface SemesterArchive {
  id: string;
  semesterName: string;
  archivedAt: string;
  profile: UserProfile;
  schedule: DaySchedule[];
  logs: Log[];
  goals: Goal[];
  projects: Project[]; // Snapshot of projects at that time
}

export interface UserData {
  email: string;
  passwordHash: string;
  hasCompletedSetup: boolean; // Renamed from setupComplete to ensure persistence requirement
  profile: UserProfile;
  schedule: DaySchedule[]; // Array of 7 days
  logs: Log[];
  goals: Goal[];
  projects: Project[];
  archives?: SemesterArchive[]; // Store past semesters
}

export interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
}

export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];