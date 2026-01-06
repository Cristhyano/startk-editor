type KeyBadgeProps = {
    keyLabel: string;
};

export const KeyBadge = ({ keyLabel }: KeyBadgeProps) => (
    <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-200">
        {keyLabel}
    </span>
);
