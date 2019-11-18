const fs = require('fs-extra');
const program = require('commander');
const path = require('path');
const pkg = require(path.resolve(__dirname, '../package.json'));

program
  .version(pkg.version)
  .requiredOption('-c, --config <path>', 'Path to config file of ldf-server.')
  .requiredOption('-f, --file <path>', 'Path to JSON-LD file.')
  .requiredOption('-d, --datasource <string>', 'Name of data source in config file.')
  .requiredOption('-t, --title <string>', 'Name of data source in config file.')
  .parse(process.argv);

const ldfConfig = fs.readJsonSync(path.resolve(process.cwd(), program.config));
ldfConfig.datasources[program.title] = {
  type: "JsonLdDatasource",
  hide: true,
  settings: { "file": program.file }
};

const datasource = ldfConfig.datasources[program.datasource];
datasource.settings.references.push(program.title);

console.log(JSON.stringify(ldfConfig));