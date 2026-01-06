import { useEffect, useRef } from "react";

type AutoScrollTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    className: string;
    textareaRef?: React.Ref<HTMLTextAreaElement>;
};

const assignRef = (
    ref: React.Ref<HTMLTextAreaElement> | undefined,
    node: HTMLTextAreaElement | null,
) => {
    if (!ref) {
        return;
    }
    if (typeof ref === "function") {
        ref(node);
        return;
    }
    (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
};

export const AutoScrollTextarea = ({
    value,
    onChange,
    className,
    textareaRef,
}: AutoScrollTextareaProps) => {
    const localRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!localRef.current) {
            return;
        }
        localRef.current.scrollTop = localRef.current.scrollHeight;
    }, [value]);

    return (
        <textarea
            ref={(node) => {
                localRef.current = node;
                assignRef(textareaRef, node);
            }}
            className={className}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        ></textarea>
    );
};
