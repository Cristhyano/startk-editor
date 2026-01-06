import type { ReactNode } from "react";

type IconButtonProps = {
    title: string;
    onClick: () => void;
    className: string;
    children: ReactNode;
};

export const IconButton = ({ title, onClick, className, children }: IconButtonProps) => (
    <button
        className={className}
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
    >
        {children}
    </button>
);
