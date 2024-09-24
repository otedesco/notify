export type Event<T> = {
  timestamp: number;
  name: string;
  payload: T;
  metadata: Record<string, unknown>;
};
