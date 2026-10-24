import React, { useState } from 'react';
import { AttendanceStatus, SubmissionPayload } from './types/assignment';

interface Props {
  studentId: number;
  assignmentId: number;
  attendance: AttendanceStatus;
}

export const AssignmentSubmission: React.FC<Props> = ({ studentId, assignmentId, attendance }) => {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [attempt, setAttempt] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const handleUploadAndSubmit = async () => {
    if (attempt >= 2) {
      alert('Bạn đã nộp tối đa 2 lần!');
      return;
    }

    const payload: SubmissionPayload = {
      student_id: studentId,
      assignment_id: assignmentId,
      file_url: fileUrl,
      current_attempt: attempt,
    };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setAttempt(data.attempt);
        setStatusMsg(data.message);
      } else {
        setStatusMsg(data.detail || 'Có lỗi xảy ra.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Lỗi kết nối máy chủ.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* 1. Hiển thị Cảnh báo vắng học nếu có */}
      {attendance.is_warning && (
        <div style={{ backgroundColor: '#ffebe9', color: '#cf222e', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          ⚠️ <strong>{attendance.message}</strong> (Tỷ lệ vắng: {attendance.absent_rate})
        </div>
      )}

      {/* 2. Giao diện nộp bài */}
      <h3>Nộp bài tập (Lần {attempt}/2)</h3>
      <input
        type="text"
        placeholder="Nhập link bài làm (GitHub/Drive)..."
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
        style={{ width: '300px', padding: '8px', marginRight: '10px' }}
      />
      <button 
        onClick={handleUploadAndSubmit} 
        disabled={attempt >= 2}
        style={{ padding: '8px 16px', backgroundColor: '#183e35', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {attempt === 0 ? 'Nộp bài lần 1' : 'Nộp lại (Lần 2)'}
      </button>

      {statusMsg && <p style={{ marginTop: '10px', color: '#2c6e59' }}>{statusMsg}</p>}
    </div>
  );
};