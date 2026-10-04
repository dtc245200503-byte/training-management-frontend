import React, { useState } from 'react';
import { importUsersFromExcel, type ImportExcelResponse } from '../services/userService';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportUserModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportExcelResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await importUsersFromExcel(file);
      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Có lỗi xảy ra khi import file Excel!';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '24px', borderRadius: '8px',
        width: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Import người dùng từ Excel</h3>
        
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange}
          style={{ marginBottom: '16px', display: 'block', width: '100%' }}
        />

        {errorMsg && (
          <div style={{ color: '#d9534f', marginBottom: '12px', fontSize: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {result && (
          <div style={{ color: '#5cb85c', marginBottom: '12px', fontSize: '14px' }}>
            ✅ {result.message}: Thành công {result.success_count}/{result.total_rows}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button 
            onClick={onClose} 
            disabled={loading}
            style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button 
            onClick={handleUpload} 
            disabled={loading || !file}
            style={{ 
              padding: '6px 16px', borderRadius: '4px', border: 'none', 
              backgroundColor: '#0284c7', color: '#fff', cursor: loading || !file ? 'not-allowed' : 'pointer',
              opacity: loading || !file ? 0.6 : 1
            }}
          >
            {loading ? 'Đang tải lên...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};