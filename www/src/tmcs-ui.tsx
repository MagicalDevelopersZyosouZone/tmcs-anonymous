import React from "react";
import { User, Session, Message, MessageState } from "tmcs-anonymous";
import TMCSAnonymous from "tmcs-anonymous";
import { formatFingerprint, buildClassName } from "./util";
import { Dialog, Button, IconText } from "./components";
import { IconKey, IconVerify, IconWarn, IconSend, IconLoading, IconCheck, IconWarnNoBackground, IconCross, IconEdit, IconMore, IconMenu, IconLeft } from "./icons";


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
    sideVisible: boolean;
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
            contactRequests: [],
            sideVisible: false
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
    menuClick()
    {
        this.setState({
            sideVisible: !this.state.sideVisible
        });
    }
    render()
    {
        return (
            <div className={buildClassName("tmcs", this.state.sideVisible && "extend-side")}>
                <aside className={buildClassName("side-menu")}>
                    <div className="top-menu">
                        <IconLeft className="close-menu" onClick={()=>this.menuClick()}/>
                    </div>
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
                                    <ContactRequest user={request.user} onResolved={(result) => this.resolveContactRequest(result, idx)}></ContactRequest>
                                </li>
                            ))
                        }
                        {
                            this.state.sessions.map((session, idx) => (
                                <li key={idx}>
                                    <SessionTag session={session} active={session.session === this.state.activeSession} onClick={() => this.sessionTagClick(session.session)}></SessionTag>
                                </li>
                            ))
                        }
                    </ul>
                </aside>
                <div className="vertical-layout">
                    <header className="top-bar">
                        {
                            this.state.sideVisible
                                ? <IconLeft className="icon-menu" onClick={() => this.menuClick()}/>
                                : <IconMenu onClick={() => this.menuClick()} />
                        }
                        {
                            this.state.activeSession
                                ? <div className="session-info">
                                    <span className="name">{this.state.activeSession.name}</span>
                                    <span className="email">{this.state.activeSession.users[1].email}</span>
                                    <span className="fingerprint">{formatFingerprint(this.state.activeSession.users[1].fingerprint)}</span>
                                </div>
                                : null
                        }
                    </header>
                    <main className="chatting">
                        {
                            this.state.activeSession
                                ? <ChatSession session={this.state.activeSession} tmcs={this.props.tmcs}></ChatSession>
                                : null
                        }
                    </main>
                </div>
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
    loadMsg: boolean;
}

class ChatSession extends React.Component<ChatScreenProps, ChatScreenState>
{
    constructor(props: ChatScreenProps)
    {
        super(props);
        this.state = {
            messages: props.session.messages,
            users: new Map(),
            loadMsg: true,
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
        if (this.state.loadMsg)
            this.setState({ loadMsg: false });
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
            users: users,
            loadMsg: true,
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
                                <MessageCard self={this.state.users.get(msg.sender).self} colorId={this.state.users.get(msg.sender).colorId} message={msg} key={idx} insert={!this.state.loadMsg}></MessageCard>
                            ))
                        }
                        {
                            <InputCard onSend={(text)=>this.send(text)}></InputCard>
                        }
                    </div>
                </div>
                <InputArea onSend={(text)=>this.send(text)}/>
            </div>
        );
    }
}

interface MessageCardProps
{
    self: boolean;
    colorId: number;
    message: Message;
    insert?: boolean;
}

interface MessageCardState
{
    verified: boolean | "waiting";
    state: MessageState,
    overflow: boolean;
    extend: boolean;
    insert: boolean;
}

class MessageCard extends React.Component<MessageCardProps, MessageCardState>
{
    constructor(props: MessageCardProps)
    {
        super(props);
        this.state = {
            state: props.message.state,
            verified: "waiting",
            overflow: false,
            extend: false,
            insert: props.insert === false ? false : true,
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
        var textElement = this.refs["text"] as HTMLDivElement;
        if(textElement.scrollHeight > textElement.clientHeight)
        {
            this.setState({ overflow: true });
        }
    }
    extend()
    {
        this.setState({
            extend: true,
            overflow: false,
            insert: false
        });
    }
    render()
    {
        return (
            <div className={buildClassName("msg-card", this.props.self && "self", this.state.extend && "extend", this.state.insert && "insert")}>
                <div className="wrapper">
                    <div className="card">
                        <div className="text" ref="text">{this.props.message.body}</div>
                        {
                            this.state.overflow
                                ? <IconMore onClick={() => this.extend()} />
                                : null
                        }
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
        const input = this.refs["input-text"] as TMCSInput;
        const text = input.getText();
        if (text === "")
            return;
        input.clear();
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
                        <TMCSInput ref="input-text" onSend={()=>this.send()}/>
                    </div>
                    <IconSend className="icon-button button-send" onClick={() => this.send()} />
                </div>
            </div>
        );
    }
}

class InputArea extends React.Component<{ onSend: (msg: string) => void }>
{

    send()
    {
        const input = this.refs["input-text"] as TMCSInput;
        const text = input.getText();
        if (text === "")
            return;
        input.clear();
        this.props.onSend(text);
    }
    render()
    {
        return (
            <div className="input-area">
                <TMCSInput ref="input-text" onSend={()=>this.send()}></TMCSInput>
                <div className="tools-bar">
                    <IconSend className="icon-button button-send" onClick={() => this.send()} />
                </div>
            </div>
        );
    }
}

interface TMCSInputProps extends React.HTMLAttributes<HTMLDivElement>
{
    placeHolder?: string;
    onSend?: () => void;
}
class TMCSInput extends React.Component<TMCSInputProps>
{
    getText(): string
    {
        const input = this.refs["input-text"] as HTMLDivElement;
        return input.innerText;
    }
    clear()
    {
        const input = this.refs["input-text"] as HTMLDivElement;
        input.innerHTML = "";
    }
    private onKeyPress(e: React.KeyboardEvent<HTMLDivElement>)
    {
        if (e.keyCode === 13)
        {
            this.props.onSend && this.props.onSend();
            e.preventDefault();
            return;
        }
        this.props.onKeyPress && this.props.onKeyPress(e);
    }
    private onPaste(e: React.ClipboardEvent<HTMLDivElement>)
    {
        e.preventDefault();
        const input = this.refs["input-text"] as HTMLDivElement;
        const text = e.clipboardData.getData('text/plain');
        document.execCommand("insertHTML", false, text);
        this.props.onPaste && this.props.onPaste(e);
    }
    render()
    {
        let { className, placeHolder, contentEditable, onSend, ...others } = this.props;
        placeHolder = placeHolder || "Input Text Here";
        return (
            <div
                className={buildClassName("input textbox", this.props.className)}
                ref="input-text"
                contentEditable={true}
                data-placeholder={placeHolder}
                onKeyDown={e => this.onKeyPress(e)}
                onPaste={e => this.onPaste(e)}
                {...others}
            >
            </div>
        )
    }
}