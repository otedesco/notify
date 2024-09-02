import { ISocketFactoryArgs, Kafka, KafkaConfig, logLevel as loggingLevel, Mechanism, SASLOptions } from "kafkajs";
import net from "net";
import tls from "tls";

import {
  KAFKA_CLIENT_ENABLE_LOGS,
  KAFKA_CLIENT_HOST,
  KAFKA_CLIENT_ID,
  KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS,
  KAFKA_CLIENT_MAX_TIMEOUT,
  KAFKA_CLIENT_SSL,
} from "../../config";

const KEEP_ALIVE_DELAY = 10000;

const socketFactory = ({ host, port, ssl, onConnect }: ISocketFactoryArgs) => {
  const socket = ssl
    ? tls.connect(Object.assign({ host, port, servername: host }, ssl), onConnect)
    : net.connect({ host, port }, onConnect);
  socket.setKeepAlive(true, KEEP_ALIVE_DELAY);
  socket.setTimeout(30000);

  return socket;
};

// TODO: FIX THIS IMPLEMENTATION

// const logCreator = () => {
//   const logger = getLogger("KafkaClient");

//   return ({ log, label, namespace }: any) => {
//     logger.info(`${label} [${namespace}]  ${JSON.stringify(log)}`);
//   };
// };

const KafkaClientsPerHost: { [host: string]: Kafka } = {};

export interface KafkaClientConfig {
  host: string;
  timeout?: number;
  maxAttempts?: number;
  enableLogs?: boolean;
  logLevel?: loggingLevel;
  ssl?: tls.ConnectionOptions | boolean;
  sasl?: SASLOptions | Mechanism;
  clientId?: string;
}

const getConfig = (): KafkaClientConfig => ({
  host: KAFKA_CLIENT_HOST,
  timeout: KAFKA_CLIENT_MAX_TIMEOUT,
  maxAttempts: KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS,
  enableLogs: KAFKA_CLIENT_ENABLE_LOGS,
  ssl: KAFKA_CLIENT_SSL,
  clientId: KAFKA_CLIENT_ID,
});

export function getClientPerHost({ host }: KafkaClientConfig) {
  const {
    timeout,
    maxAttempts,
    enableLogs,
    logLevel = enableLogs ? loggingLevel.INFO : loggingLevel.ERROR,
    ssl,
    sasl,
    clientId,
  } = getConfig();

  if (!host) {
    host = getConfig().host;
  }

  let kafkaClient = KafkaClientsPerHost[host];

  if (kafkaClient) {
    return kafkaClient;
  }

  const kafkaConfig: KafkaConfig = {
    brokers: host ? host.split(",") : [],
    connectionTimeout: timeout,
    ssl,
    sasl,
    retry: {
      maxRetryTime: 35 * 60 * 1000,
      initialRetryTime: 300,
      factor: 0.2,
      multiplier: 3,
      retries: maxAttempts,
    },
    logLevel,
    socketFactory,
    // logCreator,
  };

  if (clientId) {
    kafkaConfig.clientId = clientId;
  }

  kafkaClient = new Kafka(kafkaConfig);
  KafkaClientsPerHost[host] = kafkaClient;

  return kafkaClient;
}
