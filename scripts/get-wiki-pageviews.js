const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');
const getTimestamp = require('../helpers/get-timestamp');

// Getting aggregated pageviews for a single project
pageviews
  .getAggregatedPageviews({
    project: 'en.wikipedia',
    agent: 'user',
    granularity: 'daily',
    start: '2015070100',
    end: getTimestamp({ suffix: '00' })
  })
  .then(result => {
    const output = d3.csvFormat(result.items);
    mkdirp('./output');
    fs.writeFileSync('./output/wiki-pageviews.csv', output);
  })
  .catch(console.error);
