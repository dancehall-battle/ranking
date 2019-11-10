const {Client} = require('graphql-ld/index');
const {QueryEngineComunica} = require('graphql-ld-comunica/index');

function filterLevel(dancers) {
  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => battle.level === 'pro' || battle.level === 'all');
  });

  return dancers;
}

function filterAge(dancers) {
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

function filterGender(dancers) {
  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => battle.gender !== 'female');
  });

  return dancers;
}

function filterParticipants(dancers, allowed = [1, 2]) {
  allowed = allowed.map(a => '' + a);

  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => allowed.indexOf(battle.participants) !== -1);
  });

  return dancers;
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

function filterHomeAway(dancers, homeAway = 'both') {
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

async function getDancers(query, startDate, stopDate, participants, homeAway, tpfServer = 'https://data.dancehallbattle.org/data', removeFemaleBattles = false) {
  const client = _getClient(tpfServer);
  let dancers = (await client.query({ query })).data;
  dancers = filterLevel(dancers);
  dancers = filterAge(dancers);

  if (removeFemaleBattles) {
    dancers = filterGender(dancers);
  }

  dancers = filterDates(dancers, startDate, stopDate);
  dancers = filterParticipants(dancers, participants);
  dancers = filterHomeAway(dancers, homeAway);
  return dancers.filter(dancer => dancer.wins.length > 0);
}

function _getClient(tpfServer) {
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

module.exports = {
  setRankings,
  getDancers
};