import { Reporter } from "./barbell";
export interface ReporterHTMLConfig {
    outputFormat?: string;
    outputDir?: string;
    outputFileName?: string;
}
export declare const reporterHTML: Reporter;
export default reporterHTML;
