import axios from "axios"

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
    headers: {
        timeout: 30000
    }
})

export default axiosInstance