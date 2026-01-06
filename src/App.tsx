import { useEffect, useRef, useState } from "react";

type DocumentTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    className: string;
};

function DocumentTextarea({ value, onChange, className }: DocumentTextareaProps) {
    const textRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!textRef.current) {
            return;
        }
        textRef.current.scrollTop = textRef.current.scrollHeight;
    }, [value]);

    return (
        <textarea
            ref={textRef}
            className={className}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        ></textarea>
    );
}

function App() {
    const [upperText, setUpperText] = useState("");
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [bottomText, setBottomText] = useState("");
    const [centerText, setCenterText] = useState("");
    const documentClassName =
        "flex-1 resize-none p-4 text-center";

    const handleCenterKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!event.ctrlKey) {
            return;
        }

        if (event.shiftKey) {
            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    setCenterText((prev) => (prev ? `${prev}\n${upperText}` : upperText));
                    setUpperText("");
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    setCenterText((prev) => (prev ? `${prev}\n${leftText}` : leftText));
                    setLeftText("");
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    setCenterText((prev) => (prev ? `${prev}\n${rightText}` : rightText));
                    setRightText("");
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    setCenterText((prev) => (prev ? `${prev}\n${bottomText}` : bottomText));
                    setBottomText("");
                    break;
                default:
                    break;
            }
            return;
        }

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                setUpperText((prev) => (prev ? `${prev}\n${centerText}` : centerText));
                setCenterText("");
                break;
            case "ArrowLeft":
                event.preventDefault();
                setLeftText((prev) => (prev ? `${prev}\n${centerText}` : centerText));
                setCenterText("");
                break;
            case "ArrowRight":
                event.preventDefault();
                setRightText((prev) => (prev ? `${prev}\n${centerText}` : centerText));
                setCenterText("");
                break;
            case "ArrowDown":
                event.preventDefault();
                setBottomText((prev) => (prev ? `${prev}\n${centerText}` : centerText));
                setCenterText("");
                break;
            default:
                break;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-neutral-900 text-neutral-200">
            <DocumentTextarea
                className={documentClassName}
                value={upperText}
                onChange={setUpperText}
            />
            <div className="flex-1 w-full flex flex-row">
                <DocumentTextarea
                    className={documentClassName}
                    value={leftText}
                    onChange={setLeftText}
                />
                <textarea
                    className="flex-1 text-center border px-20 py-8 border-neutral-200 rounded-lg animate-pulse"
                    value={centerText}
                    onChange={(event) => setCenterText(event.target.value)}
                    onKeyDown={handleCenterKeyDown}
                ></textarea>
                <DocumentTextarea
                    className={documentClassName}
                    value={rightText}
                    onChange={setRightText}
                />
            </div>
            <DocumentTextarea
                className={documentClassName}
                value={bottomText}
                onChange={setBottomText}
            />
        </div>
    );
}

export default App;
