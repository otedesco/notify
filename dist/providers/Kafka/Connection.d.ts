import { Kafka, logLevel as loggingLevel } from "kafkajs";
export interface KafkaClientConfig {
    host: string;
    timeout?: number;
    maxAttempts?: number;
    enableLogs?: boolean;
    logLevel?: loggingLevel;
    ssl?: boolean;
    clientId?: string;
}
export declare function getClientPerHost(config?: KafkaClientConfig): Kafka;
