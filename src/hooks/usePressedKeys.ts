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

        const handleDown = (event: KeyboardEvent) => {
            pressed.add(normalizeKey(event.key));
            setPressedKeys(getOrderedKeys(pressed));
        };

        const handleUp = (event: KeyboardEvent) => {
            pressed.delete(normalizeKey(event.key));
            setPressedKeys(getOrderedKeys(pressed));
        };

        window.addEventListener("keydown", handleDown);
        window.addEventListener("keyup", handleUp);
        return () => {
            window.removeEventListener("keydown", handleDown);
            window.removeEventListener("keyup", handleUp);
        };
    }, []);

    return pressedKeys;
};
