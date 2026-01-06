import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type DocumentTextareaProps = {
    value: string;
    onChange: (value: string) => void;
    className: string;
    textareaRef?: React.Ref<HTMLTextAreaElement>;
};

type FloatingText = {
    id: number;
    text: string;
    fromX: number;
    fromY: number;
    dx: number;
    dy: number;
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

function DocumentTextarea({ value, onChange, className, textareaRef }: DocumentTextareaProps) {
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
}

function App() {
    type SavedState = {
        upper: string;
        left: string;
        right: string;
        bottom: string;
        center: string;
    };

    const storageKey = "stark-editor:layout-texts";
    const emptyState: SavedState = {
        upper: "",
        left: "",
        right: "",
        bottom: "",
        center: "",
    };

    const loadState = (): SavedState => {
        if (typeof window === "undefined") {
            return emptyState;
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                return emptyState;
            }
            const parsed = JSON.parse(raw) as Partial<SavedState>;
            return { ...emptyState, ...parsed };
        } catch {
            window.localStorage.removeItem(storageKey);
            return emptyState;
        }
    };

    const initialStateRef = useRef<SavedState | null>(null);
    if (!initialStateRef.current) {
        initialStateRef.current = loadState();
    }

    const [upperText, setUpperText] = useState(initialStateRef.current.upper);
    const [leftText, setLeftText] = useState(initialStateRef.current.left);
    const [rightText, setRightText] = useState(initialStateRef.current.right);
    const [bottomText, setBottomText] = useState(initialStateRef.current.bottom);
    const [centerText, setCenterText] = useState(initialStateRef.current.center);
    const [floaters, setFloaters] = useState<FloatingText[]>([]);
    const nextFloaterId = useRef(0);
    const centerRef = useRef<HTMLTextAreaElement | null>(null);
    const upperRef = useRef<HTMLTextAreaElement | null>(null);
    const leftRef = useRef<HTMLTextAreaElement | null>(null);
    const rightRef = useRef<HTMLTextAreaElement | null>(null);
    const bottomRef = useRef<HTMLTextAreaElement | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const trashTimerRef = useRef<number | null>(null);
    const darkTextareaClass =
        "resize-none p-4 bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600";
    const draftTextareaClass =
        "resize-none p-4 bg-slate-900 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600";
    const floatDurationMs = 780;
    const floatDelayMs = 90;
    const trashDurationMs = 5000;
    const [trashCycle, setTrashCycle] = useState(0);
    const [trashActive, setTrashActive] = useState(false);
    const controlButtonClass =
        "rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600";

    const getPayload = (): SavedState => ({
        upper: upperText,
        left: leftText,
        right: rightText,
        bottom: bottomText,
        center: centerText,
    });

    const normalizePayload = (payload: Partial<SavedState>): SavedState => ({
        ...emptyState,
        ...payload,
    });

    const applyPayload = (payload: Partial<SavedState>) => {
        const normalized = normalizePayload(payload);
        setUpperText(normalized.upper);
        setLeftText(normalized.left);
        setRightText(normalized.right);
        setBottomText(normalized.bottom);
        setCenterText(normalized.center);
    };

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify(getPayload()));
    }, [upperText, leftText, rightText, bottomText, centerText]);

    useEffect(() => {
        return () => {
            if (trashTimerRef.current) {
                window.clearTimeout(trashTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!bottomText && trashActive) {
            if (trashTimerRef.current) {
                window.clearTimeout(trashTimerRef.current);
                trashTimerRef.current = null;
            }
            setTrashActive(false);
        }
    }, [bottomText, trashActive]);

    const createFloatingText = (
        fromEl: HTMLTextAreaElement | null,
        toEl: HTMLTextAreaElement | null,
        rawText: string,
    ) => {
        if (!fromEl || !toEl) {
            return;
        }
        const trimmed = rawText.trim();
        if (!trimmed) {
            return;
        }

        const displayText =
            trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const fromPos = {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2,
        };
        const toPos = {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2,
        };
        const id = nextFloaterId.current + 1;

        nextFloaterId.current = id;
        setFloaters((prev) => [
            ...prev,
            {
                id,
                text: displayText,
                fromX: fromPos.x,
                fromY: fromPos.y,
                dx: toPos.x - fromPos.x,
                dy: toPos.y - fromPos.y,
            },
        ]);

        window.setTimeout(() => {
            setFloaters((prev) => prev.filter((item) => item.id !== id));
        }, floatDurationMs + floatDelayMs);
    };

    const appendText = (
        setTarget: React.Dispatch<React.SetStateAction<string>>,
        value: string,
    ) => {
        setTarget((prev) => (prev ? `${prev}\n${value}` : value));
    };

    const moveText = (
        fromText: string,
        setFrom: React.Dispatch<React.SetStateAction<string>>,
        fromRef: React.RefObject<HTMLTextAreaElement>,
        toRef: React.RefObject<HTMLTextAreaElement>,
        setTo: React.Dispatch<React.SetStateAction<string>>,
        onMoved?: () => void,
    ) => {
        createFloatingText(fromRef.current, toRef.current, fromText);
        appendText(setTo, fromText);
        setFrom("");
        onMoved?.();
    };

    const startTrashTimer = () => {
        if (trashTimerRef.current) {
            window.clearTimeout(trashTimerRef.current);
        }
        setTrashActive(true);
        setTrashCycle((prev) => prev + 1);
        trashTimerRef.current = window.setTimeout(() => {
            setBottomText("");
            setTrashActive(false);
            trashTimerRef.current = null;
        }, trashDurationMs);
    };

    const handleReset = () => {
        applyPayload({});
        window.localStorage.removeItem(storageKey);
    };

    const handleExport = async () => {
        const payload = JSON.stringify(getPayload(), null, 2);
        try {
            await navigator.clipboard.writeText(payload);
        } catch {
            // Clipboard can be blocked; continue to download.
        }
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "stark-editor-state.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as Partial<SavedState>;
            const normalized = normalizePayload(parsed);
            applyPayload(normalized);
            window.localStorage.setItem(storageKey, JSON.stringify(normalized));
        } catch {
            // Ignore invalid imports.
        } finally {
            event.target.value = "";
        }
    };

    const handleCenterKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!event.ctrlKey) {
            return;
        }

        const shiftMoves: Record<string, () => void> = {
            ArrowDown: () =>
                moveText(upperText, setUpperText, upperRef, centerRef, setCenterText),
            ArrowRight: () =>
                moveText(leftText, setLeftText, leftRef, centerRef, setCenterText),
            ArrowLeft: () =>
                moveText(rightText, setRightText, rightRef, centerRef, setCenterText),
            ArrowUp: () =>
                moveText(bottomText, setBottomText, bottomRef, centerRef, setCenterText),
        };
        const directMoves: Record<string, () => void> = {
            ArrowUp: () =>
                moveText(centerText, setCenterText, centerRef, upperRef, setUpperText),
            ArrowLeft: () =>
                moveText(centerText, setCenterText, centerRef, leftRef, setLeftText),
            ArrowRight: () =>
                moveText(centerText, setCenterText, centerRef, rightRef, setRightText),
            ArrowDown: () =>
                moveText(
                    centerText,
                    setCenterText,
                    centerRef,
                    bottomRef,
                    setBottomText,
                    startTrashTimer,
                ),
        };
        const action = event.shiftKey ? shiftMoves[event.key] : directMoves[event.key];

        if (!action) {
            return;
        }

        event.preventDefault();
        action();
    };

    return (
        <div className="h-screen flex flex-row bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2">
                <button className={controlButtonClass} type="button" onClick={handleExport}>
                    Export
                </button>
                <button
                    className={controlButtonClass}
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                >
                    Import
                </button>
                <button className={controlButtonClass} type="button" onClick={handleReset}>
                    Reset
                </button>
                <input
                    ref={importInputRef}
                    className="hidden"
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                />
            </div>
            <style>{`
                @keyframes floatArc {
                    0% {
                        transform: translate(0px, 0px);
                        opacity: 0.0;
                    }
                    18% {
                        opacity: 0.8;
                    }
                    58% {
                        transform: translate(calc(var(--dx) * 0.6), calc(var(--dy) * 0.6 - 12px));
                        opacity: 0.6;
                    }
                    100% {
                        transform: translate(var(--dx), var(--dy));
                        opacity: 0.0;
                    }
                }
                .floating-text {
                    animation: floatArc ${floatDurationMs}ms cubic-bezier(0.22, 0.7, 0.18, 1) forwards;
                    will-change: transform, opacity;
                }
                .trash-bar {
                    animation: trashShrink ${trashDurationMs}ms linear forwards;
                    transform-origin: left;
                }
                @keyframes trashShrink {
                    from {
                        transform: scaleX(1);
                    }
                    to {
                        transform: scaleX(0);
                    }
                }
            `}</style>
            <div className="flex-[1]">
                <DocumentTextarea
                    className={`${draftTextareaClass} h-full w-full font-sans tracking-wide`}
                    value={leftText}
                    onChange={setLeftText}
                    textareaRef={leftRef}
                />
            </div>

            <div className="flex-[2] w-full flex flex-col">
                <DocumentTextarea
                    className={`${darkTextareaClass} flex-1 font-sans tracking-wide`}
                    value={upperText}
                    onChange={setUpperText}
                    textareaRef={upperRef}
                />
                <textarea
                    className={`${darkTextareaClass} text-center text-4xl font-mono`}
                    value={centerText}
                    autoFocus
                    ref={centerRef}
                    onChange={(event) => setCenterText(event.target.value)}
                    onKeyDown={handleCenterKeyDown}
                ></textarea>

                <div className="relative flex-1">
                    <DocumentTextarea
                        className={`${darkTextareaClass} h-full w-full font-sans tracking-wide`}
                        value={bottomText}
                        onChange={setBottomText}
                        textareaRef={bottomRef}
                    />
                    {trashActive ? (
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-slate-800/70">
                            <div key={trashCycle} className="trash-bar h-full bg-slate-400/80"></div>
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="flex-[2]">
                <DocumentTextarea
                    className={`${darkTextareaClass} h-full w-full font-sans tracking-wide`}
                    value={rightText}
                    onChange={setRightText}
                    textareaRef={rightRef}
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-50">
                {floaters.map((floater) => (
                    <div
                        key={floater.id}
                        className="fixed"
                        style={{
                            left: floater.fromX,
                            top: floater.fromY,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div
                            className="floating-text max-w-xs px-1 text-sm text-slate-200"
                            style={
                                {
                                    "--dx": `${floater.dx}px`,
                                    "--dy": `${floater.dy}px`,
                                    animationDelay: `${floatDelayMs}ms`,
                                } as CSSProperties
                            }
                        >
                            {floater.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
