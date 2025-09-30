import axios from "axios";

const api = axios.create({
  baseURL: "mongodb://mongo:wirKNrCHWRhAzrDfqGPdoWkMXJTxEmby@mongodb.railway.internal:27017",
});

export default api;
