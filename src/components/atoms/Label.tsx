type LabelProps = {
    text: string;
    className?: string;
};

export const Label = ({ text, className }: LabelProps) => (
    <div
        className={
            className ??
            "text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors duration-200"
        }
    >
        {text}
    </div>
);
