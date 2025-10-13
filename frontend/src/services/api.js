import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-production-01e4.up.railway.app/api",
});

export default api;
