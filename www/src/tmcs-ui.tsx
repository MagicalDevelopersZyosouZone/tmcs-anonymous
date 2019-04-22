import React from "react";
import { User, Session, Message, MessageState } from "tmcs-anonymous";
import TMCSAnonymous from "tmcs-anonymous";
import { formatFingerprint } from "./util";
import { Dialog, Button, IconText } from "./components";
import { IconKey, IconVerify, IconWarn, IconSend, IconLoading, IconCheck, IconWarnNoBackground, IconCross, IconEdit } from "./icons";


interface PendingContactRequest
{
    user: User;
    resolver: (result: boolean) => void;
}

interface SessionInfo
{
    name: string;
    session: Session;
    unread: number;
    keyid: string;
}

interface TMCSAnonymousProps
{
    tmcs: TMCSAnonymous;
}

interface TMCSAnonymousState
{
    sessions: SessionInfo[];
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
            sessions: this.props.tmcs.sessions.map(session =>
            {
                return {
                    name: session.users[1].name,
                    session: session,
                    keyid: session.users[1].keyid,
                    unread: 0
                };
            }),
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

            });
        });
        this.props.tmcs.onNewSession.on((session) =>
        {
            this.setState({
                sessions: this.props.tmcs.sessions.map(session =>
                {
                    return {
                        name: session.name,
                        keyid: session.users[1].keyid,
                        session: session,
                        unread: 0
                    };
                }),
                activeSession: this.state.activeSession || session
            });
        });
    }
    resolveContactRequest(accept: boolean, idx: number)
    {
        this.state.contactRequests[idx].resolver(accept);
        this.setState({
            contactRequests: this.state.contactRequests.filter((_, i) => i != idx)
        });
    }
    sessionTagClick(session: Session)
    {
        this.setState({ activeSession: session });
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
                            this.state.sessions.map((session, idx) => (
                                <li key={idx}>
                                    <SessionTag session={session} active={session.session === this.state.activeSession} onClick={()=>this.sessionTagClick(session.session)}></SessionTag>
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

interface SessionTagProps
{
    active: boolean;
    session: SessionInfo;
    className?: string;
    onClick?: (session: SessionInfo) => void;
}

class SessionTag extends React.Component<SessionTagProps>
{
    onClick()
    {
        if (this.props.onClick)
            this.props.onClick(this.props.session);
    }
    render()
    {
        return (
            <div className={["contact", this.props.active?"active": "inactive", this.props.className].join(" ")} onClick={()=>this.onClick()}>
                <div className="name">{this.props.session.name} <span className="email">{this.props.session.session.users[1].email}</span></div>
                <IconText className="keyid" icon={(<IconKey/>)}>{this.props.session.keyid}</IconText>
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
                    <div className="name">{this.props.user.name} <span className="email">{this.props.user.email}</span></div>
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
    componentDidUpdate()
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
    componentWillReceiveProps(nextProps: ChatScreenProps)
    {
        const users = new Map<string, User & { colorId: number, self: boolean }>();
        nextProps.session.users.forEach(usr => users.set(usr.fingerprint, {
            self: usr === nextProps.tmcs.user,
            colorId: nextProps.session.users.indexOf(usr),
            ...usr
        }));
        this.setState({
            messages: nextProps.session.messages,
            users: users
        });
    }
    async send(text: string)
    {
        await this.props.session.send(text);
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
                            <InputCard onSend={(text)=>this.send(text)}></InputCard>
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
                <div className="wrapper">
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
                </div>
            </div>
        );
    }
}

class InputCard extends React.Component<{ onSend: (msg: string) => void }>
{
    send()
    {
        const input = this.refs["input-text"] as HTMLDivElement;
        const text = input.innerText;
        input.innerHTML = "";
        this.props.onSend(text);
    }
    render()
    {
        return (
            <div className="input-card">
                <div className="header">
                    <IconEdit/>
                </div>
                <div className="wrapper">
                    <div className="card">
                        <div className="input textbox" ref="input-text" contentEditable={true} data-placeholder="Input Text here">
                        </div>
                    </div>
                    <IconSend className="icon-button button-send" onClick={() => this.send()} />
                </div>
            </div>
        );
    }
}