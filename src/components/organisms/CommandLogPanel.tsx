import type { CommandEntry } from "../../types/editor";

type CommandLogPanelProps = {
    className: string;
    commandLog: CommandEntry[];
    activeCommandId: number | null;
};

export const CommandLogPanel = ({
    className,
    commandLog,
    activeCommandId,
}: CommandLogPanelProps) => (
    <div className={className}>
        {commandLog.map((entry) => (
            <div
                key={entry.id}
                className={entry.id === activeCommandId ? "bg-gray-800 text-gray-100" : ""}
            >
                {entry.text}
            </div>
        ))}
    </div>
);
