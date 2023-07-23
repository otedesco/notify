import _ from "lodash";

import { Producer } from "./providers/Kafka";

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

export const notify = async <T>(
  topic: string,
  suffix: string,
  messages: T,
  metadata = {},
  callback?: (tpc: string, msgs: T) => void,
) => {
  validateRequiredParams(topic, suffix);

  if (!_.isEmpty(messages)) {
    const msgs = mapMessagesToEvents(messages, suffix, metadata);
    const isSent = await Producer.validateAndSend(topic, msgs);
    if (isSent && callback) {
      callback(topic, messages);
    }
  }
};

// TODO: implement Synchronous Notify and different providers logic
