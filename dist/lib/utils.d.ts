export type DateOrTime = Date | number | null | undefined;
export interface FormatTimeDurationSegment {
    min: number;
    max: number;
    label: string;
}
export interface FormatTimeDurationOptions {
    spacer: string;
    decimal: string;
    decimalPlaces: number;
    durations: {
        [key: string]: FormatTimeDurationSegment;
        ms: FormatTimeDurationSegment;
        s: FormatTimeDurationSegment;
        m: FormatTimeDurationSegment;
        h: FormatTimeDurationSegment;
        d: FormatTimeDurationSegment;
        w: FormatTimeDurationSegment;
        mo: FormatTimeDurationSegment;
        y: FormatTimeDurationSegment;
    };
}
export declare const DEFAULT_FORMAT_TIME_DURATION_OPTIONS: FormatTimeDurationOptions;
export declare function round(input: number, decimalPlaces?: number): number;
export declare function toArray(input: any | any[]): any[];
export declare function useFirstNonEmptyArray(...input: any[]): any[];
export declare function formatNumber(input: any, delimiter?: string, decimal?: string): string;
export declare function getTimeFromDate(input: DateOrTime): number;
export declare function formatTimeDuration(input: DateOrTime, options?: Partial<FormatTimeDurationOptions>): string;
export declare function tellTime(...times: DateOrTime[]): string;
export declare function filterUnique(input: any[]): any[];
