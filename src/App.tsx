import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AutoScrollTextarea } from "./components/atoms/AutoScrollTextarea";
import { Label } from "./components/atoms/Label";
import { ActionBar } from "./components/organisms/ActionBar";
import { CommandLogPanel } from "./components/organisms/CommandLogPanel";
import { DefinitiveTabs } from "./components/organisms/DefinitiveTabs";
import { EditorTemplate } from "./components/templates/EditorTemplate";
import { useCommandLog } from "./hooks/useCommandLog";
import { useEditorState } from "./hooks/useEditorState";
import { usePressedKeys } from "./hooks/usePressedKeys";
import { useTrashTimer } from "./hooks/useTrashTimer";

function App() {
    const storageKey = "stark-editor:layout-texts";
    const {
        leftText,
        setLeftText,
        bottomText,
        setBottomText,
        centerText,
        setCenterText,
        rightText,
        setRightText,
        definitives,
        activeDefinitiveIndex,
        setActiveDefinitiveIndex,
        addDefinitive,
        removeDefinitive,
        renameDefinitive,
        switchDefinitive,
        applyPayload,
        getPayload,
    } = useEditorState(storageKey);
    const [rightPreviewMode, setRightPreviewMode] = useState(false);
    const { commandLog, activeCommandId, logCommand } = useCommandLog(10);
    const pressedKeys = usePressedKeys();

    const centerRef = useRef<HTMLTextAreaElement | null>(null);
    const leftRef = useRef<HTMLTextAreaElement | null>(null);
    const rightRef = useRef<HTMLTextAreaElement | null>(null);
    const bottomRef = useRef<HTMLTextAreaElement | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const darkTextareaClass =
        "resize-none p-4 bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500";
    const draftTextareaClass =
        "resize-none p-4 bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500";
    const controlButtonClass =
        "rounded-md border border-gray-700 bg-gray-800 p-2 text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500";
    const floatDurationMs = 780;
    const floatDelayMs = 90;
    const trashDurationMs = 5000;
    const entryTimeoutMs = 60_000;

    const { trashActive, trashCycle, startTrashTimer, clearTrashTimer } = useTrashTimer(
        trashDurationMs,
        () => setBottomText(""),
    );

    useEffect(() => {
        if (!bottomText && trashActive) {
            clearTrashTimer();
        }
    }, [bottomText, trashActive, clearTrashTimer]);

    const [floaters, setFloaters] = useState<
        Array<{ id: number; text: string; fromX: number; fromY: number; dx: number; dy: number }>
    >([]);
    const floaterIdRef = useRef(0);
    const [entryActive, setEntryActive] = useState(false);
    const [entryCycle, setEntryCycle] = useState(0);
    const entryTimerRef = useRef<number | null>(null);
    const centerTextRef = useRef(centerText);
    const leftTextRef = useRef(leftText);

    useEffect(() => {
        centerTextRef.current = centerText;
    }, [centerText]);

    useEffect(() => {
        leftTextRef.current = leftText;
    }, [leftText]);

    useEffect(() => {
        if (entryTimerRef.current) {
            window.clearTimeout(entryTimerRef.current);
            entryTimerRef.current = null;
        }

        if (!centerText.trim()) {
            setEntryActive(false);
            return;
        }

        setEntryActive(true);
        setEntryCycle((prev) => prev + 1);
        entryTimerRef.current = window.setTimeout(() => {
            const latestCenter = centerTextRef.current;
            if (!latestCenter.trim()) {
                return;
            }
            moveText(
                latestCenter,
                setCenterText,
                centerRef,
                leftRef,
                leftTextRef.current,
                setLeftText,
                "AUTO MOVE CENTER -> LEFT",
            );
            setEntryActive(false);
        }, entryTimeoutMs);

        return () => {
            if (entryTimerRef.current) {
                window.clearTimeout(entryTimerRef.current);
                entryTimerRef.current = null;
            }
            setEntryActive(false);
        };
    }, [centerText, setCenterText, setLeftText]);

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
        const displayText = trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
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
        const id = floaterIdRef.current + 1;
        floaterIdRef.current = id;
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
        logLabel: string,
        onMoved?: () => void,
    ) => {
        createFloatingText(fromRef.current, toRef.current, fromText);
        setTo(toText ? `${toText}\n${fromText}` : fromText);
        setFrom("");
        logCommand(logLabel);
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
        applyCenterEdit(
            nextValue,
            selectionStart + (outdent ? -Math.min(2, removed) : 2),
            selectionEnd + added,
        );
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

    const escapeHtml = (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
                const sizeClass = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg";
                return (
                    <div
                        key={`h-${index}`}
                        className={`${sizeClass} font-semibold text-gray-100`}
                        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(heading[2]) }}
                    />
                );
            }
            const checklist = line.match(/^(\s*)- \[( |x)\] (.*)$/);
            if (checklist) {
                const checked = checklist[2] === "x";
                return (
                    <div key={`c-${index}`} className="flex items-center gap-2 text-gray-200">
                        <span
                            className={`inline-flex h-3 w-3 items-center justify-center border border-gray-400 ${
                                checked ? "bg-gray-400" : "bg-transparent"
                            }`}
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
                    <div key={`b-${index}`} className="flex items-start gap-2 text-gray-200">
                        <span className="mt-2 h-1 w-1 rounded-full bg-gray-400"></span>
                        <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(bullet[2]) }} />
                    </div>
                );
            }
            return (
                <div
                    key={`p-${index}`}
                    className="text-gray-300"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }}
                />
            );
        });

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
            const parsed = JSON.parse(text) as Partial<ReturnType<typeof getPayload>>;
            applyPayload(parsed);
        } catch {
            // Ignore invalid imports.
        } finally {
            event.target.value = "";
        }
    };

    const handleReset = () => {
        if (!window.confirm("Resetar tudo? O texto sera perdido.")) {
            return;
        }
        applyPayload({});
        window.localStorage.removeItem(storageKey);
    };

    const handleCenterKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const selectionStart = event.currentTarget.selectionStart ?? 0;
        const selectionEnd = event.currentTarget.selectionEnd ?? 0;

        if (event.key === "Tab") {
            event.preventDefault();
            indentSelection(selectionStart, selectionEnd, event.shiftKey);
            logCommand(event.shiftKey ? "OUTDENT" : "INDENT");
            return;
        }

        if (event.key === "Enter") {
            if (handleAutoListEnter(selectionStart, selectionEnd)) {
                event.preventDefault();
                logCommand("LIST CONTINUE");
            }
            return;
        }

        if (event.ctrlKey && !event.shiftKey && event.key >= "1" && event.key <= "3") {
            event.preventDefault();
            applyHeading(Number(event.key), selectionStart);
            logCommand(`HEADING H${event.key}`);
            return;
        }

        if (event.ctrlKey && event.shiftKey && (event.key === "c" || event.key === "C")) {
            event.preventDefault();
            toggleChecklist(selectionStart);
            logCommand("CHECKLIST TOGGLE");
            return;
        }

        if (event.altKey) {
            return;
        }

        if (!event.ctrlKey) {
            return;
        }

        const shiftMoves: Record<string, () => void> = {
            ArrowRight: () =>
                moveText(
                    leftText,
                    setLeftText,
                    leftRef,
                    centerRef,
                    centerText,
                    setCenterText,
                    "MOVE LEFT -> CENTER",
                ),
            ArrowLeft: () =>
                moveText(
                    rightText,
                    setRightText,
                    rightRef,
                    centerRef,
                    centerText,
                    setCenterText,
                    "MOVE RIGHT -> CENTER",
                ),
            ArrowUp: () =>
                moveText(
                    bottomText,
                    setBottomText,
                    bottomRef,
                    centerRef,
                    centerText,
                    setCenterText,
                    "MOVE BOTTOM -> CENTER",
                ),
        };
        const directMoves: Record<string, () => void> = {
            ArrowLeft: () =>
                moveText(
                    centerText,
                    setCenterText,
                    centerRef,
                    leftRef,
                    leftText,
                    setLeftText,
                    "MOVE CENTER -> LEFT",
                ),
            ArrowRight: () =>
                moveText(
                    centerText,
                    setCenterText,
                    centerRef,
                    rightRef,
                    rightText,
                    setRightText,
                    "MOVE CENTER -> RIGHT",
                ),
            ArrowDown: () =>
                moveText(
                    centerText,
                    setCenterText,
                    centerRef,
                    bottomRef,
                    bottomText,
                    setBottomText,
                    "MOVE CENTER -> BOTTOM",
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

    useEffect(() => {
        const handleKeydown = (event: KeyboardEvent) => {
            if (!event.ctrlKey || !event.altKey) {
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                switchDefinitive(1);
                logCommand("TAB NEXT");
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                switchDefinitive(-1);
                logCommand("TAB PREV");
                return;
            }
            if (event.key === "n" || event.key === "N") {
                event.preventDefault();
                addDefinitive();
                logCommand("TAB NEW");
                return;
            }
            if (event.key === "r" || event.key === "R") {
                event.preventDefault();
                const current = definitives[activeDefinitiveIndex];
                if (!current) {
                    return;
                }
                const nextTitle = window.prompt("Renomear aba", current.title);
                if (!nextTitle) {
                    return;
                }
                const trimmed = nextTitle.trim();
                if (!trimmed) {
                    return;
                }
                renameDefinitive(activeDefinitiveIndex, trimmed);
                logCommand("TAB RENAME");
                return;
            }
            if (event.shiftKey && event.key === "Backspace") {
                event.preventDefault();
                removeDefinitive((doc) =>
                    window.confirm(`Remover ${doc.title}? O texto sera perdido.`),
                );
                logCommand("TAB CLOSE");
            }
        };

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [
        addDefinitive,
        removeDefinitive,
        renameDefinitive,
        switchDefinitive,
        logCommand,
        definitives,
        activeDefinitiveIndex,
    ]);

    const styles = (
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
            .entry-bar {
                animation: entryShrink ${entryTimeoutMs}ms linear forwards;
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
            @keyframes entryShrink {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }
        `}</style>
    );

    const leftColumn = (
        <div className="flex-1 flex h-full flex-col gap-1 min-h-0">
            <Label text="RASCUNHO" />
            <AutoScrollTextarea
                className={`${draftTextareaClass} flex-1`}
                value={leftText}
                onChange={setLeftText}
                textareaRef={leftRef}
            />
        </div>
    );

    const centerTop = (
        <div className="flex flex-1 flex-col gap-1 min-h-0">
            <CommandLogPanel
                className={`${darkTextareaClass} flex-1 font-mono text-xs leading-relaxed`}
                commandLog={commandLog}
                activeCommandId={activeCommandId}
            />
        </div>
    );

    const centerMiddle = (
        <div className="flex flex-1 flex-col gap-1 min-h-0">
            <Label text="ENTRADA" />
            <div className="flex-1 relative min-h-0">
                <textarea
                    className={`${darkTextareaClass} h-full w-full text-4xl font-mono`}
                    value={centerText}
                    autoFocus
                    ref={centerRef}
                    onChange={(event) => setCenterText(event.target.value)}
                    onKeyDown={handleCenterKeyDown}
                ></textarea>
                {entryActive ? (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div key={entryCycle} className="entry-bar h-full bg-green-500"></div>
                    </div>
                ) : null}
            </div>
        </div>
    );

    const centerBottom = (
        <div className="flex flex-1 flex-col gap-1 min-h-0">
            <Label text="LIXEIRA" />
            <div className="flex-1 relative min-h-0">
                <AutoScrollTextarea
                    className={`${darkTextareaClass} h-full w-full`}
                    value={bottomText}
                    onChange={setBottomText}
                    textareaRef={bottomRef}
                />
                {trashActive ? (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div key={trashCycle} className="trash-bar h-full bg-red-500"></div>
                    </div>
                ) : null}
            </div>
        </div>
    );

    const rightColumn = (
        <div className="flex-1 flex h-full flex-col gap-1 min-h-0 overflow-hidden">
            <Label text="DEFINITIVO" />
            <DefinitiveTabs
                definitives={definitives}
                activeIndex={activeDefinitiveIndex}
                onSelect={setActiveDefinitiveIndex}
                onAdd={addDefinitive}
            />
            {rightPreviewMode ? (
                <div className={`${darkTextareaClass} flex-1 w-full overflow-auto min-h-0 fade-in`}>
                    <div className="space-y-2 leading-relaxed">{renderMarkdownLines(rightText)}</div>
                </div>
            ) : (
                <AutoScrollTextarea
                    className={`${darkTextareaClass} flex-1 w-full`}
                    value={rightText}
                    onChange={setRightText}
                    textareaRef={rightRef}
                />
            )}
        </div>
    );

    const actionBar = (
        <>
            <ActionBar
                controlButtonClass={controlButtonClass}
                rightPreviewMode={rightPreviewMode}
                pressedKeys={pressedKeys}
                onExport={handleExport}
                onImportClick={() => importInputRef.current?.click()}
                onReset={handleReset}
                onTogglePreview={() => setRightPreviewMode((prev) => !prev)}
            />
            <input
                ref={importInputRef}
                className="hidden"
                type="file"
                accept="application/json"
                onChange={handleImport}
            />
        </>
    );

    const overlay = (
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
                        className="floating-text max-w-xs px-1 text-sm text-gray-200"
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
    );

    return (
        <EditorTemplate
            actionBar={actionBar}
            left={leftColumn}
            centerTop={centerTop}
            centerMiddle={centerMiddle}
            centerBottom={centerBottom}
            right={rightColumn}
            overlay={overlay}
            styles={styles}
        />
    );
}

export default App;
