export declare const notify: <T>(topic: string, suffix: string, messages: T, metadata?: {}, callback?: ((tpc: string, msgs: T) => void) | undefined) => Promise<void>;
