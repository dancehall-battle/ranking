
class DifferenceCalculator {

  constructor() {
  }

  /**
   * Types:
   *   - rise: item is risen compared to the old ranking.
   *   - fall: item is fallen compared to the old ranking.
   *   - stay: item has neither risen nor fallen compared to the old ranking.
   *   - new: item was not in the old ranking.
   * @param oldRanking
   * @param currentRanking
   */
  calculate(oldRanking, currentRanking) {
    currentRanking['@context'].difference = 'dhb:difference';
    currentRanking.items.forEach(item => {
      const rank = item.rank;
      const oldRank = this.getRankInRanking(oldRanking, item.name);

      if (oldRank === -1) {
        item.difference = 'new';
      } else {
        item.difference = rank - oldRank;
      }
    });
  }

  getRankInRanking(ranking, country) {
    let i = 0;

    while (i < ranking.items.length && ranking.items[i].name !== country) {
      i ++;
    }

    if (i < ranking.items.length) {
      return ranking.items[i].rank;
    } else {
      return null;
    }
  }
}

module.exports = DifferenceCalculator;