
import { UserData, UserProfile, DaySchedule, Log, Goal, Project, SemesterArchive, DAYS_OF_WEEK } from '../types';

const USERS_KEY = 'student_focus_users_v1';
const CURRENT_USER_KEY = 'student_focus_current_user_v1';

// In-memory cache for users to ensure consistency and performance
// This prevents overwriting data during race conditions or hot reloads
let usersCache: Record<string, UserData> | null = null;

// Helper to get users object safely from localStorage with caching
const getUsers = (): Record<string, UserData> => {
  // 1. Return cached version if available (Source of Truth in memory)
  if (usersCache) {
    return usersCache;
  }

  try {
    // 2. Read from LocalStorage
    const stored = localStorage.getItem(USERS_KEY);
    
    // 3. Handle empty storage safely - NEVER reset if data might exist elsewhere (but here implies fresh start)
    if (!stored) {
      usersCache = {};
      return usersCache;
    }
    
    const users = JSON.parse(stored);
    
    // 4. Safety check: ensure users is an object
    if (!users || typeof users !== 'object') {
      console.error('Invalid users data structure in localStorage');
      usersCache = {}; // Fallback only if data is corrupt
      return usersCache;
    }

    // 5. Migration/Normalization: Ensure data integrity without deleting
    Object.values(users).forEach((u: any) => {
      // Migrate setup flag if needed (handle old data)
      if (u.setupComplete !== undefined && u.hasCompletedSetup === undefined) {
        u.hasCompletedSetup = u.setupComplete;
        delete u.setupComplete;
      }

      // Migrate Logs
      if (Array.isArray(u.logs)) {
        u.logs.forEach((log: any) => {
          if (!log.categories && log.category) {
            log.categories = [log.category];
            delete log.category; // Cleanup old field
          } else if (!Array.isArray(log.categories)) {
            log.categories = ['study']; // Default fallback
          }
        });
      } else {
          u.logs = []; // Ensure logs array exists
      }

      // Migrate Goals
      if (Array.isArray(u.goals)) {
        u.goals.forEach((goal: any) => {
          if (!goal.category) {
            goal.category = 'academics'; // Default fallback
          }
        });
      } else {
          u.goals = []; // Ensure goals array exists
      }
      
      // Migrate Projects (New Feature)
      if (!Array.isArray(u.projects)) {
        u.projects = [];
      }
      
      // Ensure other required arrays exist
      if (!Array.isArray(u.schedule)) {
          u.schedule = DAYS_OF_WEEK.map(day => ({ day, subjects: [] }));
      }
      
      // Migrate Archives
      if (!Array.isArray(u.archives)) {
        u.archives = [];
      }
    });
    
    usersCache = users as Record<string, UserData>;
    return usersCache;
  } catch (error) {
    console.error('Failed to parse users data from localStorage:', error);
    usersCache = {};
    return usersCache;
  }
};

// Helper to save users object to localStorage
const saveUsers = (users: Record<string, UserData>) => {
  try {
    usersCache = users; // Update cache immediately
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users data to localStorage:', error);
  }
};

