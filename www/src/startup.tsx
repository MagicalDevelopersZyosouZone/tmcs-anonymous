import React from "react";
import TMCSAnonymous from "tmcs-anonymous";
import { Guide, IconText, Button, GuidePage, GuidePageProps, TextBox, CheckBox, CheckGroup, HeaderComponent } from "./components";
import * as openpgp from "openpgp";
import { IconLoading } from "./icons";
import { formatFingerprint } from "./util";

interface StartupProps
{
    tmcs: TMCSAnonymous;
    mode: "new" | "join";
}

export class TMCSAnonymousStartup extends React.Component<StartupProps>
{
    
    render()
    {
        return (
            <div className="startup">
                <Guide>
                    <div className="wrapper">
                        <header>TMCS Anonymous</header>
                        <p>A PGP based anonymous IM platform.</p>
                        <a href="">more</a>
                    </div>
                    <KeyGen tmcs={this.props.tmcs} />
                    <KeyResult tmcs={this.props.tmcs} />
                </Guide>
            </div>
        )
    }
}

class KeyGen extends GuidePage<{ tmcs: TMCSAnonymous } & GuidePageProps, {generating: boolean}>
{
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
                await this.props.tmcs.generateKey();
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
                    <TextBox className="input-item input-name" header="Name" placeholder="Anonymous"></TextBox>
                    <p className="tips">We highly recommend you not to use the names which have something relate to you.</p>
                    <TextBox className="input-item input-email" header="Email" placeholder="anonymous@mdzz.studio"></TextBox>
                    <CheckGroup className="input-item input-bits" header="Bits" checked={1}>
                        <CheckBox value={1024}>1024</CheckBox>
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

class KeyResult extends GuidePage<{ tmcs: TMCSAnonymous } & GuidePageProps, { content:string }>
{
    constructor(props: any)
    {
        super(props);
        this.state = {
            content: null
        };
    }
    async onPageActive()
    {
        this.setState({
            content: await this.props.tmcs.user.pubkey.armor()
        });
    }
    render()
    {
        return (
            <div className="wrapper key-result">
                <header>PGP Key</header>
                <div className="about">
                    <p>We will generate a PGP key with openpgp.js here.</p>
                </div>
                <HeaderComponent className="name" header="Name">{this.props.tmcs.user.name}</HeaderComponent>
                <HeaderComponent className="email" header="Email">{this.props.tmcs.user.email}</HeaderComponent>
                <HeaderComponent className="keyid" header="32 Bits KeyID">{this.props.tmcs.user.fingerprint.substr(32).toUpperCase()}</HeaderComponent>
                <HeaderComponent className="fingerprint" header="Fingerprint">{formatFingerprint(this.props.tmcs.user.fingerprint)}</HeaderComponent>

                {/*<pre className="key-display">{this.state.content}</pre>*/}
            </div>
        )
    }
}