import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const ProjectModal = ({ onClose, onSave, project }) => {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
    status: project?.status || 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (project) {
        const res = await projectAPI.update(project._id, form);
        onSave(res.data.project, 'update');
      } else {
        const res = await projectAPI.create(form);
        onSave(res.data.project, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input type="text" className="form-control" placeholder="e.g. E-commerce Redesign"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="What is this project about?"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-control"
                value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            {project && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Active', 'On Hold', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectAPI.getAll()
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved, type) => {
    if (type === 'create') setProjects(prev => [saved, ...prev]);
    else setProjects(prev => prev.map(p => p._id === saved._id ? saved : p));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { Active: '#10b981', Completed: '#6366f1', 'On Hold': '#f59e0b', Cancelled: '#ef4444' };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={handleSave}
        />
      )}

      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
          + New Project
        </button>
      </div>

      <div className="search-bar">
        <input type="text" className="form-control" placeholder="Search projects..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
          {!search && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-header">
                <div className="project-status-dot" style={{ background: statusColors[project.status] || '#94a3b8' }} />
                <span className="project-status">{project.status}</span>
                <div className="project-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditProject(project); setShowModal(true); }}>Edit</button>
                  {(user?.role === 'Admin' || project.owner?._id === user?._id) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project._id)}>Delete</button>
                  )}
                </div>
              </div>
              <Link to={`/projects/${project._id}`} className="project-card-link">
                <h3 className="project-name">{project.name}</h3>
                {project.description && <p className="project-desc">{project.description}</p>}
              </Link>
              <div className="project-meta">
                <span>👤 {project.owner?.name}</span>
                <span>👥 {project.members?.length} members</span>
                <span>📋 {project.taskCounts?.total || 0} tasks</span>
              </div>
              {project.taskCounts?.total > 0 && (
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${(project.taskCounts.Done / project.taskCounts.total) * 100}%`,
                      background: '#10b981'
                    }} />
                  </div>
                  <span>{Math.round((project.taskCounts.Done / project.taskCounts.total) * 100)}% done</span>
                </div>
              )}
              {project.deadline && (
                <div className="project-deadline">
                  📅 Due {new Date(project.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
