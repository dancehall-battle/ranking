const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {filterLevel, filterParticipants, setRankings, filterDates}  = require('./utils');
const {differenceInMonths} = require('date-fns');

// Define a JSON-LD context
const context = {
  "@context": {
    "name":  { "@id": "http://schema.org/name" },
    "start":  { "@id": "http://schema.org/startDate" },
    "end":    { "@id": "http://schema.org/endDate" },
    "wins":    { "@reverse": "https://dancebattle.org/ontology/hasWinner" },
    "level":    { "@id": "https://dancebattle.org/ontology/level" },
    "participants":    { "@id": "https://dancebattle.org/ontology/amountOfParticipants" },
    "country":    { "@id": "https://dancebattle.org/ontology/representsCountry" },
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
    country @single
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


//main([1, 2]);

async function main(participants, startDate, stopDate) {
  // Execute the query
  let dancers = await executeQuery(query);
  //console.log(data);
  dancers = filterLevel(dancers);
  dancers = filterDates(dancers, startDate, stopDate);
  dancers = filterParticipants(dancers, participants);
  dancers = dancers.filter(dancer => dancer.wins.length > 0);
  const countries = dancersToCountries(dancers);
  //console.log(dancers);
  const countryToPoints = getPoints(countries);
  const rankingArray = [];
  const keys = Object.keys(countryToPoints);

  keys.forEach(key => {
    rankingArray.push({name: key, points: countryToPoints[key]});
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

function getPoints(countries) {
  const codes = Object.keys(countries);
  const countryToPoints = {};

  codes.forEach(code => {
    countries[code].forEach(win => {
      const diff = differenceInMonths(new Date(), new Date(win.end)) + 1;
      //console.log(diff);

      const pointsGained = points[diff];

      if (!countryToPoints[code]) {
        countryToPoints[code] = 0
      }

      countryToPoints[code] += pointsGained / parseInt(win.participants);
    });
  });

  return countryToPoints;
}

function dancersToCountries(dancers) {
  const countries = {};

  dancers.forEach(dancer => {
    if (dancer.country !== '') {
      if (!countries[dancer.country]) {
        countries[dancer.country] = [];
      }

      countries[dancer.country] = countries[dancer.country].concat(dancer.wins);
    }
  });

  return countries;
}

function printAsCSV(data) {
  console.log(`rank,country,points`);

  data.forEach(country => {
    console.log(`${country.rank},${country.name},${country.points}`);
  });
}

module.exports = main;