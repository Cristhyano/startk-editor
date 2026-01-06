import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
    DownloadIcon,
    UploadIcon,
    ResetIcon,
    EyeOpenIcon,
    Pencil2Icon,
} from "@radix-ui/react-icons";

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
    type DefinitiveDoc = {
        id: string;
        title: string;
        content: string;
    };

    type SavedState = {
        upper: string;
        left: string;
        right: string;
        bottom: string;
        center: string;
        definitives?: Array<Pick<DefinitiveDoc, "title" | "content">>;
        activeIndex?: number;
    };

    const storageKey = "stark-editor:layout-texts";
    const emptyState: SavedState = {
        upper: "",
        left: "",
        right: "",
        bottom: "",
        center: "",
    };
    const defaultDefinitives: DefinitiveDoc[] = [
        { id: "def-1", title: "DEF 1", content: "" },
    ];
    const definitiveCounterRef = useRef(2);

    const loadState = (): SavedState => {
        if (typeof window === "undefined") {
            return {
                ...emptyState,
                definitives: defaultDefinitives.map(({ title, content }) => ({ title, content })),
                activeIndex: 0,
            };
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                return {
                    ...emptyState,
                    definitives: defaultDefinitives.map(({ title, content }) => ({ title, content })),
                    activeIndex: 0,
                };
            }
            const parsed = JSON.parse(raw) as Partial<SavedState>;
            const parsedDefinitives = Array.isArray(parsed.definitives)
                ? parsed.definitives
                : parsed.right
                  ? [{ title: "DEF 1", content: parsed.right }]
                  : defaultDefinitives.map(({ title, content }) => ({ title, content }));
            const parsedIndex =
                typeof parsed.activeIndex === "number"
                    ? Math.max(0, Math.min(parsedDefinitives.length - 1, parsed.activeIndex))
                    : 0;
            return {
                ...emptyState,
                ...parsed,
                definitives: parsedDefinitives,
                activeIndex: parsedIndex,
            };
        } catch {
            window.localStorage.removeItem(storageKey);
            return {
                ...emptyState,
                definitives: defaultDefinitives.map(({ title, content }) => ({ title, content })),
                activeIndex: 0,
            };
        }
    };

    const initialStateRef = useRef<SavedState | null>(null);
    if (!initialStateRef.current) {
        initialStateRef.current = loadState();
    }

    const [upperText, setUpperText] = useState(initialStateRef.current.upper);
    const [leftText, setLeftText] = useState(initialStateRef.current.left);
    const [definitives, setDefinitives] = useState<DefinitiveDoc[]>(
        (initialStateRef.current.definitives ?? defaultDefinitives).map((doc, index) => ({
            id: `def-${index + 1}`,
            title: doc.title,
            content: doc.content,
        })),
    );
    const [activeDefinitiveIndex, setActiveDefinitiveIndex] = useState(
        initialStateRef.current.activeIndex ?? 0,
    );
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
        "resize-none p-4 bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-colors duration-200";
    const draftTextareaClass =
        "resize-none p-4 bg-slate-900 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-colors duration-200";
    const floatDurationMs = 780;
    const floatDelayMs = 90;
    const trashDurationMs = 5000;
    const [trashCycle, setTrashCycle] = useState(0);
    const [trashActive, setTrashActive] = useState(false);
    const [rightPreviewMode, setRightPreviewMode] = useState(false);
    const controlButtonClass =
        "rounded-md border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-colors duration-200";

    const getPayload = (): SavedState => ({
        upper: upperText,
        left: leftText,
        right: "",
        bottom: bottomText,
        center: centerText,
        definitives: definitives.map(({ title, content }) => ({ title, content })),
        activeIndex: activeDefinitiveIndex,
    });

    const normalizePayload = (payload: Partial<SavedState>): SavedState => {
        const fallbackDefinitives = payload.right
            ? [{ title: "DEF 1", content: payload.right }]
            : defaultDefinitives.map(({ title, content }) => ({ title, content }));
        const mergedDefinitives = Array.isArray(payload.definitives)
            ? payload.definitives
            : fallbackDefinitives;
        const safeIndex =
            typeof payload.activeIndex === "number"
                ? Math.max(0, Math.min(mergedDefinitives.length - 1, payload.activeIndex))
                : 0;
        return {
            ...emptyState,
            ...payload,
            definitives: mergedDefinitives,
            activeIndex: safeIndex,
        };
    };

    const applyPayload = (payload: Partial<SavedState>) => {
        const normalized = normalizePayload(payload);
        setUpperText(normalized.upper);
        setLeftText(normalized.left);
        setBottomText(normalized.bottom);
        setCenterText(normalized.center);
        setDefinitives(
            normalized.definitives?.map((doc, index) => ({
                id: `def-${index + 1}`,
                title: doc.title,
                content: doc.content,
            })) ?? defaultDefinitives,
        );
        setActiveDefinitiveIndex(normalized.activeIndex ?? 0);
    };

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify(getPayload()));
    }, [upperText, leftText, bottomText, centerText, definitives, activeDefinitiveIndex]);

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

    const moveText = (
        fromText: string,
        setFrom: React.Dispatch<React.SetStateAction<string>>,
        fromRef: React.RefObject<HTMLTextAreaElement>,
        toRef: React.RefObject<HTMLTextAreaElement>,
        toText: string,
        setTo: (next: string) => void,
        onMoved?: () => void,
    ) => {
        createFloatingText(fromRef.current, toRef.current, fromText);
        setTo(toText ? `${toText}\n${fromText}` : fromText);
        setFrom("");
        onMoved?.();
    };

    const applyCenterEdit = (nextValue: string, caretStart: number, caretEnd = caretStart) => {
        setCenterText(nextValue);
        window.requestAnimationFrame(() => {
            if (!centerRef.current) {
                return;
            }
            centerRef.current.selectionStart = caretStart;
            centerRef.current.selectionEnd = caretEnd;
        });
    };

    const getLineBounds = (text: string, position: number) => {
        const start = text.lastIndexOf("\n", position - 1) + 1;
        const end = text.indexOf("\n", position);
        const safeEnd = end === -1 ? text.length : end;
        return { start, end: safeEnd, line: text.slice(start, safeEnd) };
    };

    const applyHeading = (level: number, selectionStart: number) => {
        const { start, end, line } = getLineBounds(centerText, selectionStart);
        const match = line.match(/^(\s*)(#{1,6})\s+/);
        const prefix = "#".repeat(level) + " ";
        let nextLine = line;

        if (match) {
            if (match[2].length === level) {
                nextLine = line.slice(match[0].length);
            } else {
                nextLine = `${match[1]}${prefix}${line.slice(match[0].length)}`;
            }
        } else {
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : "";
            nextLine = `${indent}${prefix}${line.slice(indent.length)}`;
        }

        const nextValue = centerText.slice(0, start) + nextLine + centerText.slice(end);
        const caretOffset = nextLine.length - line.length;
        applyCenterEdit(nextValue, selectionStart + caretOffset);
    };

    const toggleChecklist = (selectionStart: number) => {
        const { start, end, line } = getLineBounds(centerText, selectionStart);
        const checklistMatch = line.match(/^(\s*)- \[( |x)\] /);
        let nextLine = line;

        if (checklistMatch) {
            const nextState = checklistMatch[2] === "x" ? " " : "x";
            nextLine = line.replace(/^(\s*)- \[( |x)\] /, `$1- [${nextState}] `);
        } else if (line.match(/^(\s*)- /)) {
            nextLine = line.replace(/^(\s*)- /, "$1- [ ] ");
        } else {
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : "";
            nextLine = `${indent}- [ ] ${line.slice(indent.length)}`;
        }

        const nextValue = centerText.slice(0, start) + nextLine + centerText.slice(end);
        const caretOffset = nextLine.length - line.length;
        applyCenterEdit(nextValue, selectionStart + caretOffset);
    };

    const indentSelection = (selectionStart: number, selectionEnd: number, outdent: boolean) => {
        const startLine = getLineBounds(centerText, selectionStart).start;
        const endLine = getLineBounds(centerText, selectionEnd).end;
        const block = centerText.slice(startLine, endLine);
        const lines = block.split("\n");
        let removed = 0;

        const nextLines = lines.map((line, index) => {
            if (outdent) {
                const match = line.match(/^ {1,2}/);
                if (match) {
                    removed += match[0].length;
                    return line.slice(match[0].length);
                }
                return line;
            }
            if (index === 0 || line.length > 0) {
                return `  ${line}`;
            }
            return line;
        });

        const nextBlock = nextLines.join("\n");
        const nextValue = centerText.slice(0, startLine) + nextBlock + centerText.slice(endLine);
        const added = outdent ? -removed : 2 * lines.length;
        applyCenterEdit(nextValue, selectionStart + (outdent ? -Math.min(2, removed) : 2), selectionEnd + added);
    };

    const handleAutoListEnter = (selectionStart: number, selectionEnd: number) => {
        if (selectionStart !== selectionEnd) {
            return false;
        }
        const { line, start } = getLineBounds(centerText, selectionStart);
        const checklistMatch = line.match(/^(\s*)- \[( |x)\] /);
        if (checklistMatch) {
            const prefix = `${checklistMatch[1]}- [ ] `;
            const nextValue =
                centerText.slice(0, selectionStart) + "\n" + prefix + centerText.slice(selectionStart);
            applyCenterEdit(nextValue, selectionStart + 1 + prefix.length);
            return true;
        }
        const listMatch = line.match(/^(\s*)- /);
        if (listMatch) {
            const prefix = `${listMatch[1]}- `;
            const nextValue =
                centerText.slice(0, selectionStart) + "\n" + prefix + centerText.slice(selectionStart);
            applyCenterEdit(nextValue, selectionStart + 1 + prefix.length);
            return true;
        }
        if (selectionStart === start && line.trim().length === 0) {
            return false;
        }
        return false;
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

    const rightText = definitives[activeDefinitiveIndex]?.content ?? "";

    const setRightText = (value: string) => {
        setDefinitives((prev) =>
            prev.map((doc, index) =>
                index === activeDefinitiveIndex ? { ...doc, content: value } : doc,
            ),
        );
    };

    const addDefinitive = () => {
        const title = `DEF ${definitiveCounterRef.current}`;
        definitiveCounterRef.current += 1;
        setDefinitives((prev) => [...prev, { id: `def-${title}`, title, content: "" }]);
        setActiveDefinitiveIndex(definitives.length);
    };

    const switchDefinitive = (direction: number) => {
        setActiveDefinitiveIndex((prev) => {
            const count = definitives.length;
            if (count === 0) {
                return 0;
            }
            const next = (prev + direction + count) % count;
            return next;
        });
    };

    useEffect(() => {
        const handleKeydown = (event: KeyboardEvent) => {
            if (!event.ctrlKey || !event.altKey) {
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                switchDefinitive(1);
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                switchDefinitive(-1);
                return;
            }
            if (event.key === "n" || event.key === "N") {
                event.preventDefault();
                addDefinitive();
            }
        };

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [definitives.length]);
    const handleCenterKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const selectionStart = event.currentTarget.selectionStart ?? 0;
        const selectionEnd = event.currentTarget.selectionEnd ?? 0;

        if (event.key === "Tab") {
            event.preventDefault();
            indentSelection(selectionStart, selectionEnd, event.shiftKey);
            return;
        }

        if (event.key === "Enter") {
            if (handleAutoListEnter(selectionStart, selectionEnd)) {
                event.preventDefault();
            }
            return;
        }

        if (event.ctrlKey && !event.shiftKey && event.key >= "1" && event.key <= "3") {
            event.preventDefault();
            applyHeading(Number(event.key), selectionStart);
            return;
        }

        if (event.ctrlKey && event.shiftKey && (event.key === "c" || event.key === "C")) {
            event.preventDefault();
            toggleChecklist(selectionStart);
            return;
        }

        if (event.altKey) {
            return;
        }

        if (!event.ctrlKey) {
            return;
        }

        const shiftMoves: Record<string, () => void> = {
            ArrowDown: () =>
                moveText(upperText, setUpperText, upperRef, centerRef, centerText, setCenterText),
            ArrowRight: () =>
                moveText(leftText, setLeftText, leftRef, centerRef, centerText, setCenterText),
            ArrowLeft: () =>
                moveText(rightText, setRightText, rightRef, centerRef, centerText, setCenterText),
            ArrowUp: () =>
                moveText(bottomText, setBottomText, bottomRef, centerRef, centerText, setCenterText),
        };
        const directMoves: Record<string, () => void> = {
            ArrowUp: () =>
                moveText(centerText, setCenterText, centerRef, upperRef, upperText, setUpperText),
            ArrowLeft: () =>
                moveText(centerText, setCenterText, centerRef, leftRef, leftText, setLeftText),
            ArrowRight: () =>
                moveText(centerText, setCenterText, centerRef, rightRef, rightText, setRightText),
            ArrowDown: () =>
                moveText(
                    centerText,
                    setCenterText,
                    centerRef,
                    bottomRef,
                    bottomText,
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

    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const renderInlineMarkdown = (value: string) => {
        let output = escapeHtml(value);
        output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
        output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        return output;
    };

    const renderMarkdownLines = (value: string) =>
        value.split("\n").map((line, index) => {
            if (!line.trim()) {
                return <div key={`e-${index}`} className="h-4"></div>;
            }
            const heading = line.match(/^(#{1,3})\s+(.*)$/);
            if (heading) {
                const level = heading[1].length;
                const sizeClass =
                    level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg";
                return (
                    <div
                        key={`h-${index}`}
                        className={`${sizeClass} font-semibold text-slate-100`}
                        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(heading[2]) }}
                    />
                );
            }
            const checklist = line.match(/^(\s*)- \[( |x)\] (.*)$/);
            if (checklist) {
                const checked = checklist[2] === "x";
                return (
                    <div key={`c-${index}`} className="flex items-center gap-2 text-slate-200">
                        <span
                            className={`inline-flex h-3 w-3 items-center justify-center border border-slate-400 ${checked ? "bg-slate-400" : "bg-transparent"}`}
                        ></span>
                        <span
                            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(checklist[3]) }}
                        />
                    </div>
                );
            }
            const bullet = line.match(/^(\s*)- (.*)$/);
            if (bullet) {
                return (
                    <div key={`b-${index}`} className="flex items-start gap-2 text-slate-200">
                        <span className="mt-2 h-1 w-1 rounded-full bg-slate-400"></span>
                        <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(bullet[2]) }} />
                    </div>
                );
            }
            return (
                <div
                    key={`p-${index}`}
                    className="text-slate-300"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }}
                />
            );
        });

    return (
        <div className="h-screen flex flex-row bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2">
                <button
                    className={controlButtonClass}
                    type="button"
                    onClick={handleExport}
                    title="Export"
                    aria-label="Export"
                >
                    <DownloadIcon />
                </button>
                <button
                    className={controlButtonClass}
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    title="Import"
                    aria-label="Import"
                >
                    <UploadIcon />
                </button>
                <button
                    className={controlButtonClass}
                    type="button"
                    onClick={handleReset}
                    title="Reset"
                    aria-label="Reset"
                >
                    <ResetIcon />
                </button>
                <button
                    className={controlButtonClass}
                    type="button"
                    onClick={() => setRightPreviewMode((prev) => !prev)}
                    title={rightPreviewMode ? "Edit" : "Preview"}
                    aria-label={rightPreviewMode ? "Edit" : "Preview"}
                >
                    {rightPreviewMode ? <Pencil2Icon /> : <EyeOpenIcon />}
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
                .fade-in {
                    animation: fadeIn 180ms ease-out forwards;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(2px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
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

            <div className="flex-1 flex h-full flex-col gap-1 min-h-0">
                <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200">
                    RASCUNHO
                </div>
                <DocumentTextarea
                    className={`${draftTextareaClass} flex-1 transition-shadow duration-200 focus:shadow-[0_0_0_1px_rgba(148,163,184,0.3)]`}
                    value={leftText}
                    onChange={setLeftText}
                    textareaRef={leftRef}
                />
            </div>

            <div className="flex-1 w-full flex flex-col min-h-0">
                <div className="flex flex-1 flex-col gap-1 min-h-0">
                    <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200">
                        DOCUMENTO
                    </div>
                    <DocumentTextarea
                        className={`${darkTextareaClass} flex-1 transition-shadow duration-200 focus:shadow-[0_0_0_1px_rgba(148,163,184,0.3)]`}
                        value={upperText}
                        onChange={setUpperText}
                        textareaRef={upperRef}
                    />
                </div>
                <div className="flex flex-1 flex-col gap-1 min-h-0">
                    <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200">
                        ENTRADA
                    </div>
                    <textarea
                        className={`${darkTextareaClass} flex-1 text-4xl font-mono transition-shadow duration-200 focus:shadow-[0_0_0_1px_rgba(148,163,184,0.3)]`}
                        value={centerText}
                        autoFocus
                        ref={centerRef}
                        onChange={(event) => setCenterText(event.target.value)}
                        onKeyDown={handleCenterKeyDown}
                    ></textarea>
                </div>

                <div className="flex flex-1 flex-col gap-1 min-h-0">
                    <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200">
                        LIXEIRA
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <DocumentTextarea
                            className={`${darkTextareaClass} h-full w-full transition-shadow duration-200 focus:shadow-[0_0_0_1px_rgba(148,163,184,0.3)]`}
                            value={bottomText}
                            onChange={setBottomText}
                            textareaRef={bottomRef}
                        />
                        {trashActive ? (
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-slate-800/70">
                                <div
                                    key={trashCycle}
                                    className="trash-bar h-full bg-red-500"
                                ></div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex h-full flex-col gap-1 min-h-0 overflow-hidden">
                <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200">
                    DEFINITIVO
                </div>
                <div className="flex items-center gap-2">
                    {definitives.map((doc, index) => (
                        <button
                            key={doc.id}
                            className={`rounded-md border px-2 py-1 text-[10px] tracking-[0.2em] transition-colors duration-200 ${
                                index === activeDefinitiveIndex
                                    ? "border-slate-500 bg-slate-800 text-slate-100"
                                    : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                            }`}
                            type="button"
                            onClick={() => setActiveDefinitiveIndex(index)}
                            title={`DEF ${index + 1}`}
                        >
                            {doc.title}
                        </button>
                    ))}
                    <button
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400 transition-colors duration-200 hover:text-slate-200"
                        type="button"
                        onClick={addDefinitive}
                        title="Novo definitivo"
                    >
                        +
                    </button>
                </div>
                {rightPreviewMode ? (
                    <div className={`${darkTextareaClass} flex-1 w-full overflow-auto min-h-0 fade-in`}>
                        <div className="space-y-2 leading-relaxed">
                            {renderMarkdownLines(rightText)}
                        </div>
                    </div>
                ) : (
                    <DocumentTextarea
                        className={`${darkTextareaClass} flex-1 w-full transition-shadow duration-200 focus:shadow-[0_0_0_1px_rgba(148,163,184,0.3)]`}
                        value={rightText}
                        onChange={setRightText}
                        textareaRef={rightRef}
                    />
                )}
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
