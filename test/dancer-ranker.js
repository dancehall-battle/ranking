const { execFile } = require('child_process');
const path = require('path');
const chai = require('chai');
const {DancerRanker} = require('..');

chai.should();

describe('DancerRanker', function() {
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
    const ranker = new DancerRanker();

    const result = await ranker.getRanking({
      participants: ['1'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'both',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(3);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(18);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(18);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(17);

    getRank(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(1);
    getRank(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(1);
    getRank(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(3);
  });

  it('02', async () => {
    const ranker = new DancerRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'both',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(3);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(18);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(18);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(17);

    getRank(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(1);
    getRank(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(1);
    getRank(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(3);
  });

  it('03', async () => {
    const ranker = new DancerRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'home',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(2);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(18);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(18);

    getRank(result.items, 'https://dancehallbattle.org/dancer/gato').should.equal(1);
    getRank(result.items, 'https://dancehallbattle.org/dancer/dimitriskaklamanis').should.equal(1);
  });

  it('04', async () => {
    const ranker = new DancerRanker();

    const result = await ranker.getRanking({
      participants: ['1', '2'],
      startDate: new Date('2018-01-01'),
      endDate: new Date('2018-04-01'),
      format: 'jsonld',
      homeAway: 'away',
      tpfServer: 'http://localhost:3000/data'
    });

    result.items.should.have.lengthOf(1);
    getPoints(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(17);

    getRank(result.items, 'https://dancehallbattle.org/dancer/katrinwow').should.equal(1);
  });
});

function getPoints(items, dancerIRI) {
  return getPropertyFromItem(items, dancerIRI, 'points');
}

function getRank(items, dancerIRI) {
  return getPropertyFromItem(items, dancerIRI, 'rank');
}

function getPropertyFromItem(items, dancerIRI, prop) {
  let i = 0;

  while (i < items.length && items[i].dancer !== dancerIRI) {
    i ++;
  }

  if (i < items.length) {
    return items[i][prop];
  } else {
    return null;
  }
}