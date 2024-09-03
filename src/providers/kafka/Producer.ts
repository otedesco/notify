import {
  CompressionTypes,
  type Kafka,
  type Logger,
  type Message,
  type Producer,
  type ProducerConfig,
} from "kafkajs";
import _ from "lodash";

import {
  KAFKA_CLIENT_HOST,
  PRODUCE_EVENTS,
  PRODUCER_TOPIC_PREFIX,
} from "../../config";
import { getClientPerHost, type KafkaClientConfig } from "./Connection";

const DEFAULT_REQUIRE_ACKS = 1;

const producersPerTopic: { [topic: string]: Promise<KafkaProducer> } = {};

const producerKey = (topic: string) => `${PRODUCER_TOPIC_PREFIX}_${topic}`;

const getProducer = (topic: string) =>
  PRODUCE_EVENTS ? _.get(producersPerTopic, topic, null) : null;

const getConfig = () => ({
  host: KAFKA_CLIENT_HOST,
});

const toKafkaMessage = <T>(message: T): Message[] => {
  const messagesRaw = Array.isArray(message) ? message : [message];

  const messages = messagesRaw.map(
    ({ name, metadata, timestamp, payload }) => ({
      key: name,
      headers: metadata,
      timestamp,
      value:
        typeof payload === "object"
          ? JSON.stringify(payload)
          : payload.toString(),
    }),
  );

  return messages;
};

export interface Config {
  requireAcks?: number;
  topic: string;
}

class KafkaProducer {
  private client: Kafka;

  public producer: Producer;

  public logger: Logger;

  private topic: string;

  private requireAcks: number;

  constructor(config: Config & KafkaClientConfig & ProducerConfig) {
    const { requireAcks = DEFAULT_REQUIRE_ACKS, topic } = config;

    this.client = getClientPerHost({ host: config.host });
    this.producer = this.client.producer();
    void this.producer.connect();

    this.logger = this.producer.logger();
    this.topic = topic;
    this.requireAcks = requireAcks;
  }

  public static validateAndSend = async <T>(topic: string, message: T) => {
    const messages = Array.isArray(message) ? message : [message];

    return this.sendMessage(topic, messages);
  };

  private static sendMessage = async <T>(topic: string, message: T) => {
    if (!PRODUCE_EVENTS) return false;
    const prefixedTopic = producerKey(topic);

    const producerInstance =
      (await getProducer(prefixedTopic)) ||
      (await this.startProducer(prefixedTopic));
    producerInstance?.producer
      .logger()
      .info(
        `New outgoing message for topic: ${prefixedTopic}. Message: ${JSON.stringify(
          message,
        )}`,
      );

    await producerInstance?.send(message);

    return true;
  };

  private static startProducer = (topic: string, config = getConfig()) => {
    const producerInstance = new KafkaProducer({ topic, ...config });
    const asyncProducerReference: Promise<KafkaProducer> = new Promise(
      (resolve) => {
        producerInstance.producer.on("producer.connect", () => {
          producerInstance.logger.info(
            `Producer connected successfully. Topic: ${topic}`,
          );
          resolve(producerInstance);
        });
      },
    );

    producersPerTopic[topic] = asyncProducerReference;

    return asyncProducerReference;
  };

  private send<T>(messages: T) {
    return this.producer.send({
      compression: CompressionTypes.GZIP,
      topic: this.topic,
      messages: toKafkaMessage(messages),
      acks: this.requireAcks,
    });
  }
}

export default KafkaProducer;
