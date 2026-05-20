import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const StatCard = ({ label, value, color, icon }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-icon" style={{ background: color + '18', color }}>{icon}</div>
    <div className="stat-body">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskAPI.getDashboardStats(), projectAPI.getAll()])
      .then(([statsRes, projRes]) => {
        setStats(statsRes.data);
        setRecentProjects(projRes.data.projects.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const completionRate = stats?.totalTasks
    ? Math.round((stats.taskStats.Done / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Here's what's happening with your projects</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Project
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Projects" value={stats?.totalProjects || 0} color="#6366f1" icon="📁" />
        <StatCard label="Total Tasks" value={stats?.totalTasks || 0} color="#3b82f6" icon="📋" />
        <StatCard label="My Pending Tasks" value={stats?.myPendingTasks || 0} color="#f59e0b" icon="⏳" />
        <StatCard label="Overdue Tasks" value={stats?.overdueTasks || 0} color="#ef4444" icon="🚨" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Task Status Overview</h3>
          <div className="task-status-list">
            {[
              { label: 'Todo', key: 'Todo', color: '#94a3b8' },
              { label: 'In Progress', key: 'In Progress', color: '#3b82f6' },
              { label: 'In Review', key: 'Review', color: '#f59e0b' },
              { label: 'Done', key: 'Done', color: '#10b981' },
            ].map(({ label, key, color }) => {
              const count = stats?.taskStats[key] || 0;
              const pct = stats?.totalTasks ? (count / stats.totalTasks) * 100 : 0;
              return (
                <div key={key} className="status-row">
                  <div className="status-info">
                    <span className="status-dot" style={{ background: color }} />
                    <span>{label}</span>
                    <span className="status-count">{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="completion-rate">
            <span>Overall completion</span>
            <strong style={{ color: '#10b981' }}>{completionRate}%</strong>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Recent Projects</h3>
            <Link to="/projects" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p>No projects yet</p>
              <Link to="/projects" className="btn btn-primary btn-sm">Create one</Link>
            </div>
          ) : (
            <div className="project-list">
              {recentProjects.map(project => (
                <Link key={project._id} to={`/projects/${project._id}`} className="project-item">
                  <div className="project-item-info">
                    <div className="project-item-name">{project.name}</div>
                    <div className="project-item-meta">{project.taskCounts?.total || 0} tasks · {project.members?.length || 0} members</div>
                  </div>
                  <span className={`badge badge-${project.status?.toLowerCase().replace(' ', '')}`}>{project.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
