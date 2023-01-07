import * as Benchmark from "benchmark";
import { Subject } from "rxjs";
import * as utils from "./utils";
export type StartTime = utils.DateOrTime;
export type EndTime = utils.DateOrTime | null | undefined;
export type Output = Subject<string | number>;
export interface Results {
    stats: Benchmark.Stats | object;
    times: Benchmark.Times | object;
    speed: number;
}
export interface Bench {
    key: string;
    name: string;
    path: string;
    relativePath: string;
    startTime: StartTime;
    endTime: EndTime;
    progress: number;
    completed: boolean;
    errored: boolean;
    error: Error | unknown;
    suites: Suites;
    results: Results;
    output: Output;
}
export interface Stack {
    [path: string]: Bench;
}
export interface SuiteOptions {
    skip?: boolean;
}
export interface Suite {
    key: string;
    index: number;
    instance: Benchmark.Suite;
    name: string;
    bench: Bench;
    startTime: StartTime;
    endTime: EndTime;
    progress: number;
    skipped: boolean;
    completed: boolean;
    errored: boolean;
    errors: Error[];
    tests: Tests;
    results: Results;
    fn: () => void;
}
export interface Suites {
    [key: string]: Suite;
}
export interface Test {
    key: string;
    index: number;
    name: string;
    instance: Benchmark;
    suite: Suite;
    startTime: StartTime;
    endTime: EndTime;
    skipped: boolean;
    completed: boolean;
    errored: boolean;
    error: Error | unknown;
    results: Results;
}
export interface TestOptions {
    skip?: boolean;
}
export interface Tests {
    [key: string]: Test;
}
export type Runner = (benchPath: string, stack: Stack, barbellConfig: Config) => Output;
export type Reporter = (stack: Stack, barbellConfig: Config) => string | void;
export type Module = Runner | Reporter;
export interface ConfigOptions {
    rootDir?: string;
    configPath?: string;
    testMatch?: string[];
    exclude?: string[];
    concurrent?: number;
    stopOnErrors?: boolean;
    verbose?: boolean;
    debug?: boolean;
    runner?: string | Runner;
    reporter?: string | Reporter;
    reporterConfig?: any;
}
export interface Config extends Omit<Required<ConfigOptions>, "reporterConfig"> {
    runner: Runner;
    reporter: Reporter;
    reporterConfig?: any;
}
export declare const DEFAULT_TEST_MATCH: string[];
export declare const DEFAULT_CONFIG: Readonly<{
    rootDir: string;
    configPath: undefined;
    testMatch: string[];
    exclude: string[];
    concurrent: 2;
    stopOnErrors: false;
    verbose: false;
    runner: "barbell-runner";
    reporter: "barbell-reporter";
}>;
declare function barbell(testMatch: string[], options: ConfigOptions): Promise<void>;
export default barbell;
