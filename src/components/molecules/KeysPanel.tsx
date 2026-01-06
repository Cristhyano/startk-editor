import { KeyBadge } from "../atoms/KeyBadge";

type KeysPanelProps = {
    pressedKeys: string[];
};

export const KeysPanel = ({ pressedKeys }: KeysPanelProps) => (
    <div className="rounded-md border border-slate-800 bg-slate-900/80 p-2 text-[10px] text-slate-300">
        <div className="font-semibold text-slate-200">KEYS</div>
        <div className="mt-1 flex flex-wrap gap-1">
            {pressedKeys.length === 0 ? (
                <span className="text-slate-500">None</span>
            ) : (
                pressedKeys.map((key) => <KeyBadge key={key} keyLabel={key} />)
            )}
        </div>
    </div>
);
