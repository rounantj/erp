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

export const createdCurriculum = async (content, usingAi, prompt) => {
  const response = await axios.post(
    `${urlBase}/fofa-ai/created-curriculo`,
    { content, usingAi, prompt },
    { headers }
  );
  return response;
};
