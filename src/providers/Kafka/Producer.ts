import {
  CompressionTypes,
  Kafka,
  Logger,
  Producer,
  ProducerConfig,
} from "kafkajs";

import * as Conn from "./Connection";

const DEFAULT_REQUIRE_ACKS = 1;

// TODO: Implement KAFKA_PRODUCER configs like KAFKA_CLIENT configs

const toKafkaMessage = <T>(message: T) => {
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

const getProducerConfig = () => {
  return {};
};

class KafkaProducer {
  private kafkaClient: Kafka;

  public producer: Producer;

  public logger: Logger;

  private topic: string;

  private requireAcks: number;

  /**
   * KafkaProducer. Used to produce messages to a topic on a host
   *
   * @param {Object} [config={}] Connection configuration object
   * @param {string} config.topic Kafka topic to connect to
   * @param {integer} [config.requireAcks=1] Configuration for when to consider a message as acknowledged
   */
  constructor(config: Config & Conn.KafkaClientConfig & ProducerConfig) {
    const { requireAcks = DEFAULT_REQUIRE_ACKS, topic } = config;

    this.kafkaClient = Conn.getClientPerHost();
    this.producer = this.kafkaClient.producer(getProducerConfig());
    void this.producer.connect();

    this.logger = this.producer.logger();
    this.topic = topic;
    this.requireAcks = requireAcks;
  }

  send<T>(messages: T) {
    return this.producer.send({
      compression: CompressionTypes.GZIP,
      topic: this.topic,
      messages: toKafkaMessage(messages),
      acks: this.requireAcks,
    });
  }
}

export default KafkaProducer;
