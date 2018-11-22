function round(input, decimalPlaces) {
  return +(+input.toFixed(decimalPlaces));
}

function toArray(input) {
  return input instanceof Array
    ? input
    : input !== undefined && input !== null
    ? [input]
    : [];
}

function formatNumber(input, delimiter = ",", decimal = ".") {
  const useInput = String(input).split(".");
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

const S = 1000;
const M = 60 * S;
const H = 60 * M;
const D = 24 * H;
const W = 7 * D;
const MO = 30 * D;
const Y = 365 * D;

const DEFAULT_FORMAT_TIME_DURATION_OPTIONS = {
  spacer: " ",
  decimal: ".",
  decimalPlaces: 2,
  durations: {
    ms: {
      min: 0,
      max: S,
      label: "ms"
    },
    s: {
      min: S,
      max: M,
      label: "s"
    },
    m: {
      min: M,
      max: H,
      label: "m"
    },
    h: {
      min: H,
      max: D,
      label: "h"
    },
    d: {
      min: D,
      max: W,
      label: "d"
    },
    w: {
      min: W,
      max: MO,
      label: "w"
    },
    mo: {
      min: MO,
      max: Y,
      label: "mo"
    },
    y: {
      min: Y,
      max: Infinity,
      label: "y"
    }
  }
};

function getTimeFromDate(input) {
  return input instanceof Date ? input.getTime() : +input;
}

function formatTimeDuration(input, options) {
  const _options = { ...DEFAULT_FORMAT_TIME_DURATION_OPTIONS, ...options };
  const _input = getTimeFromDate(input);
  const totalDurations = Object.values(_options.durations).length;
  let output = "";
  let countDurations = 0;
  if (_input > 0) {
    for (let durationName in _options.durations) {
      if (_options.durations.hasOwnProperty(durationName)) {
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

function tellTime(...times) {
  const useTimes = times.map(getTimeFromDate);
  const useEndTime = Math.max(...useTimes);
  const useStartTime = Math.min(...useTimes);
  return formatTimeDuration(useEndTime - useStartTime);
}

function filterUnique(input) {
  const output = [];
  toArray(input).forEach(item =>
    output.indexOf(item) === -1 ? output.push(item) : undefined
  );
  return output;
}

module.exports = {
  round,
  toArray,
  formatNumber,
  formatTimeDuration,
  getTimeFromDate,
  tellTime,
  filterUnique
};
