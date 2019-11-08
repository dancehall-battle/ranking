
describe('hooks', function() {
  before(function() {
    console.log('hello');
    // runs before all tests in this block
  });

  after(function() {
    // runs after all tests in this block
  });

  beforeEach(function() {
    // runs before each test in this block
  });

  afterEach(function() {
    // runs after each test in this block
  });

  // test cases

  it('dfd', () => {
    console.log('hello');
  })
});