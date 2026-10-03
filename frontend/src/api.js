import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8011";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export const analyzeMaterial = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/api/analyze",
    formData
  );

  return response.data;
};

export const getStudyMaterial = async (documentId) => {
  const response = await api.get(
    `/api/study/${documentId}`
  );

  return response.data;
};

export const getQuiz = async (documentId) => {
  const response = await api.get(
    `/api/quiz/${documentId}`
  );

  return response.data;
};

export const chatWithMaterial = async (
  documentId,
  question
) => {
  const response = await api.post(
    "/api/chat",
    {
      document_id: documentId,
      question,
    }
  );

  return response.data;
};

export default api;