export type DefinitiveDoc = {
    id: string;
    title: string;
    content: string;
};

export type SavedState = {
    left: string;
    right: string;
    bottom: string;
    center: string;
    definitives?: Array<Pick<DefinitiveDoc, "title" | "content">>;
    activeIndex?: number;
};

export type CommandEntry = {
    id: number;
    text: string;
};
