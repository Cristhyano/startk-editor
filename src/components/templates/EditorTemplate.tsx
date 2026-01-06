import type { ReactNode } from "react";

type EditorTemplateProps = {
    actionBar: ReactNode;
    left: ReactNode;
    centerTop: ReactNode;
    centerMiddle: ReactNode;
    centerBottom: ReactNode;
    right: ReactNode;
    overlay: ReactNode;
    styles: ReactNode;
};

export const EditorTemplate = ({
    actionBar,
    left,
    centerTop,
    centerMiddle,
    centerBottom,
    right,
    overlay,
    styles,
}: EditorTemplateProps) => (
    <div className="h-screen flex flex-row bg-slate-950 text-slate-100 relative overflow-hidden">
        {actionBar}
        {styles}
        {left}
        <div className="flex-1 w-full flex flex-col min-h-0">
            {centerTop}
            {centerMiddle}
            {centerBottom}
        </div>
        {right}
        {overlay}
    </div>
);
