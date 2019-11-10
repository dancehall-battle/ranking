const {setRankings, getDancers} = require('./utils');
const fs = require('fs-extra');
const path = require('path');

class Ranker {

  constructor(points) {
    this.points = points;

    if (!this.points) {
      this.points = fs.readJsonSync(path.resolve(__dirname, 'points.json'));
    }
  }

  async getRanking(options) {
    this.options = options;

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
        age @single
        gender @single
        atEvent @single {
          location @single
        }
      }
    }`;

    const dancers = await getDancers(query, options.startDate, options.endDate, options.participants, options.homeAway, options.tpfServer, options.removeFemaleBattles);
    this.dancers = dancers;
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

    if (options.format === 'jsonld') {
      //console.dir(toJSONLD(rankingArray), {depth: null});
      return this._toJSONLD(rankingArray);
    } else if (options.format === 'csv') {
      return this._generateCSV(rankingArray);
    } else {
      throw new Error('Invalid output format: ' + options.format);
    }
  }

  _getRankingArray(dancers) {
    throw new Error('Method not implemented in concrete class.');
  }

  _toJSONLD(rankingArray, rankingIRI, homeAway = 'both', context, types = []) {
    let rankCounter = 0;

    rankingArray.forEach(rank => {
      rank['@id'] = rankingIRI + '/' + rankCounter;
      rankCounter++;
    });

    types = ['schema:ItemList', 'dhb:Ranking'].concat(types);

    if (homeAway === 'home') {
      types.push('dhb:HomeRanking');
    } else if (homeAway === 'away') {
      types.push('dhb:AwayRanking');
    }

    const jsonld = {
      '@context': context,
      '@id': rankingIRI,
      '@type': types,
      date: new Date(),
      items: rankingArray
    };

    return jsonld;
  }

  _generateCSV(rankingArray) {
    throw new Error('Method not implemented in concrete class.');
  }
}

module.exports = Ranker;