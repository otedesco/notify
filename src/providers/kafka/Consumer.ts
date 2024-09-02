import { mapConcurrent } from "@apart-re/utils";
import { Consumer, EachBatchPayload, Kafka } from "kafkajs";
import _, { Dictionary } from "lodash";

import { ConsumerConfig, Topic } from "../../interfaces/ConsumerConfig";
import { getClientPerHost } from "./Connection";

interface ConsumerPerGroupIdType {
  [groupId: string]: Consumer;
}
interface ConsumerPerHostAndGroupIdType {
  [host: string]: ConsumerPerGroupIdType;
}
const ConsumerPerHostAndGroupId: ConsumerPerHostAndGroupIdType = {};

const getConsumer = async (
  kafka: Kafka,
  host: ConsumerConfig["host"],
  groupId: ConsumerConfig["groupId"],
  maxBytesPerPartition?: ConsumerConfig["maxBytesPerPartition"],
) => {
  const ConsumerPerGroupId: ConsumerPerGroupIdType =
    ConsumerPerHostAndGroupId[host] || {};
  let consumer = ConsumerPerGroupId[groupId];

  if (consumer) {
    return consumer;
  }

  consumer = kafka.consumer({ groupId, maxBytesPerPartition });
  await consumer.connect();

  ConsumerPerGroupId[groupId] = consumer;
  ConsumerPerHostAndGroupId[host] = ConsumerPerGroupId;

  return consumer;
};

class KafkaConsumer {
  topics: Dictionary<Topic> | undefined;

  public static async create(config: ConsumerConfig) {
    const consumerInstance = new KafkaConsumer();

    await consumerInstance.initialize(config);

    return consumerInstance;
  }

  private async initialize(config: ConsumerConfig) {
    const {
      topics,
      host,
      groupId,
      commitIntervalSeconds,
      maxBytesPerPartition,
    } = config;

    this.topics = _.keyBy(topics, "name");

    const kafka = getClientPerHost(config);
    const consumer = await getConsumer(
      kafka,
      host,
      groupId,
      maxBytesPerPartition,
    );

    await mapConcurrent(
      topics,
      (topic) => consumer.subscribe({ topic: topic.name }),
      1,
    );

    await consumer.run({
      autoCommitThreshold: 100,
      autoCommit: true,
      eachBatchAutoResolve: true,
      partitionsConsumedConcurrently: topics.length,
      eachBatch: this.onMessageBatch.bind(this),
      autoCommitInterval: commitIntervalSeconds ?? 10 * 1000,
    });
  }

  private async onMessageBatch({
    batch,
    commitOffsetsIfNecessary,
  }: EachBatchPayload) {
    const { topic: topicName, partition, messages } = batch;
    const startTime = Date.now();
    const batchKey = `${partition}-${batch.firstOffset()}-${batch.lastOffset()}`;
    // FIXME: think about how to implement logging
    // logger.info(`Processing ${topicName} - ${batchKey} (part-offset.first-offset.last). ${messages.length} msgs`);
    console.info(
      `Processing ${topicName} - ${batchKey} (part-offset.first-offset.last). ${messages.length} msgs`,
    );
    const topicConfig = this.topics![topicName];

    await mapConcurrent(
      messages,
      async (message) => {
        const { offset, value, key } = message;
        let msg = null;
        let evt = null;

        try {
          msg = value && JSON.parse(value.toString());
          evt = key && key.toString();
        } catch (error) {
          // logger.error(`Malformed event: ${value}`);
          console.error(`Malformed event: ${value?.toString()}`);
        }

        try {
          await topicConfig.handler?.(evt, msg);
        } catch (error) {
          // logger.error(
          //   `Failed to process (topic: ${topicName}, part: ${partition}, offset: ${offset}). Err: ${error.toString()}`
          // );

          console.error(
            `Failed to process (topic: ${topicName}, part: ${partition}, offset: ${offset}). Err: ${JSON.stringify(
              error,
            )}`,
          );
        }
      },
      topicConfig.concurrency,
    );

    // logger.info(`Done Processing batch: ${batchKey}. (Took: ${(Date.now() - startTime) / 1000}s)`);
    console.info(
      `Done Processing batch: ${batchKey}. (Took: ${
        (Date.now() - startTime) / 1000
      }s)`,
    );
    await commitOffsetsIfNecessary();
  }
}

export default KafkaConsumer;
