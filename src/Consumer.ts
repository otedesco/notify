import _ from "lodash";

import {
  commitIntervalSeconds,
  CONSUME_EVENTS,
  CONSUMER_TOPIC_PREFIX,
  PROVIDER,
} from "./config";
import { ProvidersEnum } from "./enums/ProvidersEnum";
import { ConsumerConfig } from "./interfaces/ConsumerConfig";
import { KafkaConsumer, ServiceBusConsumer } from "./providers";

const internalTopicPrefix = (topic: string) =>
  `${CONSUMER_TOPIC_PREFIX}_${topic}`;

const consumerByProvider: Record<
  string,
  (cfg: ConsumerConfig) => Promise<KafkaConsumer> | ServiceBusConsumer
> = {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  [ProvidersEnum.serviceBus]: ServiceBusConsumer.create,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  [ProvidersEnum.kafka]: KafkaConsumer.create,
};

const getConsumer = async (
  config: ConsumerConfig,
): Promise<ServiceBusConsumer | KafkaConsumer> => {
  const providerNotFoundHandler = () => {
    throw new Error(`Consumer not found for ${PROVIDER}`);
  };

  const consumer = consumerByProvider[PROVIDER] || providerNotFoundHandler;
  return consumer(config);
};

const startClusterConsumerGroup = async (
  consumerGroupId: string,
  config: ConsumerConfig,
) => {
  if (!CONSUME_EVENTS) {
    // logger.warn("MQQT is disabled.");
    console.warn("MQQT is disabled.");

    return null;
  }

  const topics = _.filter(config.topics, (t) => t.active);
  const topicNames = _.map(topics, "name");
  // logger.debug(`Starting consumer group ${consumerGroupId}. topics: ${topicNames}`);
  console.debug(
    `Starting consumer group ${consumerGroupId}. topics: ${topicNames.join(
      ", ",
    )}`,
  );

  const consumer = await getConsumer({
    ...config,
    commitIntervalSeconds,
    groupId: consumerGroupId,
    handleError: (e: Error) =>
      console.error(`Error Processing Message: ${JSON.stringify(e)}`),
  });
  // FIXME: FIX LOGS
  // logger.info(`Consumer group: ${consumerGroupId} connected. topics: ${topicNames}`);
  console.info(
    `Consumer group: ${consumerGroupId} connected. topics: ${topicNames.join(
      ", ",
    )}`,
  );
  return consumer;
};

export const Consumer = {
  internalTopicPrefix,
  startClusterConsumerGroup,
};
