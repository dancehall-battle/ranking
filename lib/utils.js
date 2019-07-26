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

module.exports = {
  filterLevel,
  filterParticipants
};