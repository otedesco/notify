import { RetryMode } from "@azure/service-bus";
import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
const environment = process.env;

export const PROVIDER = environment.MQQT_PROVIDER || "kafka";

export const KAFKA_CLIENT_HOST =
  environment.KAFKA_CLIENT_HOST || "127.0.0.1:9092";
export const KAFKA_CLIENT_MAX_TIMEOUT =
  +environment.KAFKA_CLIENT_MAX_TIMEOUT! || 30000;
export const KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS =
  +environment.KAFKA_CLIENT_MAX_RECONNECTION_ATTEMPTS! || 10;
export const KAFKA_CLIENT_ENABLE_LOGS =
  environment.KAFKA_CLIENT_ENABLE_LOGS === "true";
export const KAFKA_CLIENT_SSL = environment.KAFKA_CLIENT_SSL === "true";
export const KAFKA_CLIENT_ID = environment.KAFKA_CLIENT_ID || "";
export const KAFKA_CLIENT_SASL_MECHANISM =
  environment.KAFKA_CLIENT_SASL_MECHANISM;
export const KAFKA_CLIENT_SASL_USERNAME =
  environment.KAFKA_CLIENT_SASL_USERNAME;
export const KAFKA_CLIENT_SASL_PASSWORD =
  environment.KAFKA_CLIENT_SASL_PASSWORD;

// AZURE SERVICE BUS VARIABLES

const AZURE_ACCESS_SECRET_NAME = environment.AZURE_ACCESS_SECRET_NAME;
const AZURE_ACCESS_SECRET_KEY = environment.AZURE_ACCESS_SECRET_KEY;
const SB_CLIENT_HOST = environment.SERVICE_BUS_CLIENT_HOST || "";

export const SB_CONNECTION_STRING = `Endpoint=${SB_CLIENT_HOST};SharedAccessKeyName=${AZURE_ACCESS_SECRET_NAME};SharedAccessKey=${AZURE_ACCESS_SECRET_KEY}`;
export const SB_CLIENT_ID = environment.SERVICE_BUS_CLIENT_ID || "";
export const SB_CLIENT_MAX_RECONNECTION_ATTEMPTS =
  +environment.SERVICE_BUS_CLIENT_MAX_RECONNECTION_ATTEMPTS! || 3;
export const SB_CLIENT_MAX_TIMEOUT =
  +environment.SERVICE_BUS_CLIENT_MAX_TIMEOUT! || 60000;
export const SB_CLIENT_RETRY_DELAY =
  +environment.SERVICE_BUS_CLIENT_RETRY_DELAY! || 30000;
export const SB_CLIENT_RETRY_MODE =
  environment.SERVICE_BUS_CLIENT_RETRY_MODE === "fixed"
    ? RetryMode.Fixed
    : RetryMode.Exponential;

// CONSUMER CONFIGS
export const CONSUMER_TOPIC_PREFIX =
  environment.MQQT_CONSUMER_TOPIC_PREFIX || "kafka-app";
export const CONSUME_EVENTS = environment.MQQT_CONSUME_EVENTS === "true";
export const commitIntervalSeconds = 3;

// PRODUCER CONFIGS
export const PRODUCE_EVENTS = environment.PRODUCE_EVENTS === "true";
export const PRODUCER_TOPIC_PREFIX =
  environment.PRODUCER_TOPIC_PREFIX || "kafka-app";
