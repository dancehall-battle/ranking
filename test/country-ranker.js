const { execFile } = require('child_process');
const path = require('path');
const chai = require('chai');
const {CountryRanker} = require('..');

chai.should();

describe('CountryRanker', function() {
  this.timeout(50000);
  let ldfServer;
  let killingLdfServer = false;

  before(function(done) {
    ldfServer = execFile('node', ['./node_modules/ldf-server/bin/ldf-server', path.join(__dirname, 'ldf-config.json')], (error, stdout, stderr) => {
      if (!killingLdfServer) {
        if (error) {
          throw error;
        }
        console.log(stdout);
      }
    });

    ldfServer.stdout.on('data', (data) => {
      if (data.indexOf('Worker') !== -1) {
        done();
      }
    });
  });

  after(function() {
    killingLdfServer = true;
    ldfServer.kill();
  });

  beforeEach(function() {
    // runs before each test in this block
  });

  afterEach(function() {
    // runs after each test in this block
  });

  // test cases

  it('01', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'both',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(3);
    getPoints(result.items, 'fr').should.equal(18);
    getPoints(result.items, 'gr').should.equal(18);
    getPoints(result.items, 'ua').should.equal(17);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'gr').should.equal(1);
    getRank(result.items, 'ua').should.equal(3);
  });

  it('02', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'both',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(3);
    getPoints(result.items, 'fr').should.equal(18);
    getPoints(result.items, 'gr').should.equal(18);
    getPoints(result.items, 'ua').should.equal(17);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'gr').should.equal(1);
    getRank(result.items, 'ua').should.equal(3);
  });

  it('03', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'home',
      tpfServer: 'http://localhost:3000/data'
    });

    result['@type'].should.include('dhb:HomeRanking');
    result.items.should.have.lengthOf(2);
    getPoints(result.items, 'fr').should.equal(18);
    getPoints(result.items, 'gr').should.equal(18);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'gr').should.equal(1);
  });

  it('04', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'away',
      tpfServer: 'http://localhost:3000/data'
    });

    result['@type'].should.include('dhb:AwayRanking');
    result.items.should.have.lengthOf(1);
    getPoints(result.items, 'ua').should.equal(17);

    getRank(result.items, 'ua').should.equal(1);
  });

  it('05', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-01-31'),
      format: 'jsonld',
      homeAway: 'away',
      tpfServer: 'http://localhost:3000/data'
    });

    result['@type'].should.include('dhb:AwayRanking');
    result.items.should.have.lengthOf(3);
    getPoints(result.items, 'fr').should.equal(18);
    getPoints(result.items, 'be').should.equal(18);
    getPoints(result.items, 'se').should.equal(18);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'be').should.equal(1);
    getRank(result.items, 'se').should.equal(1);
  });

  it('1 vs 1, 2 vs 2, away', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-02-28'),
      format: 'jsonld',
      homeAway: 'away',
      tpfServer: 'http://localhost:3000/data'
    });

    result['@type'].should.include('dhb:AwayRanking');

    result.items.should.have.lengthOf(5);
    getPoints(result.items, 'fr').should.equal(35);
    getPoints(result.items, 'be').should.equal(17);
    getPoints(result.items, 'se').should.equal(17);
    getPoints(result.items, 'ua').should.equal(18);
    getPoints(result.items, 'ro').should.equal(18);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'ua').should.equal(2);
    getRank(result.items, 'ro').should.equal(2);
    getRank(result.items, 'be').should.equal(4);
    getRank(result.items, 'se').should.equal(4);
  });

  it('1 vs 1, 2 vs 2, away (scaled)', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-02-28'),
      format: 'jsonld',
      homeAway: 'away',
      tpfServer: 'http://localhost:3000/data',
      scale: true
    });

    result['@type'].should.include('dhb:AwayRanking');

    result.items.should.have.lengthOf(5);
    getPoints(result.items, 'fr').should.equal(11589);
    getPoints(result.items, 'be').should.equal(5313);
    getPoints(result.items, 'se').should.equal(5629);
    getPoints(result.items, 'ua').should.equal(6767);
    getPoints(result.items, 'ro').should.equal(5625);

    getRank(result.items, 'fr').should.equal(1);
    getRank(result.items, 'ua').should.equal(2);
    getRank(result.items, 'ro').should.equal(4);
    getRank(result.items, 'be').should.equal(5);
    getRank(result.items, 'se').should.equal(3);
  });

  it('1 vs 1, 2 vs 2, home', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-02-28'),
      format: 'jsonld',
      homeAway: 'home',
      tpfServer: 'http://localhost:3000/data'
    });

    result['@type'].should.include('dhb:HomeRanking');

    result.items.should.have.lengthOf(7);
    getPoints(result.items, 'it').should.equal(35);
    getPoints(result.items, 'kz').should.equal(18);
    getPoints(result.items, 'pt').should.equal(18);
    getPoints(result.items, 'fr').should.equal(18);
    getPoints(result.items, 'ua').should.equal(54);
    getPoints(result.items, 'ru').should.equal(54);
    getPoints(result.items, 'md').should.equal(18);

    getRank(result.items, 'ru').should.equal(1);
    getRank(result.items, 'ua').should.equal(1);
    getRank(result.items, 'it').should.equal(3);
    getRank(result.items, 'kz').should.equal(4);
    getRank(result.items, 'pt').should.equal(4);
    getRank(result.items, 'fr').should.equal(4);
    getRank(result.items, 'md').should.equal(4);
  });

  it('1 vs 1, 2 vs 2, home/away', async () => {
    const ranker = new CountryRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-02-28'),
      format: 'jsonld',
      homeAway: 'both',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(10);
    getPoints(result.items, 'it').should.equal(35);
    getPoints(result.items, 'kz').should.equal(18);
    getPoints(result.items, 'pt').should.equal(18);
    getPoints(result.items, 'fr').should.equal(18+35); // 53
    getPoints(result.items, 'ua').should.equal(54+18); // 72
    getPoints(result.items, 'ru').should.equal(54);
    getPoints(result.items, 'md').should.equal(18);
    getPoints(result.items, 'be').should.equal(17);
    getPoints(result.items, 'se').should.equal(17);
    getPoints(result.items, 'ro').should.equal(18);

    getRank(result.items, 'ua').should.equal(1);
    getRank(result.items, 'ru').should.equal(2);
    getRank(result.items, 'fr').should.equal(3);
    getRank(result.items, 'it').should.equal(4);
    getRank(result.items, 'pt').should.equal(5);
    getRank(result.items, 'kz').should.equal(5);
    getRank(result.items, 'md').should.equal(5);
    getRank(result.items, 'ro').should.equal(5);
    getRank(result.items, 'be').should.equal(9);
    getRank(result.items, 'se').should.equal(9);
  });
});

function getPoints(items, country) {
  return getPropertyFromItem(items, country, 'points');
}

function getRank(items, country) {
  return getPropertyFromItem(items, country, 'rank');
}

function getPropertyFromItem(items, country, prop) {
  let i = 0;

  while (i < items.length && items[i].name !== country) {
    i ++;
  }

  if (i < items.length) {
    return items[i][prop];
  } else {
    return null;
  }
}