import React from "react";
import TMCSAnonymous from "tmcs-anonymous";
import { Guide, IconText, Button, GuidePage, GuidePageProps, TextBox, CheckBox, CheckGroup, HeaderComponent, CopyToClipboard } from "./components";
import * as openpgp from "openpgp";
import { IconLoading, IconCopy, IconError, IconCross } from "./icons";
import { formatFingerprint, sleep } from "./util";
import qrcode from "qrcode";
import { User } from "tmcs-anonymous";

interface StartupProps
{
    tmcs: TMCSAnonymous;
    joinKey?: string;
    onComplete?: () => void;
}

export class TMCSAnonymousStartup extends React.Component<StartupProps>
{
    
    render()
    {
        return (
            <div className="startup">
                {
                    this.props.joinKey
                        ? <Guide onFinish={() => this.props.onComplete && this.props.onComplete()}>
                            <JoinPage tmcs={this.props.tmcs} pubkey={this.props.joinKey}/>
                            <KeyGen tmcs={this.props.tmcs} />
                            <KeyResult tmcs={this.props.tmcs} />
                            <SignUp tmcs={this.props.tmcs} />
                            <WaitConfirm tmcs={this.props.tmcs} joinKey={this.props.joinKey}/>
                        </Guide>
                        : <Guide onFinish={() => this.props.onComplete && this.props.onComplete()}>
                            <div className="wrapper">
                                <header>TMCS Anonymous</header>
                                <p>A PGP based anonymous IM platform.</p>
                                <a href="">more</a>
                            </div>
                            <KeyGen tmcs={this.props.tmcs} />
                            <KeyResult tmcs={this.props.tmcs} />
                            <SignUp tmcs={this.props.tmcs} />
                            <ShareLink tmcs={this.props.tmcs} />
                        </Guide>
                }
            </div>
        )
    }
}

class KeyGen extends GuidePage<{ tmcs: TMCSAnonymous } & GuidePageProps, {generating: boolean}>
{
    name: string;
    email: string;
    bits: number;
    constructor(props: any)
    {
        super(props);
        this.state = {
            generating: false
        };
    }
    onPageActive()
    {
        this.guide.onNext = () =>
        {
            this.setState({
                generating: true
            });
            (async () =>
            {
                this.guide.onNext = () => false;
                await this.props.tmcs.generateKey({
                    bits: this.bits as any,
                    name: this.name,
                    email: this.email
                });
                this.guide.onNext = null;
                this.setState({ generating: false });
                this.guide.next();
            })();
            return false;
        };
        this.guide.setNext(true, "GENERATE");
    }
    render()
    {
        return (
            <div className="wrapper key-gen">
                <header>Generate PGP Key</header>
                <div className="about">
                    <p>We will generate a PGP key with openpgp.js here.</p>
                </div>
                <div className="key-config">
                    <TextBox className="input-item input-name" header="Name" placeholder="Anonymous" onChange={e=>this.name = e.target.value}></TextBox>
                    <p className="tips">We highly recommend you not to use the names which have something relate to you.</p>
                    <TextBox className="input-item input-email" header="Email" placeholder="anonymous@mdzz.studio" onChange={e=>this.email = e.target.value}></TextBox>
                    <CheckGroup className="input-item input-bits" header="Bits" checked={0} onChange={v=>this.bits=v}>
                        <CheckBox value={2048}>2048</CheckBox>
                        <CheckBox value={4096}>4096</CheckBox>
                    </CheckGroup>
                    {
                        this.state.generating
                            ? <div className="loading-wrapper"><IconLoading className="key-gen-loading icon-loading" /></div>
                            : null
                    }
                </div>
            </div>
        )
    }
}

class KeyResult extends GuidePage<{ tmcs: TMCSAnonymous } & GuidePageProps>
{
    constructor(props: any)
    {
        super(props);
    }
    async onPageActive()
    {
    }
    async copyPubKey()
    {
        await (navigator as any).clipboard.writeText(await this.props.tmcs.user.pubkey.armor());
    }
    async copyPrvKey()
    {
        await (navigator as any).clipboard.writeText(await this.props.tmcs.user.prvkey.armor());
    }
    render()
    {
        return (
            <div className="wrapper key-result">
                <header>PGP Key</header>
                <div className="about">
                    <p>Your key has been generated, see more infos below.</p>
                    <p>REMEMBER to keep secret of your private key.</p>
                </div>
                <HeaderComponent className="name" header="Name">{this.props.tmcs.user.name}</HeaderComponent>
                <HeaderComponent className="email" header="Email">{this.props.tmcs.user.email}</HeaderComponent>
                <HeaderComponent className="keyid" header="32 Bits KeyID">{this.props.tmcs.user.fingerprint.substr(32).toUpperCase()}</HeaderComponent>
                <HeaderComponent className="fingerprint" header="Fingerprint">{formatFingerprint(this.props.tmcs.user.fingerprint)}</HeaderComponent>
                <HeaderComponent className="pubkey" header="Public Key">
                    <IconText className="copy" icon={<IconCopy/>} onClick={()=>this.copyPubKey()}>Click to copy</IconText>
                </HeaderComponent>
                <HeaderComponent className="prvkey" header="Private Key">
                    <IconText className="copy" icon={<IconCopy/>} onClick={()=>this.copyPrvKey()}>Click to copy</IconText>
                </HeaderComponent>
                {/*<pre className="key-display">{this.state.content}</pre>*/}
            </div>
        )
    }
}

