import {
  type RetryMode,
  ServiceBusClient,
  type ServiceBusClientOptions,
} from "@azure/service-bus";

import {
  SB_CLIENT_ID,
  SB_CLIENT_MAX_RECONNECTION_ATTEMPTS,
  SB_CLIENT_MAX_TIMEOUT,
  SB_CLIENT_RETRY_DELAY,
  SB_CLIENT_RETRY_MODE,
  SB_CONNECTION_STRING,
} from "../../config";

const ServiceBusClientsPerHost: { [host: string]: ServiceBusClient } = {};

export interface ServiceBusClientConfig {
  host: string;
  clientId: string;
  maxRetries: number;
  timeoutInMs: number;
  retryDelayInMs: number;
  retryMode: RetryMode;
}

const getConfig = (): ServiceBusClientConfig => {
  return {
    host: SB_CONNECTION_STRING,
    clientId: SB_CLIENT_ID,
    maxRetries: SB_CLIENT_MAX_RECONNECTION_ATTEMPTS,
    timeoutInMs: SB_CLIENT_MAX_TIMEOUT,
    retryDelayInMs: SB_CLIENT_RETRY_DELAY,
    retryMode: SB_CLIENT_RETRY_MODE,
  };
};

export const getClientPerHost = (host: string) => {
  const { clientId, maxRetries, timeoutInMs, retryDelayInMs, retryMode } =
    getConfig();

  if (!host) {
    host = getConfig().host;
  }

  let serviceBusClient = ServiceBusClientsPerHost[host];

  if (serviceBusClient) {
    return serviceBusClient;
  }

  const serviceBusConfig: ServiceBusClientOptions = {
    identifier: clientId,
    retryOptions: {
      maxRetries,
      retryDelayInMs,
      timeoutInMs,
      mode: retryMode,
      maxRetryDelayInMs: 300,
    },
  };

  serviceBusClient = new ServiceBusClient(
    SB_CONNECTION_STRING,
    serviceBusConfig,
  );
  ServiceBusClientsPerHost[host] = serviceBusClient;

  return serviceBusClient;
};
