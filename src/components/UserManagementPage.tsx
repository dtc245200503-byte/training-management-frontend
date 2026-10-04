import React, { useState } from 'react';
import { ImportUserModal } from './ImportUserModal';
import type { CurrentUser } from '../types/auth';

interface UserManagementPageProps {
  user?: CurrentUser | null;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Kiểm tra quyền Admin dựa trên mảng roles
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SYSTEM_ADMIN');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
        
        {/* Chỉ hiển thị nút Import Excel nếu là Admin */}
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#16a34a', color: '#fff', padding: '8px 16px',
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500
            }}
          >
            📊 Import Excel
          </button>
        )}
      </div>

      <ImportUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          // Callback để load lại danh sách
        }}
      />
    </div>
  );
};