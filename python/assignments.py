from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

app = FastAPI()

# --- Schemas (TypeScript Type Definitions tương ứng ở Backend) ---
class SubmissionCreate(BaseModel):
    student_id: int
    assignment_id: int
    file_url: str
    current_attempt: int

class GradeSubmission(BaseModel):
    rubric_grades: Dict[str, float]  # Ví dụ: {"truy_van_sql": 8.5, "giao_dien": 9.0}
    feedback: str
    is_revision_required: bool

# --- 1. Logic Cảnh báo vắng vượt ngưỡng ---
@app.get("/api/students/{student_id}/attendance-warning")
def check_attendance_warning(student_id: int, total_sessions: int, absent_count: int):
    ABSENT_THRESHOLD = 0.20  # Ngưỡng 20%
    absent_rate = absent_count / total_sessions if total_sessions > 0 else 0
    
    is_warning = absent_rate >= ABSENT_THRESHOLD
    return {
        "student_id": student_id,
        "absent_count": absent_count,
        "total_sessions": total_sessions,
        "absent_rate": f"{absent_rate * 100:.1f}%",
        "is_warning": is_warning,
        "message": "CẢNH BÁO: Học viên vắng quá số buổi quy định!" if is_warning else "Chuyên cần đạt yêu cầu."
    }

# --- 2. Logic Nộp bài tập (Cho phép nộp lần 2) ---
@app.post("/api/submissions")
def submit_assignment(payload: SubmissionCreate):
    MAX_ATTEMPTS = 2
    if payload.current_attempt >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã hết số lần nộp bài (Tối đa 2 lần)."
        )
    
    new_attempt = payload.current_attempt + 1
    return {
        "success": True,
        "message": f"Nộp bài lần {new_attempt} thành công!",
        "attempt": new_attempt,
        "file_url": payload.file_url,
        "submitted_at": datetime.now().isoformat()
    }

# --- 3. Logic Chấm bài theo Rubric / Yêu cầu làm lại ---
@app.put("/api/submissions/{submission_id}/grade")
def grade_submission(submission_id: int, payload: GradeSubmission):
    total_score = sum(payload.rubric_grades.values()) / len(payload.rubric_grades) if payload.rubric_grades else 0.0
    status_str = "REVISION_REQUIRED" if payload.is_revision_required else "GRADED"
    
    return {
        "submission_id": submission_id,
        "total_score": round(total_score, 2),
        "status": status_str,
        "feedback": payload.feedback,
        "rubric_grades": payload.rubric_grades
    }