#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const rankDancers = require('../lib/dancers');
const rankCountries = require('../lib/countries');
const pkg = require(path.resolve(__dirname, '../package.json'));

const today = new Date();
const oneYearAgo = new Date();
oneYearAgo.setFullYear(today.getFullYear() - 1);

program
  .version(pkg.version)
  .option('-p, --participants [number]', 'Select battle with a given number of participants (default: 1,2).', parseParticipants, ['1','2'])
  .option('-r, --ranking [rank]', 'Select for what to receive the ranking: dancer or country (default: dancer).', parseRanking, 'dancer')
  .option('-s, --start-date [date]', 'Start date of the range of battles to consider.', parseDate, oneYearAgo)
  .option('-t, --end-date [date]', 'End date of the range of battles to consider.', parseDate, today)
  .parse(process.argv);

if (program.ranking === 'dancer') {
  rankDancers(program.participants, program.startDate, program.endDate);
} else {
  rankCountries(program.participants, program.startDate, program.endDate);
}

function parseParticipants(participants) {
  if (participants) {
    participants = participants.split(',');

    participants.forEach(p => {
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