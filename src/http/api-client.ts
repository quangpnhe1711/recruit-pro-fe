import axios from 'axios'
import { HTTP_STATUS } from '../common/constants/http.constants'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      return Promise.reject(new Error('Unauthorized'))
    }

    return Promise.reject(error)
  },
)

export default apiClient
