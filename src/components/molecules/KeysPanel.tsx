import { KeyBadge } from "../atoms/KeyBadge";

type KeysPanelProps = {
    pressedKeys: string[];
};

export const KeysPanel = ({ pressedKeys }: KeysPanelProps) => (
    <div className="rounded-md border border-gray-700 bg-gray-800 p-2 text-[10px] text-gray-300">
        <div className="font-semibold text-gray-100">KEYS</div>
        <div className="mt-1 flex flex-wrap gap-1">
            {pressedKeys.length === 0 ? (
                <span className="text-gray-500">None</span>
            ) : (
                pressedKeys.map((key) => <KeyBadge key={key} keyLabel={key} />)
            )}
        </div>
    </div>
);
