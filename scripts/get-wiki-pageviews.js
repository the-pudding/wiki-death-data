const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');
const getTimestamp = require('../helpers/get-timestamp');
const outputDir = './output';

function clean(data) {
  return data.map(d => ({
    timestamp: d.timestamp.substring(0, 8),
    views: d.views
  }));
}

function init() {
  mkdirp(outputDir);

  pageviews
    .getAggregatedPageviews({
      project: 'en.wikipedia',
      agent: 'user',
      granularity: 'daily',
      start: '2015070100',
      end: getTimestamp({ suffix: '00' })
    })
    .then(result => {
      const data = clean(result.items);
      const output = d3.csvFormat(data);

      const median = d3.median(data, d => d.views);
      console.log({ median });
      fs.writeFileSync('./output/wiki-pageviews.csv', output);
    })
    .catch(console.error);
}

init();
