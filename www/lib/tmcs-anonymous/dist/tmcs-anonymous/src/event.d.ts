export declare class PromiseEventTrigger<TEvent, TResult = any> {
    private listener;
    private eventqueue;
    on(listener: EventListenerFunc<TEvent, TResult>): void;
    off(): void;
    trigger(args: TEvent): Promise<TResult>;
    private dispatch;
}
declare type EventListenerFunc<TEvent, TResult> = (args: TEvent) => TResult | Promise<TResult>;
export {};
