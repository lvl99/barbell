const S = 1000;
const M = 60 * S;
const H = 60 * M;
const D = 24 * H;
const W = 7 * D;
const MO = 30 * D;
const Y = 365 * D;

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

export const DEFAULT_FORMAT_TIME_DURATION_OPTIONS: FormatTimeDurationOptions = {
  spacer: " ",
  decimal: ".",
  decimalPlaces: 2,
  durations: {
    ms: {
      min: 0,
      max: S,
      label: "ms",
    },
    s: {
      min: S,
      max: M,
      label: "s",
    },
    m: {
      min: M,
      max: H,
      label: "m",
    },
    h: {
      min: H,
      max: D,
      label: "h",
    },
    d: {
      min: D,
      max: W,
      label: "d",
    },
    w: {
      min: W,
      max: MO,
      label: "w",
    },
    mo: {
      min: MO,
      max: Y,
      label: "mo",
    },
    y: {
      min: Y,
      max: Infinity,
      label: "y",
    },
  },
};

export function round(input: number, decimalPlaces: number = 2): number {
  return +(+input.toFixed(decimalPlaces));
}

export function toArray(input: any | any[]): any[] {
  return input instanceof Array
    ? input
    : input !== undefined && input !== null
    ? [input]
    : [];
}

export function useFirstValid(
  validate: (input: any) => boolean,
  ...input: any[]
): any {
  const output =
    typeof validate === "function"
      ? input.find((x) => validate(x))
      : input !== undefined;
  return output ? output : input.pop();
}

export function useFirstDefined(...input: any[]): any {
  return useFirstValid((x) => x !== undefined, ...input);
}

export function useFirstNonEmptyArray(...input: any[]): any[] {
  return useFirstValid((x) => x.length, ...input);
}

export function formatNumber(
  input: any,
  delimiter: string = ",",
  decimal: string = "."
): string {
  const useInput = `${input}`.split(".");
  return (
    useInput[0]
      .split("")
      .reverse()
      .reduce(
        (acc, number, index) =>
          `${acc}${index % 3 === 0 ? delimiter : ""}${number}`
      )
      .split("")
      .reverse()
      .join("") + (useInput[1] !== undefined ? `${decimal}${useInput[1]}` : "")
  );
}

export function getTimeFromDate(input: DateOrTime): number {
  return input instanceof Date ? input.getTime() : +(input || 0);
}

export function formatTimeDuration(
  input: DateOrTime,
  options?: Partial<FormatTimeDurationOptions>
): string {
  const _options = { ...DEFAULT_FORMAT_TIME_DURATION_OPTIONS, ...options };
  const _input = getTimeFromDate(input);
  const totalDurations = Object.values(_options.durations).length;
  let output = "";
  let countDurations = 0;
  if (_input > 0) {
    for (let durationName in _options.durations) {
      if (_options.durations[durationName]) {
        const duration = _options.durations[durationName];
        countDurations++;

        if (
          (_input >= duration.min && _input < duration.max) ||
          countDurations === totalDurations
        ) {
          output = `${String(
            duration.min > 0
              ? round(_input / duration.min, _options.decimalPlaces)
              : _input
          ).replace(".", _options.decimal)}${_options.spacer}${duration.label}`;
          break;
        }
      }
    }
    return output;
  } else {
    return `0${_options.spacer}${Object.values(_options.durations)[0].label}`;
  }
}

export function tellTime(...times: DateOrTime[]): string {
  const useTimes = times.map(getTimeFromDate);
  const useEndTime = Math.max(...useTimes);
  const useStartTime = Math.min(...useTimes);
  return formatTimeDuration(useEndTime - useStartTime);
}

export function filterUnique(input: any[]): any[] {
  const output: any[] = [];
  toArray(input).forEach((item) =>
    output.indexOf(item) === -1 ? output.push(item) : undefined
  );
  return output;
}
