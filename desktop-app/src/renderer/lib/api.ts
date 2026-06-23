import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export const api = {
  getOrders: () => axios.get(`${API_BASE}/orders`),
  updateOrderStatus: (id: string, status: string) => axios.patch(`${API_BASE}/orders/${id}/status`, { status }),
  confirmPayment: (id: string) => axios.patch(`${API_BASE}/orders/${id}/confirm-payment`),
  uploadFile: (formData: FormData) => axios.post(`${API_BASE}/upload`, formData),
  // Add other calls as needed
}