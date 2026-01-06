import type { DefinitiveDoc } from "../../types/editor";

type DefinitiveTabsProps = {
    definitives: DefinitiveDoc[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onAdd: () => void;
};

export const DefinitiveTabs = ({
    definitives,
    activeIndex,
    onSelect,
    onAdd,
}: DefinitiveTabsProps) => (
    <div className="flex items-center gap-2">
        {definitives.map((doc, index) => (
            <button
                key={doc.id}
                className={`relative rounded-md border px-2 py-1 text-[10px] tracking-[0.2em] transition-colors duration-200 ${
                    index === activeIndex
                        ? "border-slate-500 bg-slate-800 text-slate-100"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
                type="button"
                onClick={() => onSelect(index)}
                title={`DEF ${index + 1}`}
            >
                {doc.title}
                {doc.content.trim().length > 0 ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500"></span>
                ) : null}
            </button>
        ))}
        <button
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400 transition-colors duration-200 hover:text-slate-200"
            type="button"
            onClick={onAdd}
            title="Novo definitivo"
        >
            +
        </button>
    </div>
);
