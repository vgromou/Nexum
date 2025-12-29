import React from 'react';
import { Bell, User, Plus } from 'lucide-react';
import './ActivityBar.css';

const ActivityBar = () => {
  return (
    <div className="activity-bar">
      {/* Workspaces Section */}
      <div className="workspace-list">
        {/* Add Workspace Button */}
        <button className="workspace-item add-workspace" aria-label="Add workspace">
          <Plus size={24} strokeWidth={1.5} />
        </button>

        {/* Workspace 3: Red */}
        <button className="workspace-item workspace-red" aria-label="Red workspace"></button>

        {/* Workspace 2: Orange */}
        <button className="workspace-item workspace-orange" aria-label="Orange workspace"></button>

        {/* Workspace 1: Purple */}
        <button className="workspace-item workspace-purple" aria-label="Purple workspace"></button>
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        {/* Notifications */}
        <button className="icon-btn-ghost" aria-label="Notifications">
          <Bell size={24} strokeWidth={1.5} />
        </button>

        {/* User Profile */}
        <button className="user-avatar" aria-label="User profile">
          <User size={20} strokeWidth={1.5} className="user-avatar-icon" />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;
