import _ from "lodash";

import KafkaProducer from "./Producer";

const producersPerTopic: { [topic: string]: Promise<KafkaProducer> } = {};

const producerKey = (topic: string) =>
  `${process.env.PRODUCER_TOPIC_PREFIX}_${topic}`;

const getProducer = (topic: string) =>
  process.env.PRODUCE_EVENTS ? _.get(producersPerTopic, topic, null) : null;

const getConfig = () => ({
  host: process.env.KAFKA_HOST_MICROSERVICES || "localhost:9092",
});
const startProducer = (topic: string, config = getConfig()) => {
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

const sendMessage = async <T>(topic: string, message: T) => {
  if (!process.env.PRODUCE_EVENTS) return false;
  const prefixedTopic = producerKey(topic);

  const producerInstance =
    (await getProducer(prefixedTopic)) || (await startProducer(prefixedTopic));
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

const validateAndSend = async <T>(topic: string, message: T) => {
  const messages = Array.isArray(message) ? message : [message];

  // TODO: Make some validation schema here it might be some function param or make some default
  // validator for topic, and centralize topics here.

  return sendMessage(topic, messages);
};

export const Producer = { startProducer, sendMessage, validateAndSend };
