export interface Topic {
  active: boolean;
  concurrency: number;
  handlerName: string;
  name: string;
  handler?: (evt: unknown, message: unknown) => Promise<void>;
}

export interface ConsumerConfig {
  host: string;
  groupId: string;
  active: boolean;
  maxBytesPerPartition?: number;
  commitIntervalSeconds?: number;
  topics: Topic[];
  handleError?: (e: any) => any;
}
