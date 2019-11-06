const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {filterLevel, filterParticipants, setRankings, filterDates, toJSONLD, filterHomeAway}  = require('./utils');
const {differenceInMonths} = require('date-fns');
const formatDate = require('date-fns').format;
const fs = require('fs-extra');
const path = require('path');

const points = fs.readJsonSync(path.resolve(__dirname, 'points.json'));

// Define a JSON-LD context
const context = {
  "@context": {
    "schema": "http://schema.org/",
    "dhb": "https://dancebattle.org/ontology/",
    "name":  "schema:name" ,
    "start":  "schema:startDate",
    "end":    "schema:endDate",
    "location":    "schema:location",
    "wins":    { "@reverse": "dhb:hasWinner" },
    "atEvent":    { "@reverse": "dhb:hasBattle" },
    "country": "dhb:representsCountry",
    "level":    "dhb:level" ,
    "participants":    "dhb:amountOfParticipants" ,
    "Dancer": "dhb:Dancer"
  }
};

// Create a GraphQL-LD client based on a client-side Comunica engine
const comunicaConfig = {
  sources: [
    { type: "hypermedia", value: "https://data.dancehallbattle.org/data" },
  ],
};
const client = new Client({ context, queryEngine: new QueryEngineComunica(comunicaConfig) });

// Define a query
const query = `
  query { 
    id @single
    name @single
    country @single
    wins {
      level @single
      start @single
      end @single
      participants @single
      atEvent @single {
        location @single
      }
    }
  }`;

async function main(participants, startDate, stopDate, format = 'csv', homeAway = 'both') {
  // Execute the query
  let dancers = (await client.query({ query })).data;
  dancers = filterLevel(dancers);
  dancers = filterDates(dancers, startDate, stopDate);
  dancers = filterParticipants(dancers, participants);
  dancers = filterHomeAway(dancers, homeAway);
  dancers = dancers.filter(dancer => dancer.wins.length > 0);
  //console.dir(dancers, {depth: null});
  const dancerToPoints = getPoints(dancers);
  const rankingArray = [];
  const keys = Object.keys(dancerToPoints);

  keys.forEach(key => {
    rankingArray.push({'dancer': key, points: dancerToPoints[key]});
  });

  rankingArray.sort((a, b) => {
    if (a.points < b.points) {
      return 1;
    } else if (a.points > b.points) {
      return -1;
    } else {
      return 0;
    }
  });

  setRankings(rankingArray);

  if (format === 'jsonld') {
    //console.dir(toJSONLD(rankingArray), {depth: null});
    console.log(JSON.stringify(toJSONLD(rankingArray, `https://dancehallbattle.org/ranking/dancer/${participants.join('-')}/` + formatDate(new Date(), 'yyyy-MM-dd'), homeAway)));
  } else if (format === 'csv') {
    printAsCSV(rankingArray, dancers);
  } else {
    throw new Error('Invalid output format: ' + format);
  }
}

function getNameFromID(dancers, id) {
  let i = 0;

  while (i < dancers.length && dancers[i].id !== id) {
    i ++;
  }

  if (i < dancers.length) {
    return dancers[i].name;
  } else {
    return null;
  }
}

function getPoints(dancers) {
  const dancerToPoints = {};

  dancers.forEach(dancer => {
    dancer.wins.forEach(win => {
      const diff = differenceInMonths(new Date(), new Date(win.end)) + 1;
      //console.log(diff);

      const pointsGained = points[diff];

      if (!dancerToPoints[dancer.id]) {
        dancerToPoints[dancer.id] = 0
      }

      dancerToPoints[dancer.id] += pointsGained / parseInt(win.participants);
    });
  });

  return dancerToPoints;
}

function printAsCSV(data, dancers) {
  console.log(`rank,dancer,points`);

  data.forEach(dancer => {
    console.log(`${dancer.rank},${getNameFromID(dancers, dancer.dancer)},${dancer.points}`);
  });
}

module.exports = main;