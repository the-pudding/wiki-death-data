const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');
const generateDateRange = require('../helpers/generate-date-range');
const getTimestamp = require('../helpers/get-timestamp');
const outputDir = './output/people-pageviews';

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

const medianWikiPageviews = d3.median(wikiPageviewData.map(d => +d.views));
let timestampIndex = null;

function createDateIndex() {
  const startDate = new Date(2015, 6, 1);
  const endDate = new Date();
  const dates = generateDateRange(startDate, endDate);
  timestampIndex = dates.map(d => getTimestamp({ date: d }));
}

function calculateShare({ views, timestamp }) {
  const match = wikiPageviewData.find(d => d.timestamp === timestamp);
  if (match) return views / +match.views;
  console.error('no match', timestamp);
  return null;
}

function createFiller(t, i) {
  return {
    timestamp: t,
    timestamp_index: i,
    views: null,
    views_adjusted: null,
    share: null
  };
}

function clean(data) {
  return data.map(d => ({
    timestamp: d.timestamp.substring(0, 8),
    views: d.views
  }));
}

function addInfo(data) {
  const withInfo = data.map(d => {
    const timestamp_index = timestampIndex.findIndex(t => t === d.timestamp);
    const share = calculateShare(d);
    const views_adjusted = Math.floor(share * medianWikiPageviews);
    return {
      ...d,
      timestamp_index,
      share,
      views_adjusted
    };
  });

  const withFiller = timestampIndex.map((t, i) => {
    const match = withInfo.find(m => m.timestamp === t);
    if (match) return match;
    return createFiller(t, i);
  });

  return withFiller;
}

function query(person) {
  return new Promise((resolve, reject) => {
    const id = person.link.replace('/wiki/', '');
    pageviews
      .getPerArticlePageviews({
        project: 'en.wikipedia',
        agent: 'user',
        granularity: 'daily',
        start: '20150701',
        end: getTimestamp({}),
        article: person.name
      })
      .then(result => {
        const data = clean(result.items);
        const withInfo = addInfo(data);
        const output = d3.csvFormat(withInfo);
        fs.writeFileSync(`${outputDir}/${id}.csv`, output);
        resolve();
      })
      .catch(reject);
  });
}

async function init() {
  mkdirp(outputDir);
  createDateIndex();

  const data = d3.csvParse(
    fs.readFileSync('./output/people--all-deaths.csv', 'utf-8')
  );

  let i = 0;
  for (const item of data) {
    await query(item)
      .then(() => console.log(`${i} of ${data.length}`))
      .catch(console.error);
    i += 1;
  }
}

init();
