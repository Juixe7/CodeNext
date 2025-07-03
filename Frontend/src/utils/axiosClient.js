import axios from "axios"
const axiosClient = axios.Client({
    baseURL:'http://localhost:3000',
    withCredentials:true,
    headers: {
        'Content-Type' : 'application/json'
    }
});

export default axiosClient;