const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output/people-joined';

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

function calculateTraffic({ views, timestamp }) {
  const match = wikiPageviewData.find(d => d.timestamp === timestamp);
  if (match) return views / match.views;
  console.error('no match', ppd);
  return null;
}

function joinData(person) {
  const id = person.link.replace('/wiki/', '');
  const personPageviewData = d3.csvParse(
    fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8')
  );

  const merged = personPageviewData.map(ppd => ({
    ...ppd,
    ...person,
    percent_traffic: calculateTraffic(ppd)
  }));

  merged.forEach(d => {
    delete d.project;
    delete d.article;
    delete d.granularity;
    delete d.access;
    delete d.agent;
  });

  const output = d3.csvFormat(merged);
  fs.writeFileSync(`${outputDir}/${id}.csv`, output);
}

function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  data.forEach((d, i) => {
    console.log(`${i} of ${data.length}`);
    joinData(d);
  });
}

init();
