import React, { Children } from "react";
import { IconCheckedBox, IconUncheckedBox, IconCopy, IconCheck } from "./icons";

interface DialogState
{
    show: boolean;
    children: React.ReactNode;
}
export class Dialog extends React.Component<React.HTMLAttributes<HTMLDivElement>, DialogState>
{
    constructor(props: React.HTMLAttributes<HTMLDivElement>)
    {
        super(props);
        this.state = {
            show: false,
            children: null
        };
    }
    show(children: React.ReactNode)
    {
        this.setState({ show: true, children: children });
    }
    hide()
    {
        this.setState({ show: false, children: null });
    }
    render()
    {
        let { className, children, ...others } = this.props;
        return (
            <div className={["dialog", this.state.show ? "show" : "hide", className].join(" ")} {...others}>
                {this.state.children}
            </div>
        )
    }
}

interface ButtonProps extends React.HTMLAttributes<HTMLDivElement>
{
    enabled?: boolean;
}

interface ButtonState
{
    state: "disable" | "click" | "normal";
}
export class Button extends React.Component<ButtonProps, ButtonState>
{
    constructor(props: ButtonProps)
    {
        super(props);
        this.state = {
            state: props.enabled === false ? "disable" : "normal"
        };
    }
    onMouseDown()
    {
        if (this.state.state == "disable")
            return;
        this.setState({ state: "click" });
    }
    onMouseUp()
    {
        if (this.state.state == "disable")
            return;
        this.setState({ state: "normal" });
    }
    onClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>)
    {
        if (this.state.state == "disable")
            return;
        this.props.onClick && this.props.onClick(e);
    }
    componentWillReceiveProps(nextProps: ButtonProps)
    {
        this.setState({ state: nextProps.enabled === false ? "disable" : "normal" });
    }
    render()
    {
        let { className, onMouseDown, onClick, enabled, ...others } = this.props;
        className = ["button", this.state.state, className].join(" ");
        return (
            <div className={className} {...others} onClick={(e) => this.onClick(e)} onMouseDown={() => this.onMouseDown()} onMouseUp={() => this.onMouseUp()} onMouseLeave={() => this.onMouseUp()} ></div>
        );
    }
}

interface IconTextProps extends React.HTMLAttributes<HTMLSpanElement>
{
    icon: React.ReactNode;
}
export function IconText(props: IconTextProps)
{
    let { className, children, icon, ...others } = props;
    className = ["icon-text", className].join(" ");
    return (
        <span className={className} {...others}>
            <span className="icon">{icon}</span>
            <span className="text">{children}</span>
        </span>
    )
}

interface GuideProps extends React.HTMLAttributes<HTMLDivElement>
{
    onFinish?: () => void;
    onPageNext?: () => void;
    onPageBack?: () => void;
}

interface GuideState
{
    activePage: number;
    nextEnable: boolean;
    nextLabel: string;
    backEnable: boolean;
    backLabel: string;
}

