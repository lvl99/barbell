"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterUnique = exports.tellTime = exports.formatTimeDuration = exports.getTimeFromDate = exports.formatNumber = exports.useFirstNonEmptyArray = exports.useFirstDefined = exports.useFirstValid = exports.toArray = exports.round = exports.DEFAULT_FORMAT_TIME_DURATION_OPTIONS = void 0;
var tslib_1 = require("tslib");
var S = 1000;
var M = 60 * S;
var H = 60 * M;
var D = 24 * H;
var W = 7 * D;
var MO = 30 * D;
var Y = 365 * D;
exports.DEFAULT_FORMAT_TIME_DURATION_OPTIONS = {
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
function round(input, decimalPlaces) {
    if (decimalPlaces === void 0) { decimalPlaces = 2; }
    return +(+input.toFixed(decimalPlaces));
}
exports.round = round;
function toArray(input) {
    return input instanceof Array
        ? input
        : input !== undefined && input !== null
            ? [input]
            : [];
}
exports.toArray = toArray;
function useFirstValid(validate) {
    var input = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        input[_i - 1] = arguments[_i];
    }
    var output = typeof validate === "function"
        ? input.find(function (x) { return validate(x); })
        : input !== undefined;
    return output ? output : input.pop();
}
exports.useFirstValid = useFirstValid;
function useFirstDefined() {
    var input = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        input[_i] = arguments[_i];
    }
    return useFirstValid.apply(void 0, tslib_1.__spreadArray([function (x) { return x !== undefined; }], input.filter(function (x) { return x !== undefined; }), false));
}
exports.useFirstDefined = useFirstDefined;
function useFirstNonEmptyArray() {
    var input = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        input[_i] = arguments[_i];
    }
    return useFirstValid.apply(void 0, tslib_1.__spreadArray([function (x) { return x.length; }], input.filter(function (x) { return x !== undefined; }), false));
}
exports.useFirstNonEmptyArray = useFirstNonEmptyArray;
function formatNumber(input, delimiter, decimal) {
    if (delimiter === void 0) { delimiter = ","; }
    if (decimal === void 0) { decimal = "."; }
    var useInput = "".concat(input).split(".");
    return (useInput[0]
        .split("")
        .reverse()
        .reduce(function (acc, number, index) {
        return "".concat(acc).concat(index % 3 === 0 ? delimiter : "").concat(number);
    })
        .split("")
        .reverse()
        .join("") + (useInput[1] !== undefined ? "".concat(decimal).concat(useInput[1]) : ""));
}
exports.formatNumber = formatNumber;
function getTimeFromDate(input) {
    return input instanceof Date ? input.getTime() : +(input || 0);
}
exports.getTimeFromDate = getTimeFromDate;
function formatTimeDuration(input, options) {
    var _options = tslib_1.__assign(tslib_1.__assign({}, exports.DEFAULT_FORMAT_TIME_DURATION_OPTIONS), options);
    var _input = getTimeFromDate(input);
    var totalDurations = Object.values(_options.durations).length;
    var output = "";
    var countDurations = 0;
    if (_input > 0) {
        for (var durationName in _options.durations) {
            if (_options.durations[durationName]) {
                var duration = _options.durations[durationName];
                countDurations++;
                if ((_input >= duration.min && _input < duration.max) ||
                    countDurations === totalDurations) {
                    output = "".concat(String(duration.min > 0
                        ? round(_input / duration.min, _options.decimalPlaces)
                        : _input).replace(".", _options.decimal)).concat(_options.spacer).concat(duration.label);
                    break;
                }
            }
        }
        return output;
    }
    else {
        return "0".concat(_options.spacer).concat(Object.values(_options.durations)[0].label);
    }
}
exports.formatTimeDuration = formatTimeDuration;
function tellTime() {
    var times = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        times[_i] = arguments[_i];
    }
    var useTimes = times.map(getTimeFromDate);
    var useEndTime = Math.max.apply(Math, useTimes);
    var useStartTime = Math.min.apply(Math, useTimes);
    return formatTimeDuration(useEndTime - useStartTime);
}
exports.tellTime = tellTime;
function filterUnique(input) {
    var output = [];
    toArray(input).forEach(function (item) {
        return output.indexOf(item) === -1 ? output.push(item) : undefined;
    });
    return output;
}
exports.filterUnique = filterUnique;
//# sourceMappingURL=utils.js.map