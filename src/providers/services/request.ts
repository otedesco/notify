import axios from "axios";
import http from "http";
import https from "https";

export type RequestOptions = {
  data?: unknown;
  headers?: Record<string, string>;
  method?: string;
  timeout?: number;
};

export type RequestResult = {
  data: unknown;
  status: number;
};

class RequestError extends Error {
  constructor(message: any) {
    super(message);
    this.name = "RequestError";
  }
}

const defaultOptions = {
  data: undefined,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {},
  method: "GET",
  timeout: 10000,
};

export const makeRequest = async (url: string, options: RequestOptions): Promise<RequestResult> => {
  try {
    const axiosOptions = {
      ...defaultOptions,
      ...options,
      url,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    const { data, status } = await axios(axiosOptions);

    return { data, status };
  } catch (err) {
    throw new RequestError(err);
  }
};
