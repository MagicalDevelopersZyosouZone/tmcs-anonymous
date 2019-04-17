import React from "react";
import { User, Session, Message, MessageState } from "tmcs-anonymous";
import TMCSAnonymous from "tmcs-anonymous";
import { formatFingerprint } from "./util";
import { Dialog, Button, IconText } from "./components";
import { IconKey, IconVerify, IconWarn, IconSend, IconLoading, IconCheck, IconWarnNoBackground, IconCross } from "./icons";


interface PendingContactRequest
{
    user: User;
    resolver: (result: boolean) => void;
}

interface TMCSAnonymousProps
{
    tmcs: TMCSAnonymous;
}

interface TMCSAnonymousState
{
    contacts: User[];
    activeSession: Session;
    contactRequests: PendingContactRequest[];
}

export class TMCSAnonymousUI extends React.Component<TMCSAnonymousProps, TMCSAnonymousState>
{
    dialog: React.RefObject<Dialog>;
    constructor(props: TMCSAnonymousProps)
    {
        super(props);
        this.dialog = React.createRef();
        this.state = {
            contacts: Array.from(this.props.tmcs.contacts.values()).filter(usr => usr != this.props.tmcs.user),
            activeSession: props.tmcs.sessions[0],
            contactRequests: []
        };
    }
    async componentDidMount()
    {
        if (this.props.tmcs.state !== "ready")
            await this.props.tmcs.connect();
        this.props.tmcs.onContactRequest.on(async (usr) =>
        {
            return new Promise<boolean>(async (resolve) =>
            {
                this.setState({
                    contactRequests: [{
                        resolver: resolve,
                        user: usr
                    }, ...this.state.contactRequests]
                });

                /*
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
                ));*/
            });
        });
        this.props.tmcs.onNewSession.on((session) =>
        {
            this.setState({ activeSession: session });
        });
    }
    resolveContactRequest(accept: boolean, idx: number)
    {
        this.state.contactRequests[idx].resolver(accept);
        this.setState({
            contactRequests: this.state.contactRequests.filter((_, i) => i != idx)
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
                            this.state.contactRequests.map((request, idx) => (
                                <li key={idx}>
                                    <ContactRequest user={request.user} onResolved={(result)=>this.resolveContactRequest(result, idx)}></ContactRequest>
                                </li>
                            ))
                        }
                        {
                            this.state.contacts.map((contact, idx) => (
                                <li key={idx}>
                                    <Contact user={contact}></Contact>
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
                <IconText className="fingerprint" icon={(<IconKey/>)}>{formatFingerprint(this.props.user.fingerprint)}</IconText>
            </div>
        )
    }
}

interface ContactRequestProps
{
    user: User;
    onResolved: (accept: boolean) => void;
}
class ContactRequest extends React.Component<ContactRequestProps>
{
    render()
    {
        return (
            <div className="contact-request">
                <div className="info">
                    <div className="name">{this.props.user.name}</div>
                    <IconText className="keyid" icon={(<IconKey />)}>{this.props.user.keyid}</IconText>
                </div>
                <div className="actions">
                    <IconCheck className="accept icon-check" onClick={()=>this.props.onResolved(true)}/>
                    <IconCross className="deny icon-cross" onClick={()=>this.props.onResolved(false)}/>
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
            messages: props.session.messages,
            users: new Map()
        };
        props.session.users.forEach(usr => this.state.users.set(usr.fingerprint, {
            self: usr === this.props.tmcs.user,
            colorId: this.props.session.users.indexOf(usr),
            ...usr
        }));
    }
    componentDidMount()
    {
        this.props.session.onMessage.on(async (msg) =>
        {
            if (msg.sender !== this.props.tmcs.user.fingerprint)
                await msg.decrypt(this.props.tmcs.user.prvkey, this.props.tmcs.contacts.get(msg.sender).pubkey);
            this.setState({
                messages: this.props.session.messages,
            });
        });
    }
    render()
    {
        return (
            <div className="chat-session">
                <div className="msg-scroller">
                    <div className="msg-screen">
                        {
                            this.state.messages.map((msg, idx) => (
                                <MessageCard self={this.state.users.get(msg.sender).self} colorId={this.state.users.get(msg.sender).colorId} message={msg} key={idx}></MessageCard>
                            ))
                        }
                        {
                            <div className="input-card">
                                <div className="wrapper">
                                    <div className="card">
                                        <div className="input textbox" contentEditable={true} data-placeholder="Input Text here">
                                        </div>
                                    </div>
                                    <IconSend className="icon-button button-send"/>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="input-area">
                    <div className="tools-bar">
                        <IconSend className="icon-button button-send"/>
                    </div>
                    <div className="input textbox" contentEditable={true} data-placeholder="Input text here">
                    </div>
                </div>
            </div>
        );
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
    verified: boolean | "waiting";
    state: MessageState
}

class MessageCard extends React.Component<MessageCardProps, MessageCardState>
{
    constructor(props: MessageCardProps)
    {
        super(props);
        this.state = {
            state: props.message.state,
            verified: "waiting"
        };
    }
    async componentDidMount()
    {
        if (this.props.self)
        {
            this.props.message.onStateChange.on(state =>
            {
                this.setState({
                    state: state
                });
            });
        }
    }
    render()
    {
        return (
            <div className={["msg-card", this.props.self ? "self" : ""].join(' ')}>
                <p className="wrapper">
                    <div className="card">
                        <span className="text">{this.props.message.body}</span>
                    </div>
                    {
                        this.props.self
                            ? this.state.state & MessageState.Pending
                                ? <IconLoading className="sending" />
                                : this.state.state & MessageState.Received
                                    ? <IconCheck className="sent" />
                                    : <IconWarn className="failed"/>
                            : this.props.message.verified
                                ? <IconVerify className="verified" />
                                : <IconWarn className="warn" />
                    }
                </p>
            </div>
        );
    }
}
