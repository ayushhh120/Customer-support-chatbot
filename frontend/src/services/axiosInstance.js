import axios from "axios"

const API = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    withCredentials : true
})


API.interceptors.response.use(
    response => response,
    error => {
        return Promise.reject(error)
    }
)


export default API;