// Simple synchronous hash to ensure stability across all environments (http/https)
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const authService = {
  async signup(email: string, password: string): Promise<boolean> {
    const users = getUsers();
    if (users[email]) return false; // User exists

    const passwordHash = hashPassword(password);
    
    // Initialize empty user structure
    const newUser: UserData = {
      email,
      passwordHash,
      hasCompletedSetup: false, // Explicitly set to false
      profile: { semester: '', targetSgpa: '', careerFocus: '' },
      schedule: DAYS_OF_WEEK.map(day => ({ day, subjects: [] })),
      logs: [],
      goals: [],
      projects: [],
      archives: []
    };

    users[email] = newUser;
    saveUsers(users);
    return true;
  },

  async login(email: string, password: string): Promise<UserData | null> {
    const users = getUsers();
    const user = users[email];
    if (!user) return null;

    const passwordHash = hashPassword(password);
    if (user.passwordHash === passwordHash) {
      localStorage.setItem(CURRENT_USER_KEY, email);
      return user;
    }
    return null;
  },

  logout() {
    // ONLY remove the current user session key
    localStorage.removeItem(CURRENT_USER_KEY);
    // DO NOT clear users data or users key
  },

  getCurrentUser(): UserData | null {
    try {
      const email = localStorage.getItem(CURRENT_USER_KEY);
      if (!email) return null;
      
      const users = getUsers();
      return users[email] || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};

export const dataService = {
  saveOnboarding(email: string, profile: UserProfile, schedule: DaySchedule[]) {
    const users = getUsers();
    if (users[email]) {
      users[email].profile = profile;
      users[email].schedule = schedule;
      users[email].hasCompletedSetup = true; // Flag as complete (MANDATORY REQUIREMENT)
      saveUsers(users);
    }
  },
  
  updateProfile(email: string, profile: UserProfile) {
    const users = getUsers();
    if (users[email]) {
      // Merge with existing profile to ensure backward compatibility
      users[email].profile = { ...users[email].profile, ...profile };
      saveUsers(users);
    }
  },

  updateSchedule(email: string, schedule: DaySchedule[]) {
    const users = getUsers();
    if (users[email]) {
      users[email].schedule = schedule;
      saveUsers(users);
    }
  },

  addLog(email: string, log: Log) {
    const users = getUsers();
    if (users[email]) {
      if (!users[email].logs) users[email].logs = [];
      users[email].logs.push(log);
      saveUsers(users);
    }
  },

  updateLog(email: string, updatedLog: Log) {
    const users = getUsers();
    if (users[email] && users[email].logs) {
      const index = users[email].logs.findIndex(l => l.id === updatedLog.id);
      if (index !== -1) {
        users[email].logs[index] = updatedLog;
        saveUsers(users);
      }
    }
  },

  deleteLog(email: string, logId: string) {
    const users = getUsers();
    if (users[email] && users[email].logs) {
      users[email].logs = users[email].logs.filter(l => l.id !== logId);
      saveUsers(users);
    }
  },

  addGoal(email: string, goal: Goal) {
    const users = getUsers();
    if (users[email]) {
      if (!users[email].goals) users[email].goals = [];
      users[email].goals.push(goal);
      saveUsers(users);
    }
  },

  toggleGoal(email: string, goalId: string) {
    const users = getUsers();
    if (users[email] && users[email].goals) {
      const goal = users[email].goals.find(g => g.id === goalId);
      if (goal) {
        goal.completed = !goal.completed;
        saveUsers(users);
      }
    }
  },

  deleteGoal(email: string, goalId: string) {
    const users = getUsers();
    if (users[email] && users[email].goals) {
      users[email].goals = users[email].goals.filter(g => g.id !== goalId);
      saveUsers(users);
    }
  },

  addProject(email: string, project: Project) {
    const users = getUsers();
    if (users[email]) {
      if (!users[email].projects) users[email].projects = [];
      users[email].projects.push(project);
      saveUsers(users);
    }
  },

  updateProject(email: string, project: Project) {
    const users = getUsers();
    if (users[email] && users[email].projects) {
      const index = users[email].projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        users[email].projects[index] = project;
        saveUsers(users);
      }
    }
  },

  deleteProject(email: string, projectId: string) {
    const users = getUsers();
    if (users[email] && users[email].projects) {
      users[email].projects = users[email].projects.filter(p => p.id !== projectId);
      saveUsers(users);
    }
  },

  archiveSemester(email: string) {
    const users = getUsers();
    const user = users[email];
    if (user) {
      // Create Archive
      const archive: SemesterArchive = {
        id: Date.now().toString(),
        semesterName: user.profile.semester,
        archivedAt: new Date().toISOString(),
        profile: { ...user.profile },
        schedule: [...user.schedule],
        logs: [...user.logs],
        goals: [...user.goals],
        projects: [...user.projects]
      };

      if (!user.archives) user.archives = [];
      user.archives.push(archive);

      // Reset Data for new semester
      user.logs = [];
      user.goals = [];
      // Reset schedule to empty
      user.schedule = DAYS_OF_WEEK.map(day => ({ day, subjects: [] }));
      // Projects persist across semesters as they might be ongoing, 
      // but they are snapshot in the archive. 
      // If we want a truly fresh start, we could clear them, but often portfolios build up. 
      // Based on "Start New Semester" implying new classes, we keep projects active.
      
      saveUsers(users);
    }
  }
};