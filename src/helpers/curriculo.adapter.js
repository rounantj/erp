import { urlBase } from "./environment";
import axios from "axios";
const headers = {
  "Content-Type": "application/json",
};

export const makeCurriculum = async (personalData) => {
  const response = await axios.post(
    `${urlBase}/fofa-ai/query-curriculo`,
    { personalData },
    { headers }
  );
  return response;
};

export const createdCurriculum = async (content, usingAi, prompt, id) => {
  const response = await axios.post(
    `${urlBase}/fofa-ai/created-curriculo`,
    { content, usingAi, prompt, id },
    { headers }
  );
  return response;
};

export const listCurriculums = async (search) => {
  const { data } = await axios.get(`${urlBase}/fofa-ai/curriculos`, { params: { search }, headers });
  return Array.isArray(data) ? data : [];
};

export const getCurriculum = async (id) => {
  const { data } = await axios.get(`${urlBase}/fofa-ai/curriculos/${id}`, { headers });
  return data;
};
