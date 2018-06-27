const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output';

function clean(data) {
  return data.map(d => ({
    ...d,
    views: +d.views,
    percent_traffic: +d.percent_traffic
  }));
}

function calculate({ link }) {
  const id = link.replace('/wiki/', '');
  const dailyData = clean(
    d3.csvParse(fs.readFileSync(`./output/people-joined/${id}.csv`, 'utf-8'))
  );

  const median_views = d3.median(dailyData, d => d.views);
  const median_percent_traffic = d3.median(dailyData, d => d.percent_traffic);
  const max_views = d3.max(dailyData, d => d.views);
  const max_percent_traffic = d3.max(dailyData, d => d.percent_traffic);
  const max_change_views = max_views / median_views;
  const max_change_percent_traffic =
    max_percent_traffic / median_percent_traffic;
  return {
    link,
    median_views,
    median_percent_traffic,
    max_views,
    max_percent_traffic,
    max_change_views,
    max_change_percent_traffic
  };
}

function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  const withAverages = data.map(calculate);
  const output = d3.csvFormat(withAverages);
  fs.writeFileSync('./output/explore.csv', output);
}

init();
