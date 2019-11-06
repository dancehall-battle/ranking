const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {filterLevel, filterParticipants, setRankings, filterDates, filterHomeAway}  = require('./utils');
const {differenceInMonths} = require('date-fns');
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
  query { ... on Dancer {
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
    }
  }`;

async function main(participants, startDate, stopDate, format, homeAway = 'both') {
  // Execute the query
  let dancers = (await client.query({ query })).data;
  //console.log(data);
  dancers = filterLevel(dancers);
  dancers = filterDates(dancers, startDate, stopDate);
  dancers = filterParticipants(dancers, participants);
  dancers = filterHomeAway(dancers, homeAway);
  dancers = dancers.filter(dancer => dancer.wins.length > 0);
  const countries = dancersToCountries(dancers);
  //console.log(dancers);
  const countryToPoints = getPoints(countries);
  const rankingArray = [];
  const keys = Object.keys(countryToPoints);

  keys.forEach(key => {
    rankingArray.push({'name': key, points: countryToPoints[key]});
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