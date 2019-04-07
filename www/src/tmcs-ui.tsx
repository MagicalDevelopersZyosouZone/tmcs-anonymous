import React from "react";
import { User, Session, Message, MessageState } from "tmcs-anonymous";
import TMCSAnonymous from "tmcs-anonymous";
import { formatFingerprint } from "./util";
import { Dialog, Button } from "./components";

interface TMCSAnonymousProps
{
    tmcs: TMCSAnonymous;
}

interface TMCSAnonymousState
{
    contacts: User[];
    activeSession: Session;
}

export class TMCSAnonymousUI extends React.Component<TMCSAnonymousProps, TMCSAnonymousState>
{
    dialog: React.RefObject<Dialog>;
    constructor(props: TMCSAnonymousProps)
    {
        super(props);
        this.dialog = React.createRef();
        this.state = {
            contacts: [],
            activeSession: null
        };
    }
    componentDidMount()
    {
        this.props.tmcs.onContactRequest.on(async (usr) =>
        {
            return new Promise<boolean>(async (resolve) =>
            {
                const accept = () =>
                {
                    resolve(true);
                    this.state.contacts.push(usr);
                    this.setState({ contacts: this.state.contacts });
                    this.dialog.current.hide();
                };
                const deny = () =>
                {
                    resolve(false);
                    this.dialog.current.hide();
                };
                this.dialog.current.show((
                    <div className="dialog-box contact-request">
                        <header>Contact Request</header>
                        <p className="text">A user requested to contact with you.</p>
                        <p className="key">
                            <span>PGP FingerPrint: </span>
                            <span>{formatFingerprint(usr.fingerprint)}</span>
                        </p>
                        <div className="pubkey">{await usr.pubkey.armor()}</div>
                        <div className="actions">
                            <Button className="button-accept" onClick={accept}>Accept</Button>
                            <Button className="button-deny" onClick={deny}>Deny</Button>
                        </div>
                    </div>
                ));
            });
        });
        this.props.tmcs.onNewSession.on((session) =>
        {
            this.setState({ activeSession: session });
        });
    }
    render()
    {
        return (
            <div className="tmcs">
                <aside className="side-menu">
                    <header className="user-info">
                        <div className="name">{this.props.tmcs.user.name}</div>
                        <div className="fingerprint">{formatFingerprint(this.props.tmcs.user.fingerprint)}</div>
                        <div className="keys">
                            <span className="pubkey">Public Key</span>
                            <span className="prvkey">Private Key</span>
                        </div>
                    </header>
                    <ul className="contacts">
                        {
                            this.state.contacts.map((contact, idx) => (
                                <li>
                                    <Contact user={contact} key={idx}></Contact>
                                </li>
                            ))
                        }
                    </ul>
                </aside>
                <main className="chatting">
                    {
                        this.state.activeSession
                            ? <ChatSession session={this.state.activeSession} tmcs={this.props.tmcs}></ChatSession>
                            : null
                    }
                </main>
                <aside className="setup">
                </aside>
                <Dialog ref={this.dialog}></Dialog>
            </div>
        );
    }
}

interface ContactProps
{
    user: User;
    className?: string;
    onClick?: (usr: User) => void;
}

class Contact extends React.Component<ContactProps>
{
    onClick()
    {
        if (this.props.onClick)
            this.props.onClick(this.props.user);
    }
    render()
    {
        return (
            <div className={["contact", this.props.className].join(" ")} onClick={()=>this.onClick()}>
                <div className="name">{this.props.user.name}</div>
                <div className="fingerprint">{formatFingerprint(this.props.user.fingerprint)}</div>
                <div className="keys">
                    <span className="pubkey">Public Key</span>
                </div>
            </div>
        )
    }
}

interface ChatScreenProps
{
    tmcs: TMCSAnonymous;
    session: Session;
}

interface ChatScreenState
{
    messages: Message[];
    users: Map<string, User & { colorId: number, self: boolean }>;
}

class ChatSession extends React.Component<ChatScreenProps, ChatScreenState>
{
    constructor(props: ChatScreenProps)
    {
        super(props);
        this.state = {
            messages: [],
            users: new Map()
        };
        this.props.session
        props.session.users.forEach(usr => this.state.users.set(usr.fingerprint, {
            self: usr === this.props.tmcs.user,
            colorId: this.props.session.users.indexOf(usr),
            ...usr
        }));
    }
    componentDidMount()
    {
        this.props.session.onMessage.on(msg =>
        {
            this.setState({
                messages: this.props.session.messages,
            });
        });
    }
    render()
    {
        return (
            <div className="chat-session">
                {
                    this.state.messages.map((msg, idx) => (
                        <MessageCard self={this.state.users.get(msg.sender).self} colorId={this.state.users.get(msg.sender).colorId} message={msg} key={idx}></MessageCard>
                    ))
                }
            </div>
        )
    }
}

interface MessageCardProps
{
    self: boolean;
    colorId: number;
    message: Message;
}

interface MessageCardState
{
    state: MessageState
}

class MessageCard extends React.Component<MessageCardProps, MessageCardState>
{
    render()
    {
        return (
            <div className={["msg-card", this.props.self ? "self" : ""].join(' ')}>
                <p className="wrapper">
                    <span className="card">{this.props.message.body}</span>
                </p>
            </div>
        );
    }
}
