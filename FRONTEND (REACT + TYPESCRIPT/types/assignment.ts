export interface RubricGrade {
  [criterion: string]: number;
}

export interface SubmissionPayload {
  student_id: number;
  assignment_id: number;
  file_url: string;
  current_attempt: number;
}

export interface AttendanceStatus {
  is_warning: boolean;
  absent_rate: string;
  message: string;
}