#!/usr/bin/env node

const program = require('commander');
const rankDancers = require('../lib/dancers');
const rankCountries = require('../lib/countries');

program
//  .version('0.1.0')
  .option('-p, --participants [number]', 'Select battle with a given number of participants (default: 1,2).', parseParticipants)
  .option('-r, --ranking [rank]', 'Select for what to receive the ranking: dancer or country (default: dancer).', parseRanking)
  .parse(process.argv);


program.participants = program.participants || ['1', '2'];
program.ranking = program.ranking || 'dancer';

if (program.ranking === 'dancer') {
  rankDancers(program.participants);
} else {
  rankCountries(program.participants);
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