const DefaultBackLabel = "BACK";
const DefaultNextLabel = "NEXT";
export class Guide extends React.Component<GuideProps, GuideState>
{
    onNext?: () => boolean;
    onBack?: () => boolean;
    pages: GuidePage[] = [];
    private pageArgs = {};
    constructor(props: GuideProps)
    {
        super(props);
        this.state = {
            activePage: 0,
            backEnable: false,
            backLabel: DefaultBackLabel,
            nextEnable: true,
            nextLabel: DefaultNextLabel,
        }
        this.pages.length = React.Children.count(props.children);
    }
    setNext(enable: boolean, lable: string = DefaultNextLabel)
    {
        this.setState({ nextEnable: enable, nextLabel: lable });
    }
    setBack(enable: boolean, lable: string = DefaultBackLabel)
    {
        this.setState({ backEnable: enable, backLabel: lable });
    }
    next(args: any = null)
    {
        this.pageArgs = args;
        if (this.onNext && !this.onNext())
            return;
        let n = this.state.activePage + 1;
        if (n < this.pages.length)
        {
            this.onNext = null;
            this.onBack = null;
            this.props.onPageNext ? this.props.onPageNext() : null;
            this.setState({
                activePage: n,
                backEnable: true,
                backLabel: DefaultBackLabel,
                nextEnable: true,
                nextLabel: DefaultNextLabel,
            });
        }
        else if (this.props.onFinish)
            this.props.onFinish();
    }
    back(args: any = null)
    {
        this.pageArgs = args;
        if (this.onBack && !this.onBack)
            return;
        let n = this.state.activePage - 1;
        if (n >= 0)
        {
            this.onNext = null;
            this.onBack = null;
            this.props.onPageBack ? this.props.onPageBack() : null;
            this.setState({
                activePage: n,
                backEnable: true,
                backLabel: DefaultBackLabel,
                nextEnable: true,
                nextLabel: DefaultNextLabel,
            });
        }
        if (n == 0)
            this.setState({ backEnable: false });
    }
    onPageCreate(page: GuidePage, idx: number)
    {
        this.pages[idx] = page;
    }
    componentDidUpdate(prevProps: GuideProps, prevState: GuideState)
    {
        if (prevState.activePage != this.state.activePage)
            this.pages[this.state.activePage] && this.pages[this.state.activePage].onPageActive && this.pages[this.state.activePage].onPageActive(this.pageArgs);
    }
    componentDidMount()
    {
        this.pages[this.state.activePage] && this.pages[this.state.activePage].onPageActive && this.pages[this.state.activePage].onPageActive();
    }
    render()
    {
        return (
            <div className="guide">
                <div className="content">
                    {
                        Children.map(this.props.children, (child, idx) =>
                        {
                            if (idx > this.state.activePage)
                                return null;
                            const element = child as React.ReactElement;
                            const Type = element.type;
                            const props = { _guide: this, _callback: (p: any) => this.onPageCreate(p, idx), ...element.props };
                            return (
                                <section className={["page", this.state.activePage === idx ? "active" : "inactive"].join(" ")} key={idx}>
                                    {
                                        GuidePage.isPrototypeOf(Type)
                                            ? <Type {...props}>

                                            </Type>
                                            : <Type {...element.props}></Type>
                                    }
                                </section>
                            );
                        })
                    }
                </div>
                <div className="actions">
                    <Button className="back" enabled={this.state.backEnable} onClick={() => this.back()}>{this.state.backLabel}</Button>
                    <Button className="next" enabled={this.state.nextEnable} onClick={() => this.next()}>{this.state.nextLabel}</Button>
                </div>
            </div>
        );
    }
}

export interface GuidePageProps
{
    _guide?: Guide;
    _callback?: (page: GuidePage<any, any>) => void;
}

export class GuidePage<P extends GuidePageProps = GuidePageProps, S={}> extends React.Component<P, S>
{
    get guide(): Guide { return this.props._guide }
    constructor(props: P)
    {
        super(props);
        this.props._callback && this.props._callback(this);
    }
    onPageActive(args: any = null) { }
    componentWillMount()
    {
        this.props._callback && this.props._callback(this);
    }
}


