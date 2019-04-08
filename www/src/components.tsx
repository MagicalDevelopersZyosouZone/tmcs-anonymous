import React from "react";

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

interface ButtonState
{
    state: "disable" | "click" | "normal";
}
export class Button extends React.Component<React.HTMLAttributes<HTMLDivElement>,ButtonState> 
{
    constructor(props: React.HTMLAttributes<HTMLDivElement>)
    {
        super(props);
        this.state = {
            state: "normal"
        };
    }
    onMouseDown()
    {
        this.setState({ state: "click" });
    }
    onMouseUp()
    {
        this.setState({ state: "normal" });
    }
    render()
    {
        let { className, onMouseDown, ...others } = this.props;
        className = ["button", this.state.state, className].join(" ");
        return (
            <div className={className} {...others} onMouseDown={() => this.onMouseDown()} onMouseUp={() => this.onMouseUp()} onMouseLeave={()=>this.onMouseUp()}></div>
        );
    }
}

export function IconText(props: { className?: string, children?: React.ReactDOM | string, icon: JSX.Element })
{
    return (
        <p className={["icon-text", props.className?props.className:""].join(" ")}>
            <span className="icon">{props.icon}</span>
            <span className="text">{props.children}</span>
        </p>
    )
}