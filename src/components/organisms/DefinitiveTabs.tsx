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
                className={`relative rounded-md border px-2 py-1 text-[10px] tracking-[0.2em] transition-colors ${
                    index === activeIndex
                        ? "border-gray-500 bg-gray-700 text-gray-100"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
                type="button"
                onClick={() => onSelect(index)}
                title={`DEF ${index + 1}`}
            >
                {doc.title}
                {doc.content.trim().length > 0 ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gray-400"></span>
                ) : null}
            </button>
        ))}
        <button
            className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-[10px] text-gray-400 transition-colors hover:text-gray-200"
            type="button"
            onClick={onAdd}
            title="Novo definitivo"
        >
            +
        </button>
    </div>
);