class SignUp extends GuidePage<GuidePageProps & { tmcs: TMCSAnonymous }, {state:"upload"|"error"|"done", msg:string}>
{
    constructor(props:any)
    {
        super(props);
        this.state = {
            state: "upload",
            msg: ""
        };
    }
    async onPageActive()
    {
        this.setState({
            state: "upload",
            msg: ""
        });
        this.guide.setBack(false);
        this.guide.setNext(false);
        try
        {
            await sleep(500);
            await this.props.tmcs.registerKey();
            this.setState({
                state:"done"
            });
            this.guide.setBack(true);
            this.guide.setNext(true);
            this.guide.next();
        }
        catch (err)
        {
            this.setState({
                state: "error",
                msg: err.message
            });
            this.guide.setBack(true);
        }
    }
    render()
    {
        return (
            <div className="wrapper sign-up">
                <header>{this.state.state==="error"?"Failed":"Sign Up"}</header>
                {
                    this.state.state === "upload"
                        ? <section className="upload">
                            <div className="loading">
                                <IconLoading className="icon-loading" />
                            </div>
                            <p className="msg">Uploading your public key to our server...</p>
                        </section>
                        : this.state.state === "error"
                            ? <section className="error">
                                <IconError className="icon-error" />
                                <p className="msg">Failed to sign up your public key.</p>
                                <p className="error-msg">{this.state.msg}</p>
                            </section>
                            : null
                }
            </div>
        )
    }
}

class ShareLink extends GuidePage<GuidePageProps & { tmcs: TMCSAnonymous }, {qrcode: string}>
{
    constructor(props: any)
    {
        super(props);
        this.state = {
            qrcode: null
        };
    }

    async onPageActive()
    {
        this.setState({
            qrcode: await qrcode.toDataURL(this.props.tmcs.inviteLink, {
                scale: 16,
                type: "image/webp",
            })
        });
        this.guide.setNext(true, "ENTER");
    }
    async copy()
    {
        (this.refs["link-copy"] as HTMLInputElement).select();
        document.execCommand("copy");

        await (navigator as any).clipboard.writeText(await this.props.tmcs.inviteLink);
    }
    render()
    {
        return (
            <div className="wrapper share-page">
                <header>Invitation</header>
                <p className="about">All done! Now you can share your link to chat with others.</p>
                <div className="container">
                    <div className="share-link">
                        <input type="text" className="content" value={this.props.tmcs.inviteLink} ref="link-copy" readOnly></input>
                        <IconCopy className="icon-copy" onClick={() => this.copy()} />
                    </div>
                    <div className="qr-code">
                        {
                            this.state.qrcode
                                ? <img src={this.state.qrcode}></img>
                                : null
                        }
                    </div>
                </div>
            </div>
        )
    }
}

class JoinPage extends GuidePage<GuidePageProps & { tmcs: TMCSAnonymous, pubkey:string }, { user: User }>
{
    constructor(props:any)
    {
        super(props);
        this.state = {
            user: null
        };
    }
    async onPageActive()
    {
        const key = (await openpgp.key.readArmored(this.props.pubkey)).keys[0];
        const user = new User(key);
        this.setState({
            user: user
        });
    }
    render()
    {
        return (
            <div className="wrapper join-page">
                <header>Invitation</header>
                <p className="about">You are invited to make contact with someone. </p>
                {
                    this.state.user
                        ? <div className="user-info">
                            <HeaderComponent className="name" header="Name">{this.state.user.name}</HeaderComponent>
                            <HeaderComponent className="email" header="Email">{this.state.user.email}</HeaderComponent>
                            <HeaderComponent className="key-id" header="KeyID">{this.state.user.fingerprint.substr(32).toUpperCase()}</HeaderComponent>
                            <HeaderComponent className="fingerprint" header="Fingerprint">{formatFingerprint(this.state.user.fingerprint)}</HeaderComponent>
                            <HeaderComponent className="pubkey" header="Public Key">
                                <CopyToClipboard text={this.props.pubkey}>Copy to Clipboard</CopyToClipboard>
                            </HeaderComponent>
                            <p className="notice">Please comfirm the identifier of this key.</p>
                        </div>
                        : <div className="loading-wrapper">
                            <IconLoading className="icon-loading"/>
                        </div>
                }
            </div>
        )
    }
}

class WaitConfirm extends GuidePage<GuidePageProps & { tmcs: TMCSAnonymous, joinKey: string}, {state: "pending" | "ready" | "error", msg:string}>
{
    constructor(props: any)
    {
        super(props);
        this.state = {
            state: "pending",
            msg: "Waiting for confirm..."
        };
    }
    async onPageActive()
    {
        this.guide.setNext(false);
        this.guide.setBack(false);
        await sleep(3000);
        const result = await this.props.tmcs.contactRequest(this.props.joinKey);
        if (!result)
            this.setState({
                state: "error",
                msg: "Invitation has been rejected."
            });
        else
        {
            this.guide.setNext(true, "DONE");
            this.guide.next();
        }
    }
    render()
    {
        if (this.state.state === "pending")
            return (
                <div className="wrapper request-page">
                    <header>Waiting for Response</header>
                    <p className="about">Almost done.</p>
                    <div className="waiting">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                    <div className="msg">{this.state.msg}</div>
                </div>
            );
        else if (this.state.state === "error")
            return (
                <div className="wrapper request-page">
                    <header>Invitation Rejected</header>
                    <div className="error">
                        <IconCross className="icon-error" />
                    </div>
                    <div className="msg">{this.state.msg}</div>
                </div>
            );
    }
}