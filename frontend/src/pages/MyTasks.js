import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../utils/api';
import './MyTasks.css';

const statusClass = (s) => ({ Todo: 'todo', 'In Progress': 'inprogress', Review: 'review', Done: 'done' }[s] || 'todo');
const priorityClass = (p) => ({ Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical' }[p] || 'medium');

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    taskAPI.getMyTasks()
      .then(res => {
        setTasks(res.data.tasks);
        setOverdue(res.data.overdue);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskAPI.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t));
    } catch (err) { console.error(err); }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'overdue') return overdue.some(o => o._id === t._id);
    if (filter === 'done') return t.status === 'Done';
    if (filter === 'pending') return t.status !== 'Done';
    return true;
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="overdue-banner">
          ⚠️ You have <strong>{overdue.length}</strong> overdue task{overdue.length !== 1 ? 's' : ''}
        </div>
      )}

      <div className="filter-tabs">
        {[['all', 'All'], ['pending', 'Pending'], ['overdue', 'Overdue'], ['done', 'Done']].map(([val, label]) => (
          <button key={val} className={`tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
            {label}
            <span className="filter-count">
              {val === 'all' ? tasks.length
                : val === 'overdue' ? overdue.length
                : val === 'done' ? tasks.filter(t => t.status === 'Done').length
                : tasks.filter(t => t.status !== 'Done').length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks here</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filtered.map(task => {
            const isOverdue = overdue.some(o => o._id === task._id);
            return (
              <div key={task._id} className={`my-task-card ${isOverdue ? 'overdue-card' : ''}`}>
                <div className="my-task-left">
                  <div className="my-task-badges">
                    <span className={`badge badge-${statusClass(task.status)}`}>{task.status}</span>
                    <span className={`badge badge-${priorityClass(task.priority)}`}>{task.priority}</span>
                    {isOverdue && <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>OVERDUE</span>}
                  </div>
                  <h4 className="my-task-title">{task.title}</h4>
                  {task.description && <p className="my-task-desc">{task.description}</p>}
                  <div className="my-task-meta">
                    <Link to={`/projects/${task.project._id}`} className="project-link">
                      📁 {task.project.name}
                    </Link>
                    {task.dueDate && (
                      <span className={isOverdue ? 'text-danger' : ''}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="my-task-right">
                  <select
                    className="status-select"
                    value={task.status}
                    onChange={e => handleStatusChange(task._id, e.target.value)}
                  >
                    {['Todo', 'In Progress', 'Review', 'Done'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
