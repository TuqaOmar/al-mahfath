import React from 'react';
import { AdminDashboard } from './admin/AdminDashboard';

export const AdminPanel = ({ onSwitchToHome }) => {
  return <AdminDashboard onNavigateTab={onSwitchToHome} />;
};

export default AdminPanel;