interface HeaderComponentProps
{
    header?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

export function HeaderComponent(props: HeaderComponentProps)
{
    return (
        <div className={["header-element", props.className].join(" ")}>
            <header className="header">{props.header}</header>
            <div className="content">
                {props.children}
            </div>
        </div>
    )
}

interface TextBoxProps extends React.InputHTMLAttributes<HTMLInputElement>
{
    header?: React.ReactNode;
    className?: string;
    editable?: boolean;
}

interface TextBoxState
{
    focus: boolean;
}
export class TextBox extends React.Component<TextBoxProps, TextBoxState>
{
    constructor(props: TextBoxProps)
    {
        super(props);
        this.state = { focus: false };
    }
    onFocus(e: React.FocusEvent<HTMLInputElement>)
    {
        this.setState({ focus: true });
        this.props.onFocus && this.props.onFocus(e);
    }
    onBlur(e: React.FocusEvent<HTMLInputElement>)
    {
        this.setState({ focus: false });
        this.props.onBlur && this.props.onBlur(e);
    }
    render()
    {
        let { className, header, type, editable, onFocus, onBlur, ...others } = this.props;
        type = type || "text";
        className = ["text-box", this.state.focus ? "focus" : "", className].join(' ');
        editable = editable === false ? false : true;
        return (
            <HeaderComponent className={className} header={this.props.header}>
                <input type={type} onFocus={(e) => this.onFocus(e)} onBlur={e => this.onBlur(e)} {...others} />
            </HeaderComponent>
        );
    }
}

interface CheckBoxProps extends React.HTMLAttributes<HTMLDivElement>
{
    value?: any;
    checked?: boolean;
    group?: CheckGroup;
    onCheckChanged?: (checked: boolean) => void;
}

export class CheckBox extends React.Component<CheckBoxProps, { checked: boolean }>
{
    constructor(props: CheckBoxProps)
    {
        super(props);
        this.state = {
            checked: this.props.checked === true ? true : false
        };
    }
    onClick()
    {
        this.setState({ checked: !this.state.checked });
        this.props.onCheckChanged ? this.props.onCheckChanged(!this.state.checked) : null;
    }
    componentWillReceiveProps(nextProps: CheckBoxProps)
    {
        this.setState({ checked: nextProps.checked === true ? true : false });
        /*if (this.state.checked !== (nextProps.checked === true ? true : false) && this.props.onCheckChanged)
            this.props.onCheckChanged(nextProps.checked === true ? true : false);*/

    }
    render()
    {
        let { className, children, ...others } = this.props;
        className = ["check-box", this.state.checked ? "checked" : "unchecked", className].join(' ');
        return (
            <div className={className} onClick={() => this.onClick()}>
                {
                    this.state.checked
                        ? <IconCheckedBox className="checked check-icon" />
                        : <IconUncheckedBox className="unchecked check-icon" />
                }
                {
                    children
                }
            </div>
        )
    }
}

interface CheckGroupProps extends HeaderComponentProps
{
    onChange?: (value: any) => void;
    checked?: number;
}

export class CheckGroup extends React.Component<CheckGroupProps, { checkedIdx: number }>
{
    constructor(props: CheckGroupProps)
    {
        super(props);
        this.state = {
            checkedIdx: this.props.checked > 0 ? this.props.checked : 0
        };
    }
    onCheckChanged(value: any, idx: number)
    {
        this.props.onChange && this.props.onChange(value);
        this.setState({ checkedIdx: idx });
    }
    render()
    {
        let { className, children, ...others } = this.props;
        className = ["check-group", className].join(" ");
        return (
            <HeaderComponent className={className} {...others}>
                {
                    React.Children.map(children, (child, idx) =>
                    {
                        const element = child as React.ReactElement;
                        const Type = element.type;
                        const { group, onCheckChanged, checked, ...props } = (element.props as CheckBoxProps);
                        return element.type === CheckBox
                            ? props
                            : null;
                    }).filter(p => p !== null)
                        .map((props, idx) => (
                            <CheckBox group={this} key={idx} checked={this.state.checkedIdx === idx} onCheckChanged={() => this.onCheckChanged(props.value, idx)} {...props}></CheckBox>
                        ))
                }
            </HeaderComponent>
        )
    }
}

interface CopyToClipboardProps extends React.HTMLAttributes<HTMLDivElement>
{
    text?: string;
}
export class CopyToClipboard extends React.Component<CopyToClipboardProps, { copied: boolean }>
{
    constructor(props: CopyToClipboardProps)
    {
        super(props);
        this.state = { copied: false };
    }
    async copy()
    {
        if (this.props.text)
        {
            await (navigator as any).clipboard.writeText(await this.props.text);
        }
        else
        {
            (this.refs["content"] as HTMLInputElement).select()
            document.execCommand("copy");
        }
        this.setState({ copied: true });
    }
    render()
    {
        let { className, onClick, children, text, ...others } = this.props;
        className = ["copy-to-clipboard", className].join(" ");
        return (
            <div className={className} onClick={()=>this.props.text?this.copy():null} {...others}>
                {
                    this.props.text
                        ? <span className="content" ref="content">{children}</span>
                        : <input type="text" className="content" ref="content" value={this.props.text} readOnly></input>
                }
                <span className="icon-wrapper" onClick={()=>this.copy()} >
                    {
                        this.state.copied
                            ? <IconCheck />
                            : <IconCopy />
                    }
                </span>
            </div>
        )
    }
}