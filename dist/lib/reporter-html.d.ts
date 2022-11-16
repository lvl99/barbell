import { Reporter } from "./barbell";
export interface ReporterHTMLConfig {
    outputFormat?: string;
    outputDir?: string;
    outputFileName?: string;
}
export declare const reporter: Reporter;
export default reporter;
