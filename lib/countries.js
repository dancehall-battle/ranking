const {setRankings, countriesToJSONLD, getDancers}  = require('./utils');
const {differenceInMonths} = require('date-fns');
const formatDate = require('date-fns').format;
const fs = require('fs-extra');
const path = require('path');

const points = fs.readJsonSync(path.resolve(__dirname, 'points.json'));

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
  const dancers = await getDancers(query, startDate, stopDate, participants, homeAway);
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

  if (format === 'jsonld') {
    //console.dir(toJSONLD(rankingArray), {depth: null});
    console.log(JSON.stringify(countriesToJSONLD(rankingArray, `https://dancehallbattle.org/ranking/country/${participants.join('-')}/${homeAway}/` + formatDate(new Date(), 'yyyy-MM-dd'), homeAway)));
  } else if (format === 'csv') {
    printAsCSV(rankingArray);
  } else {
    throw new Error('Invalid output format: ' + format);
  }
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