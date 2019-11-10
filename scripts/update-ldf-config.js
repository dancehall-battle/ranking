const fs = require('fs-extra');
const program = require('commander');
const path = require('path');
const pkg = require(path.resolve(__dirname, '../package.json'));
const { format } = require('date-fns');

program
  .version(pkg.version)
  .requiredOption('-c, --config <path>', 'Path to config file of ldf-server.')
  .requiredOption('-f, --file <path>', 'Path to JSON-LD file.')
  .requiredOption('-d, --datasource <string>', 'Name of data source in config file.')
  .parse(process.argv);

const ldfConfig = fs.readJsonSync(path.resolve(process.cwd(), program.config));
const today = '' + format(new Date(), 'yyyy-MM-dd');
ldfConfig.datasources[today] = {
  "type": "JsonLdDatasource",
  "settings": { "file": program.file }
};

const datasource = ldfConfig.datasources[program.datasource];
datasource.settings.references.push(today);

console.dir(ldfConfig, {depth: null});