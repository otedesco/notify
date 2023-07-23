import {
  ISocketFactoryArgs,
  Kafka,
  KafkaConfig,
  logLevel as loggingLevel,
} from "kafkajs";
import _ from "lodash";
import net from "net";
import tls from "tls";

const MAX_RECONNECTION_ATTEMPTS = 10;
const MAX_TIMEOUT = 30000;
const KEEP_ALIVE_DELAY = 10000;

const socketFactory = ({ host, port, ssl, onConnect }: ISocketFactoryArgs) => {
  const socket = ssl
    ? tls.connect(
        Object.assign({ host, port, servername: host }, ssl),
        onConnect,
      )
    : net.connect({ host, port }, onConnect);
  socket.setKeepAlive(true, KEEP_ALIVE_DELAY);
  socket.setTimeout(30000);

  return socket;
};

const KafkaClientsPerHost: { [host: string]: Kafka } = {};

export interface KafkaClientConfig {
  host: string;
  timeout?: number;
  maxAttempts?: number;
  enableLogs?: boolean;
  logLevel?: loggingLevel;
  ssl?: boolean;
  clientId?: string;
}

const getConfig = (): KafkaClientConfig => {
  const config = _.pickBy(process.env, (_value, key) =>
    _.startsWith(key, "KAFKA_CLIENT"),
  );

  return {
    host: config.KAFKA_CLIENT_HOST_MICROSERVICES || "",
    timeout: Number(config.KAFKA_CLIENT_MAX_TIMEOUT) || MAX_TIMEOUT,
    maxAttempts:
      Number(config.KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS) ||
      MAX_RECONNECTION_ATTEMPTS,
    enableLogs: config.KAFKA_CLIENT_ENABLE_LOGS === "true",
    ssl: config.KAFKA_CLIENT_SSL === "true",
    clientId: config.KAFKA_CLIENT_ID || "",
  };
};

export function getClientPerHost(config: KafkaClientConfig = getConfig()) {
  const {
    host,
    timeout,
    maxAttempts,
    enableLogs,
    logLevel = enableLogs ? loggingLevel.INFO : loggingLevel.ERROR,
    ssl,
    clientId,
  } = config;

  let kafkaClient = KafkaClientsPerHost[host];

  if (kafkaClient) {
    return kafkaClient;
  }

  const kafkaConfig: KafkaConfig = {
    brokers: host ? host.split(",") : [],
    connectionTimeout: timeout,
    ssl,
    retry: {
      maxRetryTime: 35 * 60 * 1000,
      initialRetryTime: 300,
      factor: 0.2,
      multiplier: 3,
      retries: maxAttempts,
    },
    logLevel,
    socketFactory,
  };

  if (clientId) {
    config.clientId = clientId;
  }

  kafkaClient = new Kafka(kafkaConfig);
  KafkaClientsPerHost[host] = kafkaClient;

  return kafkaClient;
}
