import React from "react";

function IconWrapper(element: JSX.Element)
{
    return (props: React.HTMLAttributes<HTMLDivElement>) =>
    {
        let { className, children, ...others } = props;
        className = ["icon", className].join(" ");
        return (
            <div className={className} {...others}>
                {element}
            </div>
        );
    };
}

export function IconKey()
{
    return (
        <svg viewBox="0 0 24 24">
            <path d="M7,14A2,2 0 0,1 5,12A2,2 0 0,1 7,10A2,2 0 0,1 9,12A2,2 0 0,1 7,14M12.65,10C11.83,7.67 9.61,6 7,6A6,6 0 0,0 1,12A6,6 0 0,0 7,18C9.61,18 11.83,16.33 12.65,14H17V18H21V14H23V10H12.65Z" />
        </svg>
    );
}

export const IconVerify = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z" />
    </svg>
))

export const IconWarn = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
        <path fill="white" d="M13,13H11V7H13M13,17H11V15H13Z" />
    </svg>
));

export const IconSend = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
    </svg>
));

export const IconLoading = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
        <path d="M12,20V22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20Z" />
    </svg>
));

export const IconCheck = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
    </svg>
));

export const IconWarnNoBackground = IconWrapper((
    <svg viewBox="0 0 24 24">
        <path d="M13,13H11V7H13M13,17H11V15H13M12,2Z" />
    </svg>
))
