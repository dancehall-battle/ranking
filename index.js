const http = require('follow-redirects').https;
const csvParse = require('csv-parse');
const {format, differenceInMonths, isAfter, isBefore, subMonths} = require('date-fns');

function calculateRanking() {
  return new Promise((resolve, reject) => {

    http.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vSxY8ZiZPUWEBp-vt26DfLDio4aZp4-7l8x24BbwtOUxeloe9411giVTP5UmMvg60tvZWHQ8J5FP31V/pub?gid=0&single=true&output=csv',
      (res) => {
        const {statusCode} = res;

        if (statusCode === 200) {
          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', async () => {
            csvParse(rawData, {
              comment: '#',
              columns: true

            }, (err, output) => {
              if (err) {
                reject(err);
              } else {
                getRankings(output);
              }
            });
          });
        } else {
          console.error(statusCode);
          console.error('CSV file could not be downloaded. Quiting.');
          // consume response data to free up memory
          res.resume();
          process.exit(1);
        }
      }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      process.exit(1);
    });
  });
}

function getRankings(csv) {
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

  let dancers = {};
  let countries = {};

  const stopDate = new Date('2019-05-01');
  const startDate = subMonths(stopDate, 12);

  csv.forEach(battle => {
    const date = new Date(battle.date);

    if (isBefore(date, stopDate) && isAfter(date, startDate) && battle.winner !== '' && (battle.who.indexOf('all') !== -1 || battle.who.indexOf('pro') !== -1 )) {
      console.log(date);
      console.log(stopDate);
      console.log(differenceInMonths(stopDate, date) + 1);
      const pointsGained = points[differenceInMonths(stopDate, date) + 1];
      const winner = battle.winner + ` (${battle.winner_country})`;

      if (!dancers[winner]) {
        dancers[winner] = 0;
      }

      if (battle.winner2 !== '') {
        const winner2 = battle.winner2 + ` (${battle.winner2_country})`;
        dancers[winner] += pointsGained / 2;

        if (!dancers[winner2]) {
          dancers[winner2] = 0;
        }

        dancers[winner2] += pointsGained / 2;
      } else {
        dancers[winner] += pointsGained;
      }

      if (battle.winner_country !== '') {
        if (!countries[battle.winner_country]) {
          countries[battle.winner_country] = 0;
        }

        if (battle.winner2 !== '') {
          countries[battle.winner_country] += pointsGained / 2;
        } else {
          countries[battle.winner_country] += pointsGained;
        }
      }

      if (battle.winner2_country !== '') {
        if (!countries[battle.winner2_country]) {
          countries[battle.winner2_country] = 0;
        }

        countries[battle.winner2_country] += pointsGained / 2;
      }
    }
  });

  let temp = [];

  for (const dancer in dancers) {
    temp.push({dancer, points: dancers[dancer]});
  }

  dancers = temp;
  dancers.sort((a, b) => {
    if (a.points < b.points) {
      return 1;
    } else if (a.points > b.points) {
      return -1;
    } else {
      return 0;
    }
  });

  temp = [];

  for (const country in countries) {
    temp.push({country, points: countries[country]});
  }

  countries = temp;
  countries.sort((a, b) => {
    if (a.points < b.points) {
      return 1;
    } else if (a.points > b.points) {
      return -1;
    } else {
      return 0;
    }
  });

  console.log(dancers);
  console.log(countries);
}

calculateRanking();