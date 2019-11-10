const {differenceInMonths} = require('date-fns');
const formatDate = require('date-fns').format;
const Ranker = require('./ranker');

class DancerRanker extends Ranker {

  constructor(points) {
    super(points);
  }

  _getRankingArray(dancers) {
    const dancerToPoints = this._getPoints(dancers, this.options.endDate);
    const rankingArray = [];
    const keys = Object.keys(dancerToPoints);

    keys.forEach(key => {
      rankingArray.push({'dancer': key, points: dancerToPoints[key]});
    });

    return rankingArray;
  }

  _toJSONLD(rankingArray) {
    return super._toJSONLD(rankingArray, `https://dancehallbattle.org/ranking/dancer/${this.options.participants.join('-')}/${this.options.homeAway}/` + formatDate(new Date(), 'yyyy-MM-dd'), this.options.homeAway, {
      'schema': 'http://schema.org/',
      'dhb': 'https://dancehallbattle.org/ontology/',
      'date': 'schema:dateCreated',
      'items': 'schema:itemListElement',
      'points': 'dhb:points',
      'rank': 'schema:position',
      'dancer' :'schema:item'
    }, ['dhb:DancerRanking']);
  }

  _generateCSV(data) {
    let csv = `rank,dancer,points\n`;

    data.forEach(dancer => {
      csv += `${dancer.rank},${this._getNameFromID(this.dancers, dancer.dancer)},${dancer.points}\n`;
    });

    return csv;
  }

  _getNameFromID(dancers, id) {
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

  _getPoints(dancers, endDate) {
    const dancerToPoints = {};

    dancers.forEach(dancer => {
      dancer.wins.forEach(win => {
        const diff = differenceInMonths(endDate, new Date(win.end)) + 1;
        const pointsGained = this.points[diff];

        if (!dancerToPoints[dancer.id]) {
          dancerToPoints[dancer.id] = 0
        }

        dancerToPoints[dancer.id] += pointsGained / parseInt(win.participants);
      });
    });

    return dancerToPoints;
  }
}

module.exports = DancerRanker;