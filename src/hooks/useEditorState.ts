import { useCallback, useEffect, useRef, useState } from "react";
import type { DefinitiveDoc, SavedState } from "../types/editor";

const createDefaultDefinitives = () => [
    { id: "def-1", title: "DEF 1", content: "" },
];

export const useEditorState = (storageKey: string) => {
    const emptyState: SavedState = {
        left: "",
        right: "",
        bottom: "",
        center: "",
    };
    const defaultDefinitives = createDefaultDefinitives();
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

    const [leftText, setLeftText] = useState(initialStateRef.current.left);
    const [bottomText, setBottomText] = useState(initialStateRef.current.bottom);
    const [centerText, setCenterText] = useState(initialStateRef.current.center);
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

    const getPayload = (): SavedState => ({
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
    }, [leftText, bottomText, centerText, definitives, activeDefinitiveIndex, storageKey]);

    const rightText = definitives[activeDefinitiveIndex]?.content ?? "";
    const setRightText = useCallback(
        (value: string) => {
            setDefinitives((prev) =>
                prev.map((doc, index) =>
                    index === activeDefinitiveIndex ? { ...doc, content: value } : doc,
                ),
            );
        },
        [activeDefinitiveIndex],
    );

    const addDefinitive = useCallback(() => {
        const title = `DEF ${definitiveCounterRef.current}`;
        definitiveCounterRef.current += 1;
        setDefinitives((prev) => {
            const next = [...prev, { id: `def-${title}`, title, content: "" }];
            setActiveDefinitiveIndex(prev.length);
            return next;
        });
    }, []);

    const removeDefinitive = useCallback((confirmFn: (doc: DefinitiveDoc) => boolean) => {
        if (definitives.length <= 1) {
            return;
        }
        const current = definitives[activeDefinitiveIndex];
        if (!current || !confirmFn(current)) {
            return;
        }
        setDefinitives((prev) => prev.filter((_, index) => index !== activeDefinitiveIndex));
        setActiveDefinitiveIndex((prev) => Math.max(0, prev - 1));
    }, [activeDefinitiveIndex, definitives]);

    const renameDefinitive = useCallback((index: number, title: string) => {
        setDefinitives((prev) =>
            prev.map((doc, docIndex) => (docIndex === index ? { ...doc, title } : doc)),
        );
    }, []);

    const switchDefinitive = useCallback(
        (direction: number) => {
            setActiveDefinitiveIndex((prev) => {
                const count = definitives.length;
                if (count === 0) {
                    return 0;
                }
                return (prev + direction + count) % count;
            });
        },
        [definitives.length],
    );

    return {
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
    };
};
