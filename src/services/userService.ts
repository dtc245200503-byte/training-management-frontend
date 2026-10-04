import axios from 'axios';

// Lấy URL Backend từ biến môi trường hoặc mặc định localhost
const API_URL = 'http://localhost:8000/api';

export interface ImportExcelResponse {
  message: string;
  total_rows: number;
  success_count: number;
  failed_count: number;
  errors: string[];
}

export const importUsersFromExcel = async (file: File): Promise<ImportExcelResponse> => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');

  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<ImportExcelResponse>(
    `${API_URL}/users/import-excel`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};