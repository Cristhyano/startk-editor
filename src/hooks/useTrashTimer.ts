import { useCallback, useEffect, useRef, useState } from "react";

export const useTrashTimer = (durationMs: number, onExpire: () => void) => {
    const [trashCycle, setTrashCycle] = useState(0);
    const [trashActive, setTrashActive] = useState(false);
    const timerRef = useRef<number | null>(null);

    const startTrashTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
        setTrashActive(true);
        setTrashCycle((prev) => prev + 1);
        timerRef.current = window.setTimeout(() => {
            onExpire();
            setTrashActive(false);
            timerRef.current = null;
        }, durationMs);
    }, [durationMs, onExpire]);

    const clearTrashTimer = useCallback(() => {
        if (!timerRef.current) {
            return;
        }
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setTrashActive(false);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    return { trashActive, trashCycle, startTrashTimer, clearTrashTimer };
};
