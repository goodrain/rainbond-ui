/// <reference types="react" />
import * as React from 'react';
import { Terminal } from 'xterm';
export interface IXtermProps extends React.DOMAttributes<{}> {
    onChange?: (e) => void;
    onInput?: (e) => void;
    onFocusChange?: Function;
    addons?: string[];
    onScroll?: (e) => void;
    onContextMenu?: (e) => void;
    options?: any;
    path?: string;
    value?: string;
    className?: string;
    style?: React.CSSProperties;
}
export interface IXtermState {
    isFocused: boolean;
}
export default class XTerm extends React.Component<IXtermProps, IXtermState> {
    xterm: Terminal;
    refs: {
        [string: string]: any;
        container: HTMLDivElement;
    };
    constructor(props?: IXtermProps, context?: any);
    applyAddon(addon: any): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    getTerminal(): Terminal;
    write(data: any): void;
    writeln(data: any): void;
    focus(): void;
    focusChanged(focused: any): void;
    onInput: (data: any) => void;
    resize(cols: number, rows: number): void;
    setOption(key: string, value: boolean): void;
    refresh(): void;
    onContextMenu(e: any): void;
    render(): JSX.Element;
}
export { Terminal, XTerm };
