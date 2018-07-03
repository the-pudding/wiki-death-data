const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const generateDateRange = require('../helpers/generate-date-range');
const getTimestamp = require('../helpers/get-timestamp');
const outputDir = './output/people-joined';

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

let timestampIndex = null;

function createDateIndex() {
  const startDate = new Date(2015, 6, 1);
  const endDate = new Date();
  const dates = generateDateRange(startDate, endDate);
  timestampIndex = dates.map(d => getTimestamp({ date: d, suffix: '00' }));
}

function calculateTraffic({ views, timestamp }) {
  const match = wikiPageviewData.find(d => d.timestamp === timestamp);
  if (match) return views / match.views;
  console.error('no match', timestamp);
  return null;
}

function createFiller(t, i) {
  return {
    timestamp: t,
    timestamp_index: i,
    views: null,
    percent_traffic: null
  };
}

function joinData(person) {
  const id = person.link.replace('/wiki/', '');
  const personPageviewData = d3.csvParse(
    fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8')
  );

  const merged = personPageviewData.map(ppd => ({
    timestamp: ppd.timestamp,
    timestamp_index: timestampIndex.findIndex(d => d === ppd.timestamp),
    views: ppd.views,
    percent_traffic: calculateTraffic(ppd)
  }));

  const withFiller = timestampIndex.map((t, i) => {
    const match = merged.find(m => m.timestamp === t);
    if (match) return match;
    return createFiller(t, i);
  });

  const output = d3.csvFormat(withFiller);
  fs.writeFileSync(`${outputDir}/${id}.csv`, output);
}

function init() {
  mkdirp(outputDir);

  createDateIndex();

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  data.forEach((d, i) => {
    console.log(`${i} of ${data.length}`);
    joinData(d);
  });
}

init();
