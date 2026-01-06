import { useEffect, useState } from "react";

export const usePressedKeys = () => {
    const [pressedKeys, setPressedKeys] = useState<string[]>([]);

    useEffect(() => {
        const normalizeKey = (key: string) => {
            const map: Record<string, string> = {
                Control: "Ctrl",
                Alt: "Alt",
                Shift: "Shift",
                ArrowLeft: "Left",
                ArrowRight: "Right",
                ArrowUp: "Up",
                ArrowDown: "Down",
                Backspace: "Backspace",
                " ": "Space",
            };
            return map[key] ?? key.toUpperCase();
        };

        const getOrderedKeys = (set: Set<string>) => {
            const priority = ["Ctrl", "Alt", "Shift"];
            const rest = [...set].filter((value) => !priority.includes(value));
            return [...priority.filter((value) => set.has(value)), ...rest];
        };

        const pressed = new Set<string>();

        const syncKeys = () => {
            setPressedKeys(getOrderedKeys(pressed));
        };

        const handleDown = (event: KeyboardEvent) => {
            pressed.add(normalizeKey(event.key));
            syncKeys();
        };

        const handleUp = (event: KeyboardEvent) => {
            pressed.delete(normalizeKey(event.key));
            syncKeys();
        };

        const clearKeys = () => {
            pressed.clear();
            syncKeys();
        };

        window.addEventListener("keydown", handleDown);
        window.addEventListener("keyup", handleUp);
        window.addEventListener("blur", clearKeys);
        document.addEventListener("visibilitychange", clearKeys);
        return () => {
            window.removeEventListener("keydown", handleDown);
            window.removeEventListener("keyup", handleUp);
            window.removeEventListener("blur", clearKeys);
            document.removeEventListener("visibilitychange", clearKeys);
        };
    }, []);

    return pressedKeys;
};
