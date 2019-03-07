describe('Core: ResponseScript Tests', () => {
  const sinon = require('sinon');
  const moment = require('moment');
  const chai = require('chai');
  const expect = chai.expect;
  const responseScript = require('../../core/responseScript');
  let scenario;

  beforeEach(() => {
    scenario = {};
    scenario.result = {};
    scenario.result.context = [];
    scenario.result.state = 'passed';
    scenario.result.start = moment();
  });

  it('should fail when scenario.expected is not set', async () => {
    await responseScript(scenario);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({ error: `No expected results!` });
  });

  it('should fail when scenario.actualRespons is not defined', async () => {
    scenario.expected = {}
    await responseScript(scenario);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({ error: `Response is undefined! Check your request then try again.` });
  });

  it('should validate status - passed', async () => {
    scenario.expected = { status: 200 };
    let actualResponse = { status: 200 };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('passed');
  });

  it('should validate status - failed', async () => {
    scenario.expected = { status: 200 };
    let actualResponse = { status: 201 };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({
      error: 'Response status is incorrect!',
      actual: 201,
      expected: 200
    });
  });

  it('should validate statusText - passed', async () => {
    scenario.expected = { statusText: 'Success' };
    let actualResponse = { statusText: 'Success' };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('passed');
  });

  it('should validate statusText - failed', async () => {
    scenario.expected = { statusText: 'Success' };
    let actualResponse = { statusText: 'Bad Request' };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({
      error: 'Response status text is incorrect!',
      actual: 'Bad Request',
      expected: 'Success'
    });
  });

  it('should validate expected data - passed', async () => {
    scenario.expected = {
      data: [
        { path: '$.title', equals: 'Live Long and Prosper' },
        { path: '$.body', contains: 'computer' },
        { path: '$.body', notcontains: 'StarWars' },
        { path: '$.tags', contains: 'startrek' },
        { path: '$.tags', notcontains: 'discovery' }
      ]
    };
    let actualResponse = {
      data: {
        title: 'Live Long and Prosper',
        body: 'Computer, run a level-two diagnostic on warp-drive systems.',
        tags: ['startrek', 'spock', 'enterprise']
      }
    };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('passed');
  });

  it('should validate expected data inline - passed', async () => {
    scenario.expected = {
      data: [
        { path: '$.title', equals: 'Live Long and Prosper' },
        { path: '$.body', contains: 'computer', notcontains: 'StarWars' }
      ]
    };
    let actualResponse = {
      data: {
        title: 'Live Long and Prosper',
        body: 'Computer, run a level-two diagnostic on warp-drive systems.'
      }
    };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('passed');
  });

  it('should validate expected data - failed', async () => {
    scenario.expected = {
      data: [
        { path: '$.title', equals: 'Lives Long and Prosper' },
        { path: '$.body', contains: 'macintosh' },
        { path: '$.body', notcontains: 'computer' },
        { path: '$.tags', contains: 'starwars' },
        { path: '$.tags', notcontains: 'spock' }
      ]
    };
    let actualResponse = {
      data: {
        title: 'Live Long and Prosper',
        body: 'Computer, run a level-two diagnostic on warp-drive systems.',
        tags: ['startrek', 'spock', 'enterprise']
      }
    };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({
      error: 'Field value is incorrect!',
      path: '$.title',
      actual: 'Live Long and Prosper',
      expected: 'Lives Long and Prosper'
    });
    expect(scenario.result.context).to.deep.include({
      error: 'Field value is incorrect!',
      path: '$.body',
      actual: 'Computer, run a level-two diagnostic on warp-drive systems.',
      contains: 'macintosh'
    });
    expect(scenario.result.context).to.deep.include({
      error: 'Field value is incorrect!',
      path: '$.body',
      actual: 'Computer, run a level-two diagnostic on warp-drive systems.',
      notcontains: 'computer'
    });
    expect(scenario.result.context).to.deep.include({
      error: 'Field value is incorrect!',
      path: '$.tags',
      actual: ['startrek', 'spock', 'enterprise'],
      contains: 'starwars'
    });
    expect(scenario.result.context).to.deep.include({
      error: 'Field value is incorrect!',
      path: '$.tags',
      actual: ['startrek', 'spock', 'enterprise'],
      notcontains: 'spock'
    });
  });

  it('should validate expected data - no response', async () => {
    scenario.expected = {
      data: [
        { path: '$.title', equals: 'Lives Long and Prosper' },
        { path: '$.body', contains: 'macintosh' },
        { path: '$.body', notcontains: 'computer' }
      ]
    };
    let actualResponse = {};

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('failed');
    expect(scenario.result.context).to.deep.include({
      error: 'Field not found!'
    });
  });

  it('should validate expected data - callback', async () => {
    let customValidation = sinon.fake();
    scenario.expected = {
      data: [
        { path: '$.body', callback: customValidation }
      ]
    };
    let actualResponse = {
      data: {
        title: 'Live Long and Prosper',
        body: 'Computer, run a level-two diagnostic on warp-drive systems.'
      }
    };

    await responseScript(scenario, actualResponse);
    expect(scenario.result.state).to.be.equal('passed');
    expect(customValidation.callCount).to.be.equal(1);
  });
});