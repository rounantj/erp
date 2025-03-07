//export const urlBase = "https://erp-api-a826ac7bcd67.herokuapp.com";
export const urlBase = "http://localhost:3009";
import axios from "axios";
axios.interceptors.request.use(
  (config) => {
    console.log({ config });
    if (config.url.includes(urlBase)) {
      const token = localStorage.getItem("api_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
