import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",

});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Communication API functions
export const sendEmailToLoanUser = async (loanId, emailData) => {
  return await API.post(`/loans/${loanId}/send-email/`, emailData);
};

export const sendWhatsAppToLoanUser = async (loanId, messageData) => {
  return await API.post(`/loans/${loanId}/send-whatsapp/`, messageData);
};

export default API;