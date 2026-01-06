import { useCallback, useEffect, useRef, useState } from "react";
import type { CommandEntry } from "../types/editor";

export const useCommandLog = (limit = 10) => {
    const [commandLog, setCommandLog] = useState<CommandEntry[]>([]);
    const [activeCommandId, setActiveCommandId] = useState<number | null>(null);
    const timerRef = useRef<number | null>(null);

    const logCommand = useCallback(
        (label: string) => {
            const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
            const entry: CommandEntry = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                text: `[${timestamp}] ${label}`,
            };
            setCommandLog((prev) => [...prev, entry].slice(-limit));
            setActiveCommandId(entry.id);
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
            timerRef.current = window.setTimeout(() => {
                setActiveCommandId(null);
                timerRef.current = null;
            }, 260);
        },
        [limit],
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    return { commandLog, activeCommandId, logCommand };
};
