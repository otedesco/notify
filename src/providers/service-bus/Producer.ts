import type { ServiceBusClient, ServiceBusMessage, ServiceBusSender } from "@azure/service-bus";
import _ from "lodash";

import { PRODUCE_EVENTS, PRODUCER_TOPIC_PREFIX } from "../../config";
import { getClientPerHost } from "./Connection";

const producersPerTopic: { [topic: string]: ServiceBusProducer } = {};

const getProducer = (topic: string) => (PRODUCE_EVENTS ? _.get(producersPerTopic, topic, null) : null);

const producerKey = (topic: string) => `${PRODUCER_TOPIC_PREFIX}_${topic}`;

const toServiceBusMessages = <T>(message: T): ServiceBusMessage[] => {
  const messagesRaw = Array.isArray(message) ? message : [message];

  const messages = messagesRaw.map(({ name, metadata, timestamp, payload }) => ({
    messageId: name,
    contentType: "application/json",
    applicationProperties: { timestamp, ...metadata },
    body: typeof payload === "object" ? JSON.stringify(payload) : payload.toString(),
  }));

  return messages;
};

class ServiceBusProducer {
  private client: ServiceBusClient;

  public producer: ServiceBusSender;

  private topic: string;

  constructor({ topic, ...config }: any) {
    this.client = getClientPerHost(config.host as string);
    this.producer = this.client.createSender(topic as string);
    this.topic = topic;
  }

  public static validateAndSend = async <T>(topic: string, message: T) => {
    const messages = Array.isArray(message) ? message : [message];

    return this.sendMessage(topic, messages);
  };

  private static sendMessage = async <T>(topic: string, message: T) => {
    if (!process.env.PRODUCE_EVENTS) return false;
    const prefixedTopic = producerKey(topic);
    const producerInstance = getProducer(prefixedTopic) || this.startProducer(prefixedTopic);
    await producerInstance.send(message);

    return true;
  };

  private static startProducer = (topic: string) => {
    const producerInstance = new ServiceBusProducer({ topic });
    producersPerTopic[topic] = producerInstance;

    return producerInstance;
  };

  private send<T>(messages: T) {
    return this.producer.sendMessages(toServiceBusMessages(messages));
  }
}

export default ServiceBusProducer;
