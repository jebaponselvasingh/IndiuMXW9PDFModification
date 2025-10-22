/**
 * This file was generated from IndiuMXPDFEditor.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ListValue, ReferenceValue } from "mendix";

export interface IndiuMXPDFEditorContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    fileDocOptions?: ListValue;
    inputFile?: ReferenceValue;
    outputFile?: ReferenceValue;
}

export interface IndiuMXPDFEditorPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    fileDocOptions: {} | { caption: string } | { type: string } | null;
    inputFile: string;
    outputFile: string;
}
