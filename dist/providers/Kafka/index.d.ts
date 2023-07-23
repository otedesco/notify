import KafkaProducer from "./Producer";
export declare const Producer: {
    startProducer: (topic: string, config?: {
        host: string;
    }) => Promise<KafkaProducer>;
    sendMessage: <T>(topic: string, message: T) => Promise<boolean>;
    validateAndSend: <T_1>(topic: string, message: T_1) => Promise<boolean>;
};
