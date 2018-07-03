const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const getTimestamp = require('../helpers/get-timestamp');
const outputDir = './output/people-by-week';

const MIDWEEK_INDEX = 3;
const DAYS_IN_WEEK = 7;

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

function calculateTraffic({ views, timestamp }) {
  // const match = wikiPageviewData.find(d => d.timestamp === timestamp);
  // if (match) return views / match.views;
  // console.error('no match', timestamp);
  // return null;
}

function createWeekData(person) {
  const id = person.link.replace('/wiki/', '');
  const personPageviewData = d3.csvParse(
    fs.readFileSync(`./output/people-joined/${id}.csv`, 'utf-8')
  );

  const deathIndex = personPageviewData.findIndex(
    d => d.timestamp === `${person.timestamp_of_death}00`
  );

  const rem = deathIndex % DAYS_IN_WEEK;
  const offset = MIDWEEK_INDEX - rem;

  const withWeek = personPageviewData.map(d => ({
    ...d,
    week: Math.floor((+d.timestamp_index + offset) / DAYS_IN_WEEK)
  }));

  const nested = d3
    .nest()
    .key(d => d.week)
    .rollup(values => {
      const views = d3.sum(values, v => +v.views);
      const timestamps = values.map(v => v.timestamp);
      const filteredWikiPageviews = wikiPageviewData.filter(w =>
        timestamps.includes(w.timestamp)
      );
      const total = d3.sum(filteredWikiPageviews, d => +d.views);
      const percent_traffic = views / total;
      const { week, timestamp, timestamp_index } = values[0];
      const count = values.length;
      return {
        views,
        percent_traffic,
        week,
        timestamp,
        timestamp_index,
        count
      };
    })
    .entries(withWeek);

  const flat = nested.map(d => d.value).filter(d => d.count === 7);
  const output = d3.csvFormat(flat);
  fs.writeFileSync(`${outputDir}/${id}.csv`, output);
}

function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  data.forEach((d, i) => {
    console.log(`${i} of ${data.length}`);
    createWeekData(d);
  });
}

init();
