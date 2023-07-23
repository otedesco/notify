import { Logger, Producer, ProducerConfig } from "kafkajs";
import * as Conn from "./Connection";
export interface Config {
    requireAcks?: number;
    topic: string;
}
declare class KafkaProducer {
    private kafkaClient;
    producer: Producer;
    logger: Logger;
    private topic;
    private requireAcks;
    /**
     * KafkaProducer. Used to produce messages to a topic on a host
     *
     * @param {Object} [config={}] Connection configuration object
     * @param {string} config.topic Kafka topic to connect to
     * @param {integer} [config.requireAcks=1] Configuration for when to consider a message as acknowledged
     */
    constructor(config: Config & Conn.KafkaClientConfig & ProducerConfig);
    send<T>(messages: T): Promise<import("kafkajs").RecordMetadata[]>;
}
export default KafkaProducer;
