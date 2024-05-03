const {differenceInMonths} = require('date-fns');
const formatDate = require('date-fns').format;
const Ranker = require('./ranker');

class CountryRanker extends Ranker {

  constructor(points) {
    super(points);
  }

  _getRankingArray(dancers) {
    const countries = this._dancersToCountries(dancers);
    const countryToPoints = this._getPoints(countries, this.options.endDate, this.options.scale);
    const rankingArray = [];
    const keys = Object.keys(countryToPoints);

    keys.forEach(key => {
      rankingArray.push({'name': key, points: countryToPoints[key]});
    });

    return rankingArray;
  }

  _toJSONLD(rankingArray) {
    return super._toJSONLD(rankingArray, `https://dancehallbattle.org/ranking/country/${this.options.participants.join('-')}/${this.options.homeAway}/` + formatDate(new Date(), 'yyyy-MM-dd'), this.options.homeAway, {
      'schema': 'http://schema.org/',
      'dhb': 'https://dancehallbattle.org/ontology/',
      'date': 'schema:dateCreated',
      'items': 'schema:itemListElement',
      'points': 'dhb:points',
      'rank': 'schema:position',
      'name': 'schema:item'
    }, ['dhb:CountryRanking']);
  }

  _getPoints(countries, endDate, scale = false) {
    const codes = Object.keys(countries);
    const countryToPoints = {};

    if (scale) {
      this.totalPointsAcrossAllCountries = Object.values(this.countryToPointsOffered).reduce((a, b) => a + b, 0);
    }

    codes.forEach(code => {
      countries[code].forEach(win => {
        const diff = differenceInMonths(endDate, new Date(win.end)) + 1;
        //console.log(diff);

        const pointsGained = this.points[diff];

        if (!countryToPoints[code]) {
          countryToPoints[code] = 0
        }

        countryToPoints[code] += pointsGained / parseInt(win.participants);
      });

      if (scale) {
        if (!this.countryToPointsOffered[code]) {
          this.countryToPointsOffered[code] = 0
        }

        //console.log(`${countryToPoints[code]} / (${totalPointsAcrossAllCountries} - ${this.countryToPointsOffered[code]}) * 1000`);
        countryToPoints[code] = Math.round((countryToPoints[code] / (this.totalPointsAcrossAllCountries - this.countryToPointsOffered[code])) * 100000);
      }
    });

    return countryToPoints;
  }

  _dancersToCountries(dancers) {
    const countries = {};

    dancers.forEach(dancer => {
      if (dancer.country !== '' && dancer.country !== '(null)') {
        if (!countries[dancer.country]) {
          countries[dancer.country] = [];
        }

        countries[dancer.country] = countries[dancer.country].concat(dancer.wins);
      }
    });

    return countries;
  }

  _generateCSV(data) {
    let csv = `rank,country,points\n`;

    data.forEach(country => {
      csv += `${country.rank},${country.name},${country.points}\n`;
    });

    return csv;
  }
}

module.exports = CountryRanker;
