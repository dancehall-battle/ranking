function filterLevel(dancers) {
  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => battle.level === 'pro' || battle.level === 'all');
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

function toJSONLD(rankingArray, rankingIRI, homeAway = 'both') {
  let rankCounter = 0;

  rankingArray.forEach(rank => {
    rank['@id'] = rankingIRI + '/' + rankCounter;
    rankCounter ++;
  });

  const types = ['schema:ItemList', 'dhb:Ranking'];

  if (homeAway === 'home') {
    types.push('dhb:HomeRanking');
  } else if (homeAway === 'away') {
    types.push('dhb:AwayRanking');
  }

  const jsonld = {
    '@context': {
      'schema': 'http://schema.org/',
      'dhb': 'https://dancehallbattle.org/ontology/',
      'date': 'schema:dateCreated',
      'items': 'schema:itemListElement',
      'points': 'dhb:points',
      'rank': 'schema:position',
      'dancer' :'schema:item'
    },
    '@id': rankingIRI,
    '@type': types,
    date: new Date(),
    items: rankingArray
  };

  return jsonld;
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

module.exports = {
  filterLevel,
  filterParticipants,
  setRankings,
  filterDates,
  toJSONLD,
  filterHomeAway
};