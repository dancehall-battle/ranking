const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {filterLevel}  = require('./lib/utils');
const {format, differenceInMonths, isAfter, isBefore, subMonths} = require('date-fns');

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

// Points per month
const points = {
  1: 18,
  2: 17,
  3: 16,
  4: 13,
  5: 12,
  6: 11,
  7: 8,
  8: 7,
  9: 6,
  10: 3,
  11: 2,
  12: 1
};


main();

async function main() {
  // Execute the query
  let dancers = await executeQuery(query);
  //console.log(data);
  dancers = filterLevel(dancers);
  dancers = filterDates(dancers, new Date('2018-07-25'), new Date('2019-07-25'));
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

function setRankings(rankingArray) {
  let currentRank = 1;
  let latestPoints = null;
  let ties = 0;

  rankingArray.forEach(dtp => {
    if (!latestPoints) {
      dtp.rank = currentRank;
      latestPoints = dtp.points;
    } else if (latestPoints === dtp.points) {
      dtp.rank = currentRank;
      ties ++;
    } else {
      currentRank += + ties + 1;
      ties = 0;
      dtp.rank = currentRank;
      latestPoints = dtp.points;
    }
  });
}

function filterDates(dancers, startDate, endDate) {
  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => (new Date(battle.start)) >= startDate && (new Date(battle.end)) <= endDate);
  });

  return dancers;
}

function printAsCSV(data) {
  console.log(`rank,dancer,points`);

  data.forEach(dancer => {
    console.log(`${dancer.rank},${dancer.name},${dancer.points}`);
  });
}