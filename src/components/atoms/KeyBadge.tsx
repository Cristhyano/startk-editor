type KeyBadgeProps = {
    keyLabel: string;
};

export const KeyBadge = ({ keyLabel }: KeyBadgeProps) => (
    <span className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[10px] text-gray-100">
        {keyLabel}
    </span>
);
