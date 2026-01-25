
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserData, SpeakingSession } from '../types';
import { dataService } from '../services/db';
import { GoogleGenAI } from "@google/genai";
import { 
  Mic2, Flame, CheckCircle2, TrendingUp, BarChart2, 
  Settings, Play, Square, RefreshCcw, AlertCircle, Info, 
  Target, Zap, Clock, BrainCircuit, History, Download, Volume2, Mic, Sparkles, Loader2, Trash2, X
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';

interface SpeakingLabProps {
  user: UserData;
  onUpdate: () => void;
}

// TOPICS DATA
const TOPICS = [
  { id: 't1', topic: 'AI replacing jobs in service sector', type: 'current' },
  { id: 't2', topic: 'India startup ecosystem: Boom or Bubble?', type: 'current' },
  { id: 't3', topic: 'The future of Remote work after 2024', type: 'current' },
  { id: 't4', topic: 'Data privacy in social media age', type: 'current' },
  { id: 't5', topic: 'Climate change responsibility: Individual or Corp?', type: 'current' },
  { id: 't6', topic: 'Online education vs traditional education', type: 'current' },
  { id: 't7', topic: 'Mental health awareness in workplaces', type: 'current' },
  { id: 't8', topic: 'Role of generative AI in education', type: 'current' },
  { id: 't9', topic: 'Social media impact on youth mindset', type: 'current' },
  { id: 't10', topic: 'Digital India initiative: Progress so far', type: 'current' },
  { id: 't11', topic: 'Cryptocurrency regulation in India', type: 'current' },
  { id: 't12', topic: 'Space exploration: Waste of money or necessary?', type: 'current' },
  { id: 't13', topic: 'The rise of Gig Economy workers', type: 'current' },
  { id: 't14', topic: 'Sustainability in fashion industry', type: 'current' },
  { id: 't15', topic: 'EV revolution in Indian cities', type: 'current' },
  { id: 't16', topic: 'Work-Life balance in tech industry', type: 'general' },
  { id: 't17', topic: 'Importance of financial literacy in schools', type: 'general' },
  { id: 't18', topic: 'Impact of OTT platforms on cinema', type: 'general' },
];

const ANGLES = [
  "Explain to a non-technical person",
  "Oppose the topic with strong points",
  "Support the topic with data-driven points",
  "Speak from personal experience",
  "Explain it to a primary school student"
];

const CONSTRAINTS = [
  "No technical jargon allowed",
  "No pause longer than 3 seconds",
  "Use only simple sentences",
  "Must include one real-life example",
  "Conclude the entire speech in exactly one sentence"
];

const GD_INTERRUPTIONS = [
  "Someone disagrees with your point",
  "Give a specific example now",
  "Summarize your last 3 points",
  "Moderator asks for a quick conclusion",
  "Relate this to current economy"
];

// Helper for local date string YYYY-MM-DD
const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const SpeakingLab: React.FC<SpeakingLabProps> = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'free' | 'gd' | 'progress'>('daily');
  const [sessionState, setSessionState] = useState<'idle' | 'thinking' | 'speaking' | 'completed'>('idle');
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(0); // For progress circle calculation
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [fearStop, setFearStop] = useState(false);
  const [gdPrompt, setGdPrompt] = useState('');

  // FREE PRACTICE STATE
  const [freeTopic, setFreeTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  // AUDIO RECORDING STATE
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef<string>(''); // Store the actual mime type used

  // AI ANALYSIS STATE
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);

  // PENDING SESSION STATE (For review before saving)
  const [pendingSession, setPendingSession] = useState<SpeakingSession | null>(null);

  // DELETE MODAL STATE
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- LOGIC FOR DAILY CHALLENGE SELECTION ---
  useEffect(() => {
    if (activeTab === 'daily' && !currentChallenge) {
      // Find a topic not used yet
      const available = TOPICS.filter(t => !user.usedSpeakingTopics.includes(t.id));
      const topic = available.length > 0 ? available[0] : TOPICS[Math.floor(Math.random() * TOPICS.length)];
      
      setCurrentChallenge({
        topic: topic.topic,
        topicId: topic.id,
        angle: ANGLES[Math.floor(Math.random() * ANGLES.length)],
        constraint: CONSTRAINTS[Math.floor(Math.random() * CONSTRAINTS.length)]
      });
    }
  }, [activeTab, user.usedSpeakingTopics, currentChallenge]);

  // TIMER LOGIC
  useEffect(() => {
    let interval: any;
    if (sessionState === 'thinking' || sessionState === 'speaking') {
      interval = setInterval(() => {
        setTimer(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  // GD PROMPT LOGIC
  useEffect(() => {
    if (activeTab === 'gd' && sessionState === 'speaking') {
      const interval = setInterval(() => {
        setGdPrompt(GD_INTERRUPTIONS[Math.floor(Math.random() * GD_INTERRUPTIONS.length)]);
        setTimeout(() => setGdPrompt(''), 6000);
      }, 35000);
      return () => clearInterval(interval);
    }
  }, [activeTab, sessionState]);

  // AUTO-TRANSITION FROM THINKING TO SPEAKING
  useEffect(() => {
    if (sessionState === 'thinking' && timer === 0) {
      handleStartSpeaking();
    }
  }, [timer, sessionState]);

  // RECORDING FUNCTIONS
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detect supported mime type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }
      recordingMimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Async Stop function to ensure we get the data
  const stopRecordingAsync = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;
      
      // Override onstop to capture the final state
      recorder.onstop = () => {
         const audioBlob = new Blob(audioChunksRef.current, { type: recordingMimeTypeRef.current });
         const url = URL.createObjectURL(audioBlob);
         setAudioUrl(url); 
         recorder.stream.getTracks().forEach(track => track.stop());
         resolve(audioBlob);
      };

      recorder.stop();
      setIsRecording(false);
    });
  };

  // Helper to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyzeAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisFeedback(null);
    
    try {
      const mimeType = recordingMimeTypeRef.current || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const base64Audio = await blobToBase64(audioBlob);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            {
              text: "Act as a professional speech coach. Analyze the user's speech and provide detailed, structured feedback in the following format:\n\n**1. Pronunciation & Clarity:** Identify specific words that were unclear or mispronounced.\n**2. Filler Words & Pauses:** Note frequency of fillers (um, uh, like) and awkward pauses.\n**3. Sentence Structure:** Highlight any grammatical errors or suggest better phrasing for complex ideas.\n**4. Tone & Pace:** Evaluate if the speed was appropriate and the tone confident.\n\nKeep the feedback constructive, specific, and encouraging."
            }
          ]
        }
      });
      
      setAnalysisFeedback(response.text || "Could not generate analysis.");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisFeedback("Failed to analyze audio. The audio format might not be supported.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartThinking = () => {
    if (!currentChallenge) return;
    setTimer(30);
    setMaxTime(30);
    setSessionState('thinking');
    setAudioUrl(null); // Reset previous audio
    setAnalysisFeedback(null);
  };

  const handleStartSpeaking = () => {
    setTimer(180); // 3 mins max
    setMaxTime(180);
    setSessionState('speaking');
    startRecording();
  };

  const handleEndSession = async () => {
    const audioBlob = await stopRecordingAsync();
    const sessionDuration = maxTime - timer; 
    
    // Convert blob to base64 for storage if it exists
    let audioData: string | undefined = undefined;
    let mimeType: string | undefined = undefined;
    
    if (audioBlob) {
       try {
         audioData = await blobToBase64(audioBlob);
         mimeType = recordingMimeTypeRef.current;
       } catch (e) {
         console.warn("Failed to process audio for storage", e);
       }
    }

    const session: SpeakingSession = {
      id: Date.now().toString(),
      date: getLocalDate(), // Use local date
      duration: sessionDuration,
      completed: true,
      fearStop: fearStop,
      type: activeTab as any,
      topic: activeTab === 'free' ? freeTopic : currentChallenge?.topic || 'General Practice',
      difficulty: difficulty,
      audioData,
      mimeType
    };

    // Don't save yet, just set pending
    setPendingSession(session);
    setSessionState('completed');
  };

  const resetSession = () => {
    setSessionState('idle');
    setTimer(0);
    setFearStop(false);
    setGdPrompt('');
    setAudioUrl(null);
    setAnalysisFeedback(null);
    setPendingSession(null);
    if(activeTab === 'daily') setCurrentChallenge(null);
  };

  const handleSaveAndClose = () => {
    if (pendingSession) {
      // Use current fearStop state to update the pending session before saving
      const finalSession = { ...pendingSession, fearStop };
      dataService.addSpeakingSession(user.email, finalSession, currentChallenge?.topicId);
      onUpdate();
    }
    resetSession();
  };

  const initiateDelete = (sessionId: string) => {
    setDeleteId(sessionId);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dataService.deleteSpeakingSession(user.email, deleteId);
      onUpdate();
      setDeleteId(null);
    }
  };

  // --- PROGRESS CALCULATIONS ---
  const progressData = useMemo(() => {
    const sessions = user.speakingSessions || [];
    // Last 7 days aggregation
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const offset = d.getTimezoneOffset() * 60000;
      const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      
      return {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        duration: Math.round(daySessions.reduce((acc, s) => acc + s.duration, 0) / 60), // minutes
      };
    });
    return days;
  }, [user.speakingSessions]);

  // Robust Streak Calculation for "YYYY-MM-DD" dates
  const streakCount = useMemo(() => {
    const dates = new Set((user.speakingSessions || []).map(s => s.date));
    if (dates.size === 0) return 0;
    
    const today = getLocalDate();
    const getPrev = (dStr: string) => {
        const d = new Date(dStr);
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().split('T')[0];
    };
    
    const yesterday = getPrev(today);
    
    if (!dates.has(today) && !dates.has(yesterday)) return 0;
    
    let streak = 0;
    let current = dates.has(today) ? today : yesterday;
    
    while(dates.has(current)) {
        streak++;
        current = getPrev(current);
    }
    
    return streak;
  }, [user.speakingSessions]);

  const renderTimer = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Improved circular timer visuals
  const circleRadius = 130; 
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - ((timer / maxTime) * circumference);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20';
      case 'Medium': return 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20';
      case 'Hard': return 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20';
      case 'Brutal': return 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20';
      default: return 'bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/20';
    }
  };

  // --- REUSABLE COMPONENTS ---

  const renderStreakBanner = () => (
    <div className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl p-5 flex items-center justify-center gap-3 shadow-md relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent pointer-events-none" />
         <div className="p-2 bg-slate-800 rounded-full text-orange-500">
            <Flame className={`w-5 h-5 ${streakCount > 0 ? 'fill-orange-500 animate-pulse' : ''}`} />
         </div>
         <span className="font-bold text-xl text-white tracking-tight">{streakCount} Day Streak</span>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-2 gap-4 w-full">
       <div className="bg-bg-hover p-4 rounded-xl text-center border border-border">
          <span className="text-2xl font-black text-text-primary">
            {Math.round((user.speakingSessions || []).reduce((acc, s) => acc + s.duration, 0) / 60)}
          </span>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">Total Minutes</p>
       </div>
       <div className="bg-bg-hover p-4 rounded-xl text-center border border-border">
          <span className="text-2xl font-black text-text-primary">{(user.speakingSessions || []).length}</span>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">Sessions</p>
       </div>
    </div>
  );

  const renderImprovementChart = () => (
    <div className="bg-bg-hover p-4 rounded-xl border border-border shadow-sm w-full">
        <h4 className="text-xs font-bold text-text-primary mb-4 uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-primary" />
            Improvement Trend
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={user.speakingSessions?.slice(-10) || []}>
                 <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <XAxis dataKey="date" hide />
                 <Tooltip 
                    cursor={{stroke: 'var(--border-color)', strokeWidth: 1}}
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                 />
                 <Area 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="var(--accent-primary)" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorDuration)" 
                 />
            </AreaChart>
          </ResponsiveContainer>
        </div>
    </div>
  );

  const renderHistoryList = () => (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">History</h4>
        {(user.speakingSessions || []).slice().reverse().map(session => (
            <div key={session.id} className="p-4 bg-bg-card border border-border rounded-xl shadow-sm flex flex-col gap-3 transition-all hover:shadow-md group">
                <div className="flex justify-between items-start">
                    <div className="pr-4 flex-1">
                        <p className="text-sm font-bold text-text-primary line-clamp-1">{session.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-secondary px-2 py-0.5 bg-bg-hover rounded">{session.type === 'daily' ? 'Challenge' : session.type === 'gd' ? 'GD Sim' : 'Free'}</span>
                            <span className="text-xs text-text-secondary">{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm font-bold text-accent-primary">{Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}</span>
                        <button 
                            onClick={() => initiateDelete(session.id)}
                            className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete Session"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {session.audioData ? (
                    <div className="mt-1 bg-bg-hover/50 p-2 rounded-lg border border-border/50">
                        <audio 
                        controls 
                        src={`data:${session.mimeType || 'audio/webm'};base64,${session.audioData}`} 
                        className="w-full h-8" 
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-text-secondary italic pl-1">
                        <Volume2 className="w-3 h-3 opacity-50" />
                        No recording
                    </div>
                )}
            </div>
        ))}
        
        {(user.speakingSessions || []).length === 0 && (
            <div className="text-center py-8 text-text-secondary italic text-sm">
                No sessions recorded yet. Start speaking!
            </div>
        )}
    </div>
  );

  // Content for Right Sidebar (Desktop) or Progress Tab (Mobile)
  const renderProgressContent = () => (
    <div className="space-y-6 h-full lg:h-auto overflow-y-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {renderStats()}

        <div className="bg-bg-hover p-4 rounded-xl border border-border shadow-sm">
            <h4 className="text-xs font-bold text-text-primary mb-4 uppercase">Activity Trend</h4>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={1}/>
                            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.6}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: 'var(--text-secondary)'}} 
                        dy={10}
                    />
                    <YAxis hide={true} />
                    <Tooltip 
                        cursor={{fill: 'var(--bg-hover)'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--card-bg)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-secondary)' }}
                    />
                    <Bar dataKey="duration" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {renderImprovementChart()}
        
        {renderHistoryList()}
    </div>
  );

  // Shared completed session view
  const CompletedView = () => (
    <div className="p-8 text-center space-y-6 animate-in slide-in-from-bottom-5 flex-1 flex flex-col justify-center items-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shadow-inner mb-2">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-2xl font-black text-text-primary">Great Effort!</h3>
        <p className="text-text-secondary mt-1">Consistency is the key to confidence.</p>
      </div>

      {audioUrl && (
        <div className="max-w-sm mx-auto p-4 bg-bg-hover rounded-xl border border-border flex flex-col gap-3 w-full">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest text-left">Recording</p>
            </div>
            <audio controls src={audioUrl} className="w-full h-8" />
            <div className="flex justify-between items-center gap-2 mt-2">
              <a 
                href={audioUrl} 
                download={`speaking-session-${new Date().toISOString()}.webm`}
                className="flex-1 text-xs font-bold text-accent-primary hover:text-accent-hover flex items-center justify-center gap-1 py-2 border border-accent-primary/20 rounded-lg px-3 hover:bg-accent-primary/5 transition-colors"
              >
                  <Download className="w-3 h-3" /> Save
              </a>
              <button 
                onClick={handleAnalyzeAudio}
                disabled={isAnalyzing}
                className="flex-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center justify-center gap-1 py-2 border border-purple-500/20 rounded-lg px-3 hover:bg-purple-500/10 transition-colors"
              >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
              </button>
            </div>
        </div>
      )}

      {analysisFeedback && (
          <div className="max-w-lg mx-auto bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-5 text-left animate-in fade-in w-full">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-sm text-text-primary">AI Feedback</h4>
            </div>
            <div className="text-xs sm:text-sm text-text-primary whitespace-pre-line leading-relaxed">
                {analysisFeedback}
            </div>
          </div>
      )}

      <div className="max-w-sm mx-auto p-4 bg-bg-hover rounded-xl border border-border w-full flex items-center gap-3">
        <input 
          type="checkbox" 
          id="fearStop"
          className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
          checked={fearStop}
          onChange={(e) => setFearStop(e.target.checked)}
        />
        <label htmlFor="fearStop" className="text-sm font-medium text-text-primary cursor-pointer flex-1 text-left">
          I froze during this session
        </label>
      </div>

      <button 
        onClick={handleSaveAndClose}
        className="w-full max-w-sm px-8 py-4 bg-accent-primary text-white rounded-xl font-bold transition-all shadow-lg hover:bg-accent-hover active:scale-95"
      >
        Complete & Save
      </button>
    </div>
  );

  const tabs = [
    { id: 'daily', label: 'Daily Challenge', icon: Zap, mobileOnly: false },
    { id: 'free', label: 'Free Practice', icon: RefreshCcw, mobileOnly: false },
    { id: 'gd', label: 'GD Simulator', icon: BrainCircuit, mobileOnly: false },
    { id: 'progress', label: 'History & Stats', icon: BarChart2, mobileOnly: true },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8 relative">
      {/* HEADER: Full width for mobile, part of main col for desktop */}
      <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 lg:mb-0">
        <div>
          <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Mic2 className="w-8 h-8 text-accent-primary" />
            Speaking Lab
          </h2>
          <p className="text-text-secondary mt-1">Refine your speech, overcome fear, and master GDs.</p>
        </div>
      </div>

      {/* LEFT COLUMN: Controls & Active Session */}
      <div className="col-span-1 lg:col-span-8 space-y-6">
        
        {/* STREAK BANNER - MOBILE ONLY */}
        <div className="lg:hidden">
          {renderStreakBanner()}
        </div>

        {/* NAVIGATION TABS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); resetSession(); }}
                className={`flex items-center justify-center gap-2 py-5 rounded-2xl font-bold transition-all border shadow-sm ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/20' 
                : 'bg-bg-card border-border text-text-secondary hover:bg-bg-hover'
                } ${tab.mobileOnly ? 'lg:hidden' : ''}`}
            >
                <tab.icon className="w-5 h-5" />
                {tab.label}
            </button>
            ))}
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-bg-card border border-border rounded-3xl lg:overflow-visible overflow-hidden shadow-sm min-h-[480px] lg:min-h-[550px] relative flex flex-col lg:h-auto">
            {activeTab === 'daily' && (
            <div className="h-full flex flex-col">
                {sessionState === 'idle' && (
                <div className="p-6 space-y-6 flex-1 flex flex-col items-center animate-in fade-in overflow-y-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    
                    <div className="w-full space-y-4 bg-bg-hover/30 p-4 rounded-2xl border border-border/50">
                    <div className="text-center">
                        <span className="text-xs font-bold text-accent-primary uppercase tracking-widest block mb-2">Today's Topic</span>
                        <h4 className="text-xl font-bold text-text-primary leading-tight">
                        {currentChallenge ? currentChallenge.topic : "Loading new challenge..."}
                        </h4>
                        <p className="text-sm text-text-secondary mt-2">{currentChallenge?.angle}</p>
                    </div>
                    
                    <button 
                        onClick={handleStartThinking}
                        disabled={!currentChallenge}
                        className="w-full py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-accent-primary/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                        Begin
                    </button>
                    </div>
                    
                    <div className="text-center max-w-xs mx-auto">
                    <p className="text-xs text-text-secondary italic">"The only way to conquer fear is to do the thing you fear."</p>
                    </div>
                </div>
                )}

                {(sessionState === 'thinking' || sessionState === 'speaking') && (
                <div className="p-8 flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
                    {/* CIRCULAR TIMER */}
                    <div className="relative w-64 h-64 flex items-center justify-center mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 288 288">
                        {/* Background Circle */}
                        <circle
                        cx="144"
                        cy="144"
                        r="128"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-200 dark:text-slate-800"
                        />
                        {/* Progress Circle */}
                        <circle
                        cx="144"
                        cy="144"
                        r="128"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ease-linear ${sessionState === 'thinking' ? 'text-amber-500' : 'text-blue-500'}`}
                        />
                    </svg>
                    
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-full">
                        <span className={`text-xs font-bold tracking-[0.2em] mb-3 ${sessionState === 'thinking' ? 'text-amber-500' : 'text-blue-500'}`}>
                        {sessionState === 'thinking' ? 'PREPARING' : 'ON AIR'}
                        </span>
                        <div className="text-6xl font-black tabular-nums text-text-primary tracking-tighter drop-shadow-sm mb-2">
                        {renderTimer()}
                        </div>
                        {sessionState === 'speaking' && (
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Recording</span>
                        </div>
                        )}
                    </div>
                    </div>

                    <div className="p-4 bg-bg-hover/50 rounded-xl w-full text-center max-w-sm border border-border/50 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest block mb-1">Topic</span>
                        <h4 className="font-bold text-text-primary line-clamp-2 text-lg">
                            {currentChallenge?.topic}
                        </h4>
                    </div>

                    <div className="w-full max-w-sm">
                    {sessionState === 'thinking' ? (
                        <button 
                        onClick={handleStartSpeaking}
                        className="w-full py-4 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                        <Mic className="w-5 h-5" />
                        Start Speaking Now
                        </button>
                    ) : (
                        <button 
                        onClick={handleEndSession}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                        <Square className="w-5 h-5 fill-current" />
                        Finish Session
                        </button>
                    )}
                    </div>
                </div>
                )}

                {sessionState === 'completed' && <CompletedView />}
            </div>
            )}

            {activeTab === 'free' && (
            <div className="h-full flex flex-col p-6">
                {sessionState === 'idle' && (
                <div className="max-w-2xl mx-auto space-y-6 w-full flex-1 flex flex-col justify-center animate-in fade-in">
                    <div className="text-center">
                    <h3 className="text-xl font-bold text-text-primary">Free Practice</h3>
                    <p className="text-sm text-text-secondary mt-1">Pick a topic or go random.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                        <textarea 
                            placeholder="What do you want to talk about?"
                            className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-accent-primary resize-none min-h-[100px]"
                            value={freeTopic}
                            onChange={(e) => setFreeTopic(e.target.value)}
                        />
                        <button 
                            onClick={() => setFreeTopic(TOPICS[Math.floor(Math.random() * TOPICS.length)].topic)}
                            className="absolute bottom-3 right-3 p-2 bg-bg-card border border-border rounded-lg hover:text-accent-primary transition-colors shadow-sm"
                            title="Random Topic"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                        {['Easy', 'Medium', 'Hard', 'Brutal'].map(level => (
                            <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                difficulty === level 
                                ? getDifficultyColor(level)
                                : 'bg-bg-input text-text-secondary border-transparent hover:bg-bg-hover'
                            }`}
                            >
                            {level}
                            </button>
                        ))}
                        </div>
                    </div>

                    <button 
                    disabled={!freeTopic}
                    onClick={handleStartSpeaking}
                    className="w-full py-4 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
                    >
                    <Play className="w-5 h-5 fill-current" />
                    Start Session
                    </button>
                </div>
                )}
                
                {(sessionState === 'thinking' || sessionState === 'speaking') && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in">
                    {/* REUSED CIRCULAR TIMER FOR FREE MODE */}
                    <div className="relative w-64 h-64 flex items-center justify-center mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 288 288">
                        <circle cx="144" cy="144" r="128" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                        <circle cx="144" cy="144" r="128" stroke="currentColor" strokeWidth="6" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-full">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500 mb-3">ON AIR</span>
                        <div className="text-6xl font-black tabular-nums text-text-primary tracking-tighter mb-2">{renderTimer()}</div>
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Recording</span>
                        </div>
                    </div>
                    </div>

                    <div className="p-4 bg-bg-hover/50 rounded-xl w-full text-center max-w-sm">
                    <h4 className="font-bold text-text-primary line-clamp-2">{freeTopic}</h4>
                    </div>

                    <button 
                    onClick={handleEndSession}
                    className="w-full max-w-sm py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                    <Square className="w-5 h-5 fill-current" />
                    End Practice
                    </button>
                </div>
                )}

                {sessionState === 'completed' && <CompletedView />}
            </div>
            )}

            {activeTab === 'gd' && (
            <div className="p-8 h-full relative overflow-hidden flex flex-col">
                {sessionState === 'idle' && (
                    <div className="max-w-xl mx-auto space-y-8 text-center flex-1 flex flex-col justify-center">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                        <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary">GD Simulator</h3>
                        <p className="text-text-secondary mt-2 text-sm">High pressure simulation with random interruptions.</p>
                    </div>
                    <button 
                        onClick={() => {
                            const available = TOPICS.filter(t => !user.usedSpeakingTopics.includes(t.id));
                            const t = available.length > 0 
                            ? available[Math.floor(Math.random() * available.length)] 
                            : TOPICS[Math.floor(Math.random() * TOPICS.length)];
                            
                            setCurrentChallenge({ topic: t.topic, topicId: t.id });
                            setTimer(20);
                            setMaxTime(20);
                            setSessionState('thinking');
                        }}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        Enter Simulation
                    </button>
                    </div>
                )}
                
                {(sessionState === 'thinking' || sessionState === 'speaking') && (
                    <div className="flex flex-col items-center h-full space-y-8 py-6 animate-in fade-in">
                    <div className="text-6xl font-black tabular-nums text-text-primary tracking-tighter">{renderTimer()}</div>
                    <div className="p-6 bg-bg-hover border-2 border-border rounded-2xl w-full text-center relative">
                        <h4 className="text-xl font-bold text-text-primary">{currentChallenge?.topic}</h4>
                        {gdPrompt && (
                            <div className="absolute inset-x-0 -bottom-14 flex justify-center animate-in slide-in-from-bottom-2">
                            <div className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 animate-pulse" />
                                {gdPrompt}
                            </div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleEndSession} className="w-full max-w-sm py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg mt-auto">Exit & Finish</button>
                    </div>
                )}

                {sessionState === 'completed' && <CompletedView />}
            </div>
            )}

            {/* Mobile Progress Tab */}
            {activeTab === 'progress' && (
                <div className="p-6 h-full lg:hidden">
                    {renderProgressContent()}
                </div>
            )}
        </div>
      </div>

      {/* RIGHT COLUMN: Desktop Sidebar */}
      <div className="hidden lg:col-span-4 lg:flex lg:flex-col lg:gap-6">
        {renderStreakBanner()}
        <div className="bg-bg-card border border-border rounded-3xl p-6 shadow-sm flex-1 lg:flex-none lg:h-auto overflow-hidden lg:overflow-visible flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-accent-primary" />
                History & Stats
            </h3>
            {renderProgressContent()}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl transform transition-all scale-100">
              <div className="text-center">
                 <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                 </div>
                 <h3 className="text-lg font-bold text-text-primary mb-2">Delete Recording?</h3>
                 <p className="text-sm text-text-secondary mb-6">
                    This action cannot be undone. Are you sure you want to permanently delete this session?
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 bg-bg-hover text-text-primary font-medium rounded-xl hover:bg-bg-input transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                        Delete
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingLab;
