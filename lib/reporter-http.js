const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
// const chalk = require("chalk");
const reporterHtml = require("./reporter-html");

const httpServerExecPath = path.join(
  __dirname,
  "../node_modules/.bin/http-server"
);

function barbellReporter(stack, barbellConfig) {
  const reporterHttpConfig = {
    port: 8080,
    ...barbellConfig.reporterHttp
  };
  const reporterHtmlConfig = {
    outputFormat: "file",
    outputDir: path.join(barbellConfig.rootDir, "./coverage/barbell"),
    outputFileName: "index.html"
  };
  const outputPath = path.join(
    reporterHtmlConfig.outputDir,
    reporterHtmlConfig.outputFileName
  );
  reporterHtml(stack, {
    ...barbellConfig,
    reporterHtml: reporterHtmlConfig
  });

  console.log(`\n  🛠  Serving results via http-server:`);
  console.log(`      - http://localhost:${reporterHttpConfig.port}`);
  console.log(`      - Press Ctrl + C to stop\n`);

  async function serveResults() {
    const server = await exec(
      `${httpServerExecPath} ${path.dirname(outputPath)} -p ${
        reporterHttpConfig.port
      } -o`,
      (err, stdout, stderr) => {
        if (err) {
          throw err;
        }
        // if (stderr) {
        //   console.log(chalk.red(stderr));
        // }
        // if (stdout) {
        //   console.log(stdout);
        // }
      }
    );
  }

  return serveResults();
}

module.exports = barbellReporter;
