const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');

function getEnd() {
  const d = new Date();
  const year = d.getFullYear();
  const month = d3.format('02')(d.getMonth());
  const date = d3.format('02')(d.getDate());
  return `${year}${month}${date}00`;
}

// Getting aggregated pageviews for a single project
pageviews
  .getAggregatedPageviews({
    project: 'en.wikipedia',
    agent: 'user',
    granularity: 'daily',
    start: '2015070100',
    end: getEnd()
  })
  .then(result => {
    const output = d3.csvFormat(result.items);
    mkdirp('./output');
    fs.writeFileSync('./output/wiki-pageviews.csv', output);
  })
  .catch(console.error);
