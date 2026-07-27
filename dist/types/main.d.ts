type Orientation = 'horizontal' | 'vertical';
declare class BeforeAfter extends HTMLElement {
    #private;
    static observedAttributes: string[];
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, old: string | null, val: string | null): void;
    get value(): number;
    set value(v: number | string);
    get orientation(): Orientation;
    set orientation(v: string);
    get disabled(): boolean;
    set disabled(v: boolean);
    get step(): number;
}
declare global {
    interface HTMLElementTagNameMap {
        'before-after': BeforeAfter;
    }
}
export default BeforeAfter;
