import { API_KEY_HEADER, AUTH_SERVICE_URL, POST_REQUEST_TIMEOUT } from "../../../config";
import { Event } from "../../../types";
import { makeRequest, RequestResult } from "../request";

const throwIfStatusIsNotOk = (result: RequestResult) => {
  if (result.status !== 200) throw new Error(`Got ${result.status} invoking notify!!!`);
};

export const notify = async (_topic: string, data: Event<unknown>[]) => {
  const url = `${AUTH_SERVICE_URL}/events`;
  const headers = {
    [API_KEY_HEADER]: AUTH_SERVICE_URL,
  };

  const requestData = {
    data,
    headers,
    method: "POST",
    timeout: POST_REQUEST_TIMEOUT,
  };

  const result = await makeRequest(url, requestData);
  throwIfStatusIsNotOk(result);

  return result.data;
};
