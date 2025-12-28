import axios from "axios";

const isDev = process.env.NODE_ENV === "development";

export const urlBase = isDev
  ? "http://localhost:3009"
  : "https://erp-api-a826ac7bcd67.herokuapp.com";
axios.interceptors.request.use(
  (config) => {
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
