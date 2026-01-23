import React, { useState } from 'react';
import { UserData, Project } from '../types';
import { dataService } from '../services/db';
import { FolderGit2, Plus, X, Github, ExternalLink, Trash2, Calendar, Layout, Edit2, Check, AlertTriangle } from 'lucide-react';

interface ProjectsProps {
  user: UserData;
  onUpdate: () => void;
}

const Projects: React.FC<ProjectsProps> = ({ user, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });

  // State for Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Data Analysis');
  const [status, setStatus] = useState<Project['status']>('Not Started');
  const [techStack, setTechStack] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleEdit = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(project.id);
    setName(project.name);
    setCategory(project.category);
    setStatus(project.status);
    setTechStack(project.techStack.join(', '));
    setGithubLink(project.githubLink || '');
    setKeyLearnings(project.keyLearnings || '');
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const projectData: Project = {
      id: editingId || Date.now().toString(),
      name,
      category,
      status,
      techStack: techStack.split(',').map(s => s.trim()).filter(s => s.length > 0),
      githubLink: githubLink.trim() || undefined,
      keyLearnings: keyLearnings.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      lastUpdated: new Date().toISOString()
    };

    if (editingId) {
      dataService.updateProject(user.email, projectData);
      showToastMessage('Project updated successfully!');
    } else {
      dataService.addProject(user.email, projectData);
      showToastMessage('New project added!');
    }

    onUpdate();
    handleCloseModal();
  };

  const initiateDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dataService.deleteProject(user.email, deleteId);
      onUpdate();
      showToastMessage('Project deleted successfully.');
      if (editingId === deleteId) {
        handleCloseModal();
      }
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    // Reset form
    setName('');
    setCategory('Data Analysis');
    setStatus('Not Started');
    setTechStack('');
    setGithubLink('');
    setKeyLearnings('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusColor = (status: Project['status']) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Projects</h2>
          <p className="text-text-secondary mt-1">Manage your portfolio and track project based learning.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg font-medium transition-colors shadow-sm shadow-accent-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add New Project
        </button>
      </div>

      {/* Projects Grid */}
      {user.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-bg-card/50 text-text-secondary min-h-[300px]">
          <div className="p-4 bg-bg-hover rounded-full mb-4">
            <Layout className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium mb-1">No projects yet</p>
          <p className="text-sm">Start building your portfolio by adding a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {user.projects.map((project) => (
            <div key={project.id} className="group bg-bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative">
              {/* Actions - Always visible on mobile, hover on desktop */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => handleEdit(project, e)}
                  className="p-2 bg-bg-card border border-border text-text-secondary hover:text-accent-primary hover:border-accent-primary rounded-lg transition-all shadow-sm"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => initiateDelete(project.id, e)}
                  className="p-2 bg-bg-card border border-border text-text-secondary hover:text-red-500 hover:border-red-500 rounded-lg transition-all shadow-sm"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-3 pr-20">
                 <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(project.status)}`}>
                   {project.status}
                 </span>
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-1">{project.name}</h3>
              <p className="text-sm text-text-secondary mb-4 flex items-center gap-2">
                <FolderGit2 className="w-3.5 h-3.5" />
                {project.category}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-bg-hover text-text-secondary text-xs rounded-md border border-border">
                    {tech}
                  </span>
                ))}
              </div>

              {(project.startDate || project.endDate) && (
                <div className="mb-4 text-xs text-text-secondary flex items-center gap-1.5">
                   <Calendar className="w-3 h-3" />
                   <span>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, {month:'short', year: 'numeric'}) : 'Start'} 
                      {' - '} 
                      {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, {month:'short', year: 'numeric'}) : 'Present'}
                   </span>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-border space-y-3">
                 {project.keyLearnings && (
                   <p className="text-sm text-text-secondary italic line-clamp-2">
                     "{project.keyLearnings}"
                   </p>
                 )}
                 
                 <div className="flex items-center justify-between pt-1 mt-2">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      Last update: {new Date(project.lastUpdated).toLocaleDateString()}
                    </span>
                    
                    {project.githubLink ? (
                      <a 
                        href={project.githubLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary hover:bg-bg-hover border border-border hover:border-accent-primary text-xs font-bold text-text-primary transition-all group/btn shadow-sm"
                        title="View on GitHub"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>View</span>
                        <ExternalLink className="w-3 h-3 text-text-secondary group-hover/btn:text-accent-primary transition-colors" />
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary/50 italic cursor-not-allowed">No Link</span>
                    )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-border overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in-0">
            
            {/* Mobile Drag Handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-border/60"></div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-text-primary">
                {editingId ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-bg-hover rounded-lg active:scale-95"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 pb-safe">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Sales Dashboard Analysis" 
                  className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
                  <select 
                    className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Data Analysis</option>
                    <option>Web Development</option>
                    <option>Mobile App</option>
                    <option>Machine Learning</option>
                    <option>System Design</option>
                    <option>DevOps</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Status</label>
                  <select 
                    className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Start & End Date - Improved UI */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Start Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-accent-primary transition-colors pointer-events-none" />
                      <input 
                        type="date" 
                        className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">End Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-accent-primary transition-colors pointer-events-none" />
                      <input 
                        type="date" 
                        className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                 </div>
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tech Stack (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="Python, Pandas, React, etc." 
                  className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              {/* Github Link */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">GitHub / Live Link</label>
                <div className="relative">
                   <input 
                    type="url" 
                    placeholder="https://github.com/..." 
                    className="w-full bg-bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all placeholder-text-secondary/50"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                  />
                  <Github className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                </div>
              </div>

              {/* Key Learnings */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description & Key Learnings</label>
                <textarea 
                  rows={3}
                  placeholder="Describe the project and what you learned..." 
                  className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all resize-none placeholder-text-secondary/50"
                  value={keyLearnings}
                  onChange={(e) => setKeyLearnings(e.target.value)}
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-lg font-bold transition-all shadow-md shadow-accent-primary/20 active:scale-[0.98]"
                >
                  {editingId ? 'Save Changes' : 'Create Project'}
                </button>
                
                {editingId && (
                  <button 
                    type="button"
                    onClick={(e) => initiateDelete(editingId, e)}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-all active:scale-[0.98]"
                  >
                    Delete Project
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Delete Project?</h3>
                <p className="text-text-secondary text-sm">Are you sure you want to delete this project? This action cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="py-2.5 px-4 bg-bg-hover text-text-primary font-medium rounded-xl hover:bg-bg-input transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-bg-card border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
             {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <span className="font-medium text-text-primary text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Projects;