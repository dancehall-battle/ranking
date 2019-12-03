const { execFile } = require('child_process');
const path = require('path');
const chai = require('chai');
const DifferenceCalculator = require('../lib/difference-calculator');

chai.should();

describe('DifferenceCalculator', function() {
  this.timeout(50000);

  // test cases
  it('01', async () => {
    const calculator = new DifferenceCalculator();

    const oldRanking = {
      '@context': {
        schema: 'http://schema.org/',
        dhb: 'https://dancehallbattle.org/ontology/',
        date: 'schema:dateCreated',
        items: 'schema:itemListElement',
        points: 'dhb:points',
        rank: 'schema:position',
        name: 'schema:item'
      },
      '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03',
      '@type': [ 'schema:ItemList', 'dhb:Ranking', 'dhb:CountryRanking' ],
      date: '2019-12-03T20:14:02.368Z',
      items: [
        {
          name: 'fr',
          points: 18,
          rank: 1,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/0'
        },
        {
          name: 'gr',
          points: 18,
          rank: 1,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/1'
        },
        {
          name: 'ua',
          points: 17,
          rank: 3,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/2'
        }
      ]
    };

    const currentRanking = {
      '@context': {
        schema: 'http://schema.org/',
        dhb: 'https://dancehallbattle.org/ontology/',
        date: 'schema:dateCreated',
        items: 'schema:itemListElement',
        points: 'dhb:points',
        rank: 'schema:position',
        name: 'schema:item'
      },
      '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03',
      '@type': [ 'schema:ItemList', 'dhb:Ranking', 'dhb:CountryRanking' ],
      date: '2019-12-03T20:14:02.368Z',
      items: [
        {
          name: 'fr',
          points: 18,
          rank: 1,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/0'
        },
        {
          name: 'gr',
          points: 10,
          rank: 3,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/1'
        },
        {
          name: 'ua',
          points: 17,
          rank: 2,
          '@id': 'https://dancehallbattle.org/ranking/country/1/both/2019-12-03/2'
        }
      ]
    };

    calculator.calculate(oldRanking, currentRanking);

    console.log(currentRanking);
  });

});