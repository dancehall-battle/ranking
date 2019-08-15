const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {filterLevel, filterParticipants, setRankings, filterDates}  = require('./utils');
const {differenceInMonths} = require('date-fns');
const fs = require('fs-extra');
const path = require('path');

const points = fs.readJsonSync(path.resolve(__dirname, 'points.json'));

// Define a JSON-LD context
const context = {
  "@context": {
    "name":  { "@id": "http://schema.org/name" },
    "start":  { "@id": "http://schema.org/startDate" },
    "end":    { "@id": "http://schema.org/endDate" },
    "wins":    { "@reverse": "https://dancebattle.org/ontology/hasWinner" },
    "level":    { "@id": "https://dancebattle.org/ontology/level" },
    "participants":    { "@id": "https://dancebattle.org/ontology/amountOfParticipants" },
    "Dancer": { "@id": "https://dancebattle.org/ontology/Dancer" }
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
  query { ... on Dancer {
    name @single
    wins {
      level @single
      start @single
      end @single
      participants @single
    }
    }
  }`;

async function main(participants, startDate, stopDate) {
  // Execute the query
  let dancers = await executeQuery(query);
  //console.log(data);
  dancers = filterLevel(dancers);
  dancers = filterDates(dancers, startDate, stopDate);
  dancers = filterParticipants(dancers, participants);
  dancers = dancers.filter(dancer => dancer.wins.length > 0);
  //console.log(dancers);
  const dancerToPoints = getPoints(dancers);
  const rankingArray = [];
  const keys = Object.keys(dancerToPoints);

  keys.forEach(key => {
    rankingArray.push({name: key, points: dancerToPoints[key]});
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
  printAsCSV(rankingArray);
}

async function executeQuery(query){
  const {data} = await client.query({ query });

  return data;
}

function getPoints(dancers) {
  const dancerToPoints = {};

  dancers.forEach(dancer => {
    dancer.wins.forEach(win => {
      const diff = differenceInMonths(new Date(), new Date(win.end)) + 1;
      //console.log(diff);

      const pointsGained = points[diff];

      if (!dancerToPoints[dancer.name]) {
        dancerToPoints[dancer.name] = 0
      }

      dancerToPoints[dancer.name] += pointsGained / parseInt(win.participants);
    });
  });

  return dancerToPoints;
}

function printAsCSV(data) {
  console.log(`rank,dancer,points`);

  data.forEach(dancer => {
    console.log(`${dancer.rank},${dancer.name},${dancer.points}`);
  });
}

module.exports = main;