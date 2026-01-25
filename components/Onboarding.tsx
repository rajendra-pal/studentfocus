import React, { useState } from 'react';
import { UserData, DAYS_OF_WEEK } from '../types';
import { dataService } from '../services/db';
import { Save, Plus, X } from 'lucide-react';

interface OnboardingProps {
  user: UserData;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    semester: '',
    targetSgpa: '',
    careerFocus: ''
  });
  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map(day => ({ day, subjects: [] as string[] }))
  );
  const [tempSubject, setTempSubject] = useState('');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleRemoveSubject = (dayIndex: number, subIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].subjects.splice(subIndex, 1);
    setSchedule(newSchedule);
  };

  const handleFinalSubmit = () => {
    dataService.saveOnboarding(user.email, profile, schedule);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-800">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Setup Your Profile</h2>
          <p className="text-blue-100 text-sm">Step {step} of 2</p>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Semester Name</label>
                <input
                  required
                  type="text"
                  className="bg-slate-800 w-full border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 px-3 border text-gray-100 placeholder-gray-500"
                  placeholder="e.g. Semester 5"
                  value={profile.semester}
                  onChange={e => setProfile({...profile, semester: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target SGPA / GPA</label>
                <input
                  required
                  type="text"
                  className="bg-slate-800 w-full border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 px-3 border text-gray-100 placeholder-gray-500"
                  placeholder="e.g. 9.0"
                  value={profile.targetSgpa}
                  onChange={e => setProfile({...profile, targetSgpa: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Career Focus / Goal</label>
                <input
                  required
                  type="text"
                  className="bg-slate-800 w-full border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 px-3 border text-gray-100 placeholder-gray-500"
                  placeholder="e.g. Data Scientist, Full Stack Dev"
                  value={profile.careerFocus}
                  onChange={e => setProfile({...profile, careerFocus: e.target.value})}
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next: Set Schedule
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-gray-400 text-sm">
                Add subjects for each day of the week. This generates your dashboard schedule.
              </p>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {schedule.map((dayData, index) => (
                  <div key={dayData.day} className="bg-slate-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-gray-200 mb-3">{dayData.day}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {dayData.subjects.length === 0 && <span className="text-xs text-gray-500 italic">No subjects added</span>}
                      {dayData.subjects.map((sub, subIdx) => (
                        <span key={subIdx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-200 border border-blue-800">
                          {sub}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(index, subIdx)}
                            className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-800 hover:text-blue-300 focus:outline-none"
                          >
                            <span className="sr-only">Remove</span>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="bg-gray-900 flex-1 min-w-0 block w-full px-3 py-1.5 rounded-md border border-gray-600 text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-600"
                        placeholder="Add subject..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                             const val = (e.target as HTMLInputElement).value;
                             if(val) {
                               const newSched = [...schedule];
                               newSched[index].subjects.push(val);
                               setSchedule(newSched);
                               (e.target as HTMLInputElement).value = '';
                             }
                          }
                        }}
                      />
                      <button
                         onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            if(input.value) {
                               const newSched = [...schedule];
                               newSched[index].subjects.push(input.value);
                               setSchedule(newSched);
                               input.value = '';
                            }
                         }}
                         className="inline-flex items-center p-1.5 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                 <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-slate-800 hover:bg-slate-700 focus:outline-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;