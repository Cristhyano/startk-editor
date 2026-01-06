import {
    DownloadIcon,
    EyeOpenIcon,
    Pencil2Icon,
    ResetIcon,
    UploadIcon,
} from "@radix-ui/react-icons";
import { IconButton } from "../atoms/IconButton";
import { Cheatsheet } from "../molecules/Cheatsheet";
import { KeysPanel } from "../molecules/KeysPanel";

type ActionBarProps = {
    controlButtonClass: string;
    rightPreviewMode: boolean;
    pressedKeys: string[];
    onExport: () => void;
    onImportClick: () => void;
    onReset: () => void;
    onTogglePreview: () => void;
};

export const ActionBar = ({
    controlButtonClass,
    rightPreviewMode,
    pressedKeys,
    onExport,
    onImportClick,
    onReset,
    onTogglePreview,
}: ActionBarProps) => (
    <div className="absolute bottom-4 left-4 z-50 flex items-end gap-4">
        <div className="flex items-center gap-2">
            <IconButton className={controlButtonClass} title="Export" onClick={onExport}>
                <DownloadIcon />
            </IconButton>
            <IconButton className={controlButtonClass} title="Import" onClick={onImportClick}>
                <UploadIcon />
            </IconButton>
            <IconButton className={controlButtonClass} title="Reset" onClick={onReset}>
                <ResetIcon />
            </IconButton>
            <IconButton
                className={controlButtonClass}
                title={rightPreviewMode ? "Edit" : "Preview"}
                onClick={onTogglePreview}
            >
                {rightPreviewMode ? <Pencil2Icon /> : <EyeOpenIcon />}
            </IconButton>
        </div>
        <Cheatsheet />
        <KeysPanel pressedKeys={pressedKeys} />
    </div>
);
