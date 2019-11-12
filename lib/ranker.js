const {setRankings} = require('./utils');
const fs = require('fs-extra');
const path = require('path');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const {Client} = require('graphql-ld/index');
const {differenceInMonths} = require('date-fns');

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

    const dancers = await this._getDancers(query, options.startDate, options.endDate, options.participants, options.homeAway, options.tpfServer, options.removeFemaleBattles, options.scale);
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

  async _getDancers(query, startDate, stopDate, participants, homeAway, tpfServer = 'https://data.dancehallbattle.org/data', removeFemaleBattles = false, scale = false) {
    const client = this._getClient(tpfServer);
    let dancers = (await client.query({ query })).data;
    dancers = this._filterLevel(dancers);
    dancers = this._filterAge(dancers);

    if (removeFemaleBattles) {
      dancers = this._filterGender(dancers);
    }

    dancers = this._filterDates(dancers, startDate, stopDate);
    dancers = this._filterParticipants(dancers, participants);

    if (scale) {
      this.countryToPointsOffered = this._getCountryToPointsOffered(dancers, stopDate);
      //console.log(this.countryToPointsOffered);
    }

    dancers = this._filterHomeAway(dancers, homeAway);

    return dancers.filter(dancer => dancer.wins.length > 0);
  }

  _getCountryToPointsOffered(dancers, endDate) {
    const countryToPointsOffered = {};

    dancers.forEach(dancer => {
      dancer.wins.forEach(win => {
        const countryOrganising = win.atEvent.location;
        const diff = differenceInMonths(endDate, new Date(win.end)) + 1;

        const pointsGained = this.points[diff];

        if (!countryToPointsOffered[countryOrganising]) {
          countryToPointsOffered[countryOrganising] = 0;
        }

        countryToPointsOffered[countryOrganising] += pointsGained / parseInt(win.participants);
      });
    });

    return countryToPointsOffered;
  }

  _filterLevel(dancers) {
    dancers.forEach(dancer => {
      //console.log(dancer.wins);
      dancer.wins = dancer.wins.filter(battle => battle.level === 'pro' || battle.level === 'all');
    });

    return dancers;
  }

  _filterAge(dancers) {
    dancers.forEach(dancer => {
      //console.log(dancer.wins);
      dancer.wins = dancer.wins.filter(battle =>
        battle.age === '' ||
        battle.age === '16+' ||
        battle.age === '15+' ||
        battle.age === 'adults' );
    });

    return dancers;
  }

  _filterGender(dancers) {
    dancers.forEach(dancer => {
      //console.log(dancer.wins);
      dancer.wins = dancer.wins.filter(battle => battle.gender !== 'female');
    });

    return dancers;
  }

  _filterParticipants(dancers, allowed = [1, 2]) {
    allowed = allowed.map(a => '' + a);

    dancers.forEach(dancer => {
      //console.log(dancer.wins);
      dancer.wins = dancer.wins.filter(battle => allowed.indexOf(battle.participants) !== -1);
    });

    return dancers;
  }

  _filterDates(dancers, startDate, endDate) {
    dancers.forEach(dancer => {
      //console.log(dancer.wins);
      dancer.wins = dancer.wins.filter(battle => (new Date(battle.start)) >= startDate && (new Date(battle.end)) <= endDate);
    });

    return dancers;
  }

  _filterHomeAway(dancers, homeAway = 'both') {
    if (homeAway !== 'both') {
      dancers = dancers.filter(dancer => dancer.country !== '');
      dancers.forEach(dancer => {
        dancer.wins = dancer.wins.filter(battle => {
          if (homeAway === 'home') {
            return battle.atEvent.location === dancer.country;
          } else {
            return battle.atEvent.location !== dancer.country;
          }
        });
      });
    }

    return dancers;
  }

  _getClient(tpfServer) {
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
        "gender":    "dhb:gender" ,
        "age":    "dhb:age" ,
        "participants":    "dhb:amountOfParticipants" ,
        "Dancer": "dhb:Dancer"
      }
    };

// Create a GraphQL-LD client based on a client-side Comunica engine
    const comunicaConfig = {
      sources: [
        { type: "hypermedia", value: tpfServer },
      ],
    };

    return new Client({ context, queryEngine: new QueryEngineComunica(comunicaConfig) });
  }
}

module.exports = Ranker;