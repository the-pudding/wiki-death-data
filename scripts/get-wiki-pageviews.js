const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');

// Getting aggregated pageviews for a single project
pageviews
  .getAggregatedPageviews({
    project: 'en.wikipedia',
    agent: 'user',
    granularity: 'daily',
    start: '2015070100',
    end: '2018062700' //exclusive
  })
  .then(result => {
    const output = d3.csvFormat(result.items);
    mkdirp('./output');
    fs.writeFileSync('./output/wiki-pageviews.csv', output);
  })
  .catch(console.error);
