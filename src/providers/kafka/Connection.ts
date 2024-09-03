/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import net from "node:net";
import tls from "node:tls";

import {
  type ISocketFactoryArgs,
  Kafka,
  type KafkaConfig,
  logLevel as loggingLevel,
  type Mechanism,
  type SASLOptions,
} from "kafkajs";

import {
  KAFKA_CLIENT_ENABLE_LOGS,
  KAFKA_CLIENT_HOST,
  KAFKA_CLIENT_ID,
  KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS,
  KAFKA_CLIENT_MAX_TIMEOUT,
  KAFKA_CLIENT_SASL_MECHANISM,
  KAFKA_CLIENT_SASL_PASSWORD,
  KAFKA_CLIENT_SASL_USERNAME,
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
  ssl?: boolean | tls.ConnectionOptions;
  sasl?: SASLOptions | Mechanism;
  clientId?: string;
}

const getConfig = (): KafkaClientConfig => ({
  host: KAFKA_CLIENT_HOST,
  timeout: KAFKA_CLIENT_MAX_TIMEOUT,
  maxAttempts: KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS,
  enableLogs: KAFKA_CLIENT_ENABLE_LOGS,
  ssl: KAFKA_CLIENT_SSL,
  sasl: KAFKA_CLIENT_SASL_PASSWORD
    ? {
        mechanism: KAFKA_CLIENT_SASL_MECHANISM!,
        //@ts-expect-error
        username: KAFKA_CLIENT_SASL_USERNAME,
        password: KAFKA_CLIENT_SASL_PASSWORD,
      }
    : undefined,
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
