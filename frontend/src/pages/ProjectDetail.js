import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const priorityClass = (p) => ({ Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical' }[p] || 'medium');
const statusClass = (s) => ({ Todo: 'todo', 'In Progress': 'inprogress', Review: 'review', Done: 'done' }[s] || 'todo');

const TaskModal = ({ task, projectId, members, onClose, onSave }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    project: projectId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, assignedTo: form.assignedTo || null };
      if (task) {
        const res = await taskAPI.update(task._id, data);
        onSave(res.data.task, 'update');
      } else {
        const res = await taskAPI.create(data);
        onSave(res.data.task, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" className="form-control" placeholder="Task title"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="Task details..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control"
                  value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddMemberModal = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd(email, role);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-control" placeholder="member@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                <option>Member</option>
                <option>Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState('board');

  const loadData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(id),
        taskAPI.getByProject(id)
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      if (err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTaskSave = (saved, type) => {
    if (type === 'create') setTasks(prev => [saved, ...prev]);
    else setTasks(prev => prev.map(t => t._id === saved._id ? saved : t));
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await taskAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskAPI.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t));
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async (email, role) => {
    const res = await projectAPI.addMember(id, { email, role });
    setProject(res.data.project);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    await projectAPI.removeMember(id, memberId);
    setProject(prev => ({ ...prev, members: prev.members.filter(m => m.user._id !== memberId) }));
  };

  const isProjectAdmin = () => {
    if (user?.role === 'Admin') return true;
    if (project?.owner?._id === user?._id) return true;
    return project?.members?.some(m => m.user._id === user?._id && m.role === 'Admin');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="project-detail">
      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          members={project.members || []}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleTaskSave}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          onClose={() => setShowMemberModal(false)}
          onAdd={handleAddMember}
        />
      )}

      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span onClick={() => navigate('/projects')} className="breadcrumb-link">Projects</span>
            <span> / </span>
            <span>{project.name}</span>
          </div>
          <h1>{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isProjectAdmin() && (
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>+ Member</button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
            + Task
          </button>
        </div>
      </div>

      <div className="tabs">
        {['board', 'list', 'members'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-column">
              <div className="column-header">
                <span className={`badge badge-${statusClass(status)}`}>{status}</span>
                <span className="column-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="column-tasks">
                {tasksByStatus[status].map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-card-header">
                      <span className={`badge badge-${priorityClass(task.priority)}`}>{task.priority}</span>
                      <div className="task-card-actions">
                        <button className="icon-btn" title="Edit" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>✏️</button>
                        <button className="icon-btn" title="Delete" onClick={() => handleTaskDelete(task._id)}>🗑️</button>
                      </div>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    {task.description && <p className="task-desc">{task.description}</p>}
                    <div className="task-footer">
                      {task.assignedTo && (
                        <div className="task-assignee">
                          <div className="mini-avatar">{task.assignedTo.name?.[0]}</div>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <span className={`task-due ${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'overdue' : ''}`}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <select className="status-select" value={task.status}
                      onChange={e => handleStatusChange(task._id, e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="column-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card">
          {tasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet</p></div>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td><span className={`badge badge-${statusClass(task.status)}`}>{task.status}</span></td>
                    <td><span className={`badge badge-${priorityClass(task.priority)}`}>{task.priority}</span></td>
                    <td>{task.assignedTo?.name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}</td>
                    <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleTaskDelete(task._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Team Members ({project.members?.length})</h3>
            {isProjectAdmin() && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            )}
          </div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user._id} className="member-row">
                <div className="user-avatar">{m.user.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{m.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                {isProjectAdmin() && project.owner?._id !== m.user._id && m.user._id !== user?._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
