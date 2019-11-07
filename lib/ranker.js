const {setRankings, dancersToJSONLD, getDancers}  = require('./utils');
const {differenceInMonths} = require('date-fns');
const formatDate = require('date-fns').format;
const fs = require('fs-extra');
const path = require('path');

class Ranker {

  constructor(points) {
    this.points = points;
  }

  async getRanking(options) {
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

    const dancers = await getDancers(query, options.startDate, options.stopDate, options.participants, options.homeAway);
    const rankingArray = this._getRankingArray(dancers);

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
      return dancersToJSONLD(rankingArray, `https://dancehallbattle.org/ranking/dancer/${participants.join('-')}/${homeAway}/` + formatDate(new Date(), 'yyyy-MM-dd'), homeAway);
    } else if (format === 'csv') {
      return generateCSV(rankingArray, dancers);
    } else {
      throw new Error('Invalid output format: ' + format);
    }
  }

  _getRankingArray(dancers) {
    throw new Error('Method not implemented in concrete class.');
  }

  _toJSONLD(rankingArray, rankingIRI, homeAway) {

  }
}

const points = fs.readJsonSync(path.resolve(__dirname, 'points.json'));

// Define a query


async function main(participants, startDate, stopDate, format = 'csv', homeAway = 'both') {
  const dancers = await getDancers(query, startDate, stopDate, participants, homeAway);
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
    return dancersToJSONLD(rankingArray, `https://dancehallbattle.org/ranking/dancer/${participants.join('-')}/${homeAway}/` + formatDate(new Date(), 'yyyy-MM-dd'), homeAway);
  } else if (format === 'csv') {
    return generateCSV(rankingArray, dancers);
  } else {
    throw new Error('Invalid output format: ' + format);
  }
}

function getPoints(dancers) {
  const dancerToPoints = {};

  dancers.forEach(dancer => {
    dancer.wins.forEach(win => {
      const diff = differenceInMonths(new Date(), new Date(win.end)) + 1;
      const pointsGained = points[diff];

      if (!dancerToPoints[dancer.id]) {
        dancerToPoints[dancer.id] = 0
      }

      dancerToPoints[dancer.id] += pointsGained / parseInt(win.participants);
    });
  });

  return dancerToPoints;
}

function generateCSV(data, dancers) {
  let csv = `rank,dancer,points\n`;

  data.forEach(dancer => {
    csv += `${dancer.rank},${getNameFromID(dancers, dancer.dancer)},${dancer.points}\n`;
  });

  return csv;
}

module.exports = main;