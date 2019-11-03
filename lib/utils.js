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

function filterDates(dancers, startDate, endDate) {
  dancers.forEach(dancer => {
    //console.log(dancer.wins);
    dancer.wins = dancer.wins.filter(battle => (new Date(battle.start)) >= startDate && (new Date(battle.end)) <= endDate);
  });

  return dancers;
}

module.exports = {
  filterLevel,
  filterParticipants,
  setRankings,
  filterDates
};