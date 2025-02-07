import axios from 'axios';
import AuthStorage from '../utils/AuthStorage';

const axiosClient = axios.create();

axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = AuthStorage.getIdToken();
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;
