import { promiseOrNot } from "./util";

export class PromiseEventTrigger<TEvent, TResult = any>
{
    private listener: EventListenerFunc<TEvent, TResult>;
    private eventqueue: PendingEvent<TEvent, TResult>[] = [];
    on(listener: EventListenerFunc<TEvent, TResult>)
    {
        this.listener = listener;
        if (this.eventqueue.length > 0)
        {
            this.eventqueue.forEach(e => this.dispatch(e));
            this.eventqueue = [];
        }
    }
    off()
    {
        this.listener = null;
    }
    trigger(args: TEvent): Promise<TResult>
    {
        return new Promise((resolve, reject) =>
        {
            const event: PendingEvent<TEvent, TResult> = {
                args: args,
                resolver: resolve,
                rejecter: reject
            };
            if (this.listener)
                this.dispatch(event);
            else
                this.eventqueue.push(event);
        });
    }
    private async dispatch(event: PendingEvent<TEvent, TResult>)
    {
        try
        {
            const result = await promiseOrNot(this.listener(event.args));
            event.resolver(result);
        }
        catch (err)
        {
            event.rejecter(err);
        }
    }
}

type EventListenerFunc<TEvent, TResult> = (args: TEvent) => TResult | Promise<TResult>;

interface EventListener<TEvent, TResult>
{
    once: boolean;
    func: EventListenerFunc<TEvent, TResult>;
}

interface PendingEvent<TEvent, TResult>
{
    resolver: (result: TResult) => void;
    rejecter: (err: any) => void;
    args: TEvent;
}