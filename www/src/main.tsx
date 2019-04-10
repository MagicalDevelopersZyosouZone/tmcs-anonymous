import { TMCSConsole } from "./console";
import ReactDOM from "react-dom";
import React from "react";
import { TMCSAnonymousUI } from "./tmcs-ui";
import TMCSAnonymous, { MessageState } from "tmcs-anonymous";
import { User, Session, Message } from "tmcs-anonymous";
import * as openpgp from "openpgp";
import { TMCSAnonymousStartup } from "./startup";

class App extends React.Component<{}, {state:"loading"|"startup"|"ready"}>
{
    tmcs: TMCSAnonymous;
    joinKey: string;
    constructor(props: any)
    {
        super(props);
        this.state = {
            state: "loading"
        };
    }
    async componentDidMount()
    {
        this.tmcs = new TMCSAnonymous(window.location.toString());
        this.joinKey = await this.tmcs.getSessionKey();
        this.setState({ state: "startup" });
    }
    async onStartupComplete()
    {
        const tmcs = this.tmcs;
        this.setState({ state: "ready" });
        /*

        var key = await openpgp.generateKey({
            userIds: [
                {
                    name: "Jhone Smith",
                    email: "anonymous@mdzz.studio"
                }
            ]
        });
        let user = new User("Jhone Smith", key.key);
        tmcs.contacts.set(key.key.getFingerprint(), user);
        let session = new Session(tmcs);
        session.users = [tmcs.user, user];
        session.messages = [
            new Message(tmcs.user.fingerprint, user.fingerprint, "Hey!"),
            new Message(user.fingerprint, tmcs.user.fingerprint, "Welcome to TMCS Anonymous!"),
            new Message(user.fingerprint, tmcs.user.fingerprint, "The Transmission Medium of Consciousness Stream"),
        ];

        async function putMsg()
        {
            if (Math.random() < 0.5)
            {
                const msg = new Message(user.fingerprint, tmcs.user.fingerprint, "Welcome to TMCS Anonymous!");
                await msg.encrypt(tmcs.user.pubkey, key.key);
                session.messages.push(msg);
                session.onMessage.trigger(msg);
            }
            else
            {
                const msg = new Message(tmcs.user.fingerprint, user.fingerprint, "Welcome to TMCS Anonymous!");
                await msg.encrypt(tmcs.user.pubkey, key.key);
                msg.state = MessageState.Pending;
                session.messages.push(msg);
                session.onMessage.trigger(msg);
                setTimeout(() =>
                {
                    msg.onStateChange.trigger(Math.random() < 0.5 ? MessageState.Received : MessageState.Failed);
                }, 5000);
            }
            //setTimeout(() => putMsg(), 3000);
        }
        (window as any).putMsg = putMsg;
        //putMsg();

        (session.messages[2] as any)._verified = true;
        tmcs.sessions.push(session);*/
    }
    render()
    {
        if (this.state.state === "loading")
            return (
                <main className="tmcs-loading">
                    <div className="wrapper">
                        <header className="TMCS">TMCS <span className="Anonymous">Anonymous</span></header>
                        <p>Loading...</p>
                    </div>
                </main>
            );
        else if (this.state.state === "startup")
            return (
                <TMCSAnonymousStartup tmcs={this.tmcs} joinKey={this.joinKey} onComplete={() => this.onStartupComplete()} />
            );
        else if (this.state.state === "ready")
            return (
                <TMCSAnonymousUI tmcs={this.tmcs} />
            );
    }
}

TMCSConsole();
async function main()
{

    const tmcs = new TMCSAnonymous(window.location.toString());
    const joinKey = await tmcs.getSessionKey();

    const element = (<App></App>);
    ReactDOM.render(element, document.querySelector("#root"));
}
main();