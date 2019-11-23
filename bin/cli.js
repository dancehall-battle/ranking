#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const {DancerRanker, CountryRanker} = require('..');
const pkg = require(path.resolve(__dirname, '../package.json'));
const {format} = require('date-fns');

const today = new Date();
const oneYearAgo = new Date();
oneYearAgo.setFullYear(today.getFullYear() - 1);

program
  .version(pkg.version)
  .option('-p, --participants [number]', 'Select battle with a given number of participants (comma-separated).', parseParticipants, '1,2')
  .option('-r, --ranking [rank]', 'Select for what to receive the ranking: dancer or country.', parseRanking, 'dancer')
  .option('-s, --start-date [date]', `Start date of the range of battles to consider.`, parseDate, oneYearAgo)
  .option('-t, --end-date [date]', 'End date of the range of battles to consider.', parseDate, today)
  .option('-j, --json-ld', 'Output the ranking as JSON-LD.')
  .option('-d, --rdf', 'Output the ranking as RDF (N-Triples).')
  .option('-h, --only-home', 'Only consider home battles.')
  .option('-a, --only-away', 'Only consider away battles.')
  .option('-f, --no-female-battles', 'Remove female battles.')
  .option('-c, --scale', 'Scale away ranking.')
  .option('-v, --verbose', 'Make the tool more talkative.')
  .parse(process.argv);

program.participants = program.participants.split(',');

if (program.onlyHome && program.onlyAway) {
  console.error('The options "only home" and "only away" cannot be used at the same time.');
  process.exit(1);
}

let outputFormat = 'csv';
let removeFemaleBattles = !program.femaleBattles;

if (program.jsonLd) {
  outputFormat = 'jsonld';
} else if (program.rdf) {
  outputFormat = 'ntriples';
}

let homeAway = 'both';

if (program.onlyHome) {
  homeAway = 'home';
} else if (program.onlyAway) {
  homeAway = 'away';
}

if (program.verbose) {
  console.error('Ranking: ' + program.ranking);
  console.error('Participants: ' + program.participants);
  console.error('Start date: ' + format(program.startDate, 'yyyy-MM-dd'));
  console.error('End date: ' + format(program.endDate, 'yyyy-MM-dd'));
  console.error('Home/away: ' + homeAway);
  console.error('Scale away ranking: ' + program.scale);
  console.error('Output format: ' + outputFormat);
  console.error('Remove female battles: ' + removeFemaleBattles);

  console.error();
}

main();

async function main() {
  let ranker;

  if (program.ranking === 'dancer') {
    ranker = new DancerRanker();
  } else {
    ranker = new CountryRanker();
  }

  const result = await ranker.getRanking({
    participants: program.participants,
    startDate: program.startDate,
    endDate: program.endDate,
    format: outputFormat,
    homeAway,
    removeFemaleBattles,
    scale: program.scale
  });

  if (outputFormat === 'csv' || outputFormat === 'ntriples') {
    console.log(result);
  } else if (outputFormat === 'jsonld') {
    console.log(JSON.stringify(result));
  }
}


/**
 * Helper functions
 */

function parseParticipants(participants) {
  if (participants) {
    const temp = participants.split(',');

    temp.forEach(p => {
      if (isNaN(parseInt(p))) {
        console.error(`${p} is not a number.`);
        process.exit(1);
      }
    });

    return participants;
  } else {
    return null;
  }
}

function parseRanking(ranking) {
  if (ranking) {
    if (ranking === 'dancer' || ranking === 'country') {
      return ranking;
    } else {
      console.error(`Ranking has to be either "dancer" or "country".`);
      process.exit(1);
    }
  } else {
    return null;
  }
}

function parseDate(date) {
  if (date) {
    date = new Date(date);

    if (isNaN(date.getTime())){
      console.error('Please provide valid dates.');
      process.exit(1);
    } else {
      return date;
    }
  } else {
    return null;
  }
}