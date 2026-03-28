import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/testsuites" className="header-logo">
          🧪 TMS
        </Link>
        <nav className="header-nav">
          <NavLink
            to="/testsuites"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            TestSuites
          </NavLink>
          <NavLink
            to="/testruns"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            TestRuns
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            Reports
          </NavLink>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {user && (
            <>
              <div className="user-info">
                <span className="user-name">{user.user_name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
