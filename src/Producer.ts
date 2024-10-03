import _ from "lodash";

import { PRODUCE_EVENTS, PROVIDER } from "./config";
import { getService, KafkaProducer, ServiceBusProducer } from "./providers";
import { Event } from "./types";

const validateRequiredParams = (topic: string, suffix: string) => {
  if (typeof topic !== "string" || typeof suffix !== "string") {
    throw new Error("topic and suffix arguments must be string");
  }
};

const buildEvent = <T>(messages: T, name: string, metadata = {}): Event<T>[] => {
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

const notify = async <T>(
  topic: string,
  suffix: string,
  messages: T,
  notifyStrategy: (topic: string, messages: Event<T>[]) => unknown,
  metadata = {},
  callback?: (topic: string, msgs: T) => void
) => {
  if (!PRODUCE_EVENTS) return false;

  validateRequiredParams(topic, suffix);

  if (!_.isEmpty(messages)) {
    await notifyStrategy(topic, buildEvent(messages, suffix, metadata));

    if (callback && typeof callback === "function") callback(topic, messages);

    return true;
  }

  return false;
};

export const notifyAsync = async <T>(
  topic: string,
  suffix: string,
  messages: T,
  metadata = {},
  callback?: (topic: string, msgs: T) => void
) => {
  const Producer = getProducer();
  const sent = await notify(topic, suffix, messages, Producer.validateAndSend, metadata, callback);
  // implement monitoring
  return sent;
};

export const notifySync = async <T>(
  topic: string,
  suffix: string,
  messages: T,
  metadata = {},
  callback?: (topic: string, msgs: T) => void
) => {
  const Service = getService(topic);
  const sent = await notify(topic, suffix, messages, Service.notify, metadata, callback);
  // implement monitoring
  return sent;
};
