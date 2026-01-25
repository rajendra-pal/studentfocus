
import { UserData, UserProfile, DaySchedule, Log, Goal, Project, SemesterArchive, DAYS_OF_WEEK, SpeakingSession } from '../types';

const USERS_KEY = 'student_focus_users_v1';
const CURRENT_USER_KEY = 'student_focus_current_user_v1';

let usersCache: Record<string, UserData> | null = null;

const getUsers = (): Record<string, UserData> => {
  if (usersCache) {
    return usersCache;
  }

  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
      usersCache = {};
      return usersCache;
    }
    
    const users = JSON.parse(stored);
    
    if (!users || typeof users !== 'object') {
      usersCache = {};
      return usersCache;
    }

    Object.values(users).forEach((u: any) => {
      if (u.setupComplete !== undefined && u.hasCompletedSetup === undefined) {
        u.hasCompletedSetup = u.setupComplete;
        delete u.setupComplete;
      }

      if (Array.isArray(u.logs)) {
        u.logs.forEach((log: any) => {
          if (!log.categories && log.category) {
            log.categories = [log.category];
            delete log.category;
          } else if (!Array.isArray(log.categories)) {
            log.categories = ['study'];
          }
        });
      } else {
          u.logs = [];
      }

      if (Array.isArray(u.goals)) {
        u.goals.forEach((goal: any) => {
          if (!goal.category) {
            goal.category = 'academics';
          }
        });
      } else {
          u.goals = [];
      }
      
      if (!Array.isArray(u.projects)) {
        u.projects = [];
      }

      if (!Array.isArray(u.speakingSessions)) {
        u.speakingSessions = [];
      }

      if (!Array.isArray(u.usedSpeakingTopics)) {
        u.usedSpeakingTopics = [];
      }
      
      if (!Array.isArray(u.schedule)) {
          u.schedule = DAYS_OF_WEEK.map(day => ({ day, subjects: [] }));
      }
      
      if (!Array.isArray(u.archives)) {
        u.archives = [];
      }
    });
    
    usersCache = users as Record<string, UserData>;
    return usersCache;
  } catch (error) {
    usersCache = {};
    return usersCache;
  }
};

const saveUsers = (users: Record<string, UserData>) => {
  try {
    usersCache = users;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users data:', error);
  }
};

export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const authService = {
  async signup(email: string, password: string): Promise<boolean> {
    const users = getUsers();
    if (users[email]) return false;

    const passwordHash = hashPassword(password);
    
    const newUser: UserData = {
      email,
      passwordHash,
      hasCompletedSetup: false,
      profile: { semester: '', targetSgpa: '', careerFocus: '' },
      schedule: DAYS_OF_WEEK.map(day => ({ day, subjects: [] })),
      logs: [],
      goals: [],
      projects: [],
      speakingSessions: [],
      usedSpeakingTopics: [],
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
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): UserData | null {
    try {
      const email = localStorage.getItem(CURRENT_USER_KEY);
      if (!email) return null;
      
      const users = getUsers();
      return users[email] || null;
    } catch (error) {
      return null;
    }
  }
};

export const dataService = {
  saveOnboarding(email: string, profile: UserProfile, schedule: DaySchedule[]) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] }; // Clone user
      users[email].profile = profile;
      users[email].schedule = schedule;
      users[email].hasCompletedSetup = true;
      saveUsers(users);
    }
  },
  
  updateProfile(email: string, profile: UserProfile) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] }; // Clone user
      users[email].profile = { ...users[email].profile, ...profile };
      saveUsers(users);
    }
  },

  updateSchedule(email: string, schedule: DaySchedule[]) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] }; // Clone user
      users[email].schedule = schedule;
      saveUsers(users);
    }
  },

  addLog(email: string, log: Log) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] }; // Clone user for React state update
      const currentLogs = users[email].logs || [];
      users[email].logs = [...currentLogs, log];
      saveUsers(users);
    }
  },

  addSpeakingSession(email: string, session: SpeakingSession, topicToMarkUsed?: string) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] };
      const currentSessions = users[email].speakingSessions || [];
      users[email].speakingSessions = [...currentSessions, session];
      
      if (topicToMarkUsed && !users[email].usedSpeakingTopics.includes(topicToMarkUsed)) {
        const currentTopics = users[email].usedSpeakingTopics || [];
        users[email].usedSpeakingTopics = [...currentTopics, topicToMarkUsed];
      }
      saveUsers(users);
    }
  },

  deleteSpeakingSession(email: string, sessionId: string) {
    const users = getUsers();
    if (users[email] && users[email].speakingSessions) {
      users[email] = { ...users[email] };
      users[email].speakingSessions = users[email].speakingSessions.filter(s => s.id !== sessionId);
      saveUsers(users);
    }
  },

  updateLog(email: string, updatedLog: Log) {
    const users = getUsers();
    if (users[email] && users[email].logs) {
      users[email] = { ...users[email] };
      users[email].logs = users[email].logs.map(l => l.id === updatedLog.id ? updatedLog : l);
      saveUsers(users);
    }
  },

  deleteLog(email: string, logId: string) {
    const users = getUsers();
    if (users[email] && users[email].logs) {
      users[email] = { ...users[email] }; // Clone user
      users[email].logs = users[email].logs.filter(l => l.id !== logId);
      saveUsers(users);
    }
  },

  addGoal(email: string, goal: Goal) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] };
      const currentGoals = users[email].goals || [];
      users[email].goals = [...currentGoals, goal];
      saveUsers(users);
    }
  },

  toggleGoal(email: string, goalId: string) {
    const users = getUsers();
    if (users[email] && users[email].goals) {
      users[email] = { ...users[email] };
      users[email].goals = users[email].goals.map(g => 
        g.id === goalId ? { ...g, completed: !g.completed } : g
      );
      saveUsers(users);
    }
  },

  deleteGoal(email: string, goalId: string) {
    const users = getUsers();
    if (users[email] && users[email].goals) {
      users[email] = { ...users[email] };
      users[email].goals = users[email].goals.filter(g => g.id !== goalId);
      saveUsers(users);
    }
  },

  addProject(email: string, project: Project) {
    const users = getUsers();
    if (users[email]) {
      users[email] = { ...users[email] };
      const currentProjects = users[email].projects || [];
      users[email].projects = [...currentProjects, project];
      saveUsers(users);
    }
  },

  updateProject(email: string, project: Project) {
    const users = getUsers();
    if (users[email] && users[email].projects) {
      users[email] = { ...users[email] };
      users[email].projects = users[email].projects.map(p => 
        p.id === project.id ? project : p
      );
      saveUsers(users);
    }
  },

  deleteProject(email: string, projectId: string) {
    const users = getUsers();
    if (users[email] && users[email].projects) {
      users[email] = { ...users[email] };
      users[email].projects = users[email].projects.filter(p => p.id !== projectId);
      saveUsers(users);
    }
  },

  archiveSemester(email: string) {
    const users = getUsers();
    const user = users[email];
    if (user) {
      users[email] = { ...user }; // Clone
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

      const currentArchives = user.archives || [];
      users[email].archives = [...currentArchives, archive];

      users[email].logs = [];
      users[email].goals = [];
      users[email].schedule = DAYS_OF_WEEK.map(day => ({ day, subjects: [] }));
      
      saveUsers(users);
    }
  }
};
