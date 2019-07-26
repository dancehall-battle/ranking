#!/usr/bin/env node

const program = require('commander');
const rank = require('../lib/dancers');

program
//  .version('0.1.0')
  .option('-p, --participants [number]', 'Select battle with a given number of participants (default: 1,2).', parseParticipants)
  .parse(process.argv);


program.participants = program.participants || ['1', '2'];

rank(program.participants);

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