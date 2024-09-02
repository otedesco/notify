import _ from "lodash";

import { PROVIDER } from "./config";
import { KafkaProducer, ServiceBusProducer } from "./providers";

const validateRequiredParams = (topic: string, suffix: string) => {
  if (typeof topic !== "string" || typeof suffix !== "string") {
    throw new Error("topic and suffix arguments must be string");
  }
};

const mapMessagesToEvents = <T>(messages: T, name: string, metadata = {}) => {
  const messagesToDispatch = Array.isArray(messages) ? messages : [messages];
  const timestamp = Date.now();

  return messagesToDispatch.map((payload: T) => ({
    timestamp,
    name,
    payload,
    metadata,
  }));
};

const getProducer = (): typeof ServiceBusProducer | typeof KafkaProducer => {
  if (PROVIDER === "azure") {
    return ServiceBusProducer;
  }

  return KafkaProducer;
};

export const notify = async <T>(
  topic: string,
  suffix: string,
  messages: T,
  metadata = {},
  callback?: (topic: string, msgs: T) => void,
) => {
  validateRequiredParams(topic, suffix);
  if (!_.isEmpty(messages)) {
    const msgs = mapMessagesToEvents(messages, suffix, metadata);
    const isSent = await getProducer().validateAndSend(topic, msgs);

    if (isSent && callback) {
      callback(topic, messages);
    }
  }
};

// TODO: Implement notify sync function
