import type { ServiceBusClient, ServiceBusReceivedMessage, ServiceBusReceiver } from "@azure/service-bus";

import type { ConsumerConfig, Topic } from "../../interfaces/ConsumerConfig";
import { getClientPerHost } from "./Connection";

interface ConsumerPerTopicType {
  [groupId: string]: ServiceBusReceiver;
}
interface ConsumerPerHostAndTopicType {
  [host: string]: ConsumerPerTopicType;
}
const ConsumerPerHostAndGroupId: ConsumerPerHostAndTopicType = {};

const getConsumer = (
  client: ServiceBusClient,
  host: ConsumerConfig["host"],
  topic: Topic,
  groupId: ConsumerConfig["groupId"]
) => {
  const ConsumerPerTopic: ConsumerPerTopicType = ConsumerPerHostAndGroupId[host] || {};
  let consumer = ConsumerPerTopic[topic.name];

  if (consumer) {
    return consumer;
  }
  consumer = client.createReceiver(topic.name, {
    identifier: groupId,
    skipParsingBodyAsJson: false,
  });
  ConsumerPerTopic[topic.name] = consumer;
  ConsumerPerHostAndGroupId[host] = ConsumerPerTopic;

  return consumer;
};

class ServiceBusConsumer {
  static create(config: ConsumerConfig) {
    const consumerInstance = new ServiceBusConsumer();

    consumerInstance.initialize(config);

    return consumerInstance;
  }

  private initialize(config: ConsumerConfig) {
    const { topics, host, groupId } = config;

    const client = getClientPerHost(host);
    topics.forEach((topic: Topic) => {
      const consumer = getConsumer(client, host, topic, groupId);

      if (typeof topic.handler !== "undefined") {
        consumer.subscribe({
          processMessage: ({ messageId, body }: ServiceBusReceivedMessage) => topic.handler!(messageId, body),
          processError: config.handleError!,
        });
      }
    });
  }
}

export default ServiceBusConsumer;
