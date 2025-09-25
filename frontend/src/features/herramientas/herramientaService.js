import api from "../../services/api";

export const getHerramientas = async () => {
  const res = await api.get("/herramientas");
  return res.data;
};
