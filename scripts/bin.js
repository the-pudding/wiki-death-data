const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output/people-bin';

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

function createBinData({ person, days }) {
  const id = person.link.replace('/wiki/', '');
  const personPageviewData = d3.csvParse(
    fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8')
  );

  const deathIndex = personPageviewData.findIndex(
    d => d.timestamp === `${person.timestamp_of_death}`
  );

  const rem = deathIndex % days;
  const mid = days === 2 ? 0 : Math.floor(days / 2);
  const offset = mid - rem;

  const withBin = personPageviewData.map(d => ({
    ...d,
    bin: Math.floor((+d.timestamp_index + offset) / days)
  }));

  const nested = d3
    .nest()
    .key(d => d.bin)
    .rollup(values => {
      const views = d3.sum(values, v => +v.views);
      const timestamps = values.map(v => v.timestamp);
      const filteredWikiPageviews = wikiPageviewData.filter(w =>
        timestamps.includes(w.timestamp)
      );
      const total = d3.sum(filteredWikiPageviews, d => +d.views);
      const share = views / total;
      const { bin, timestamp, timestamp_index } = values[0];
      const count = values.length;
      return {
        views,
        share,
        bin,
        timestamp,
        timestamp_index,
        count
      };
    })
    .entries(withBin);

  const flat = nested.map(d => d.value).filter(d => d.count === days);
  const output = d3.csvFormat(flat);
  fs.writeFileSync(`${outputDir}-${days}/${id}.csv`, output);
}

function init() {
  mkdirp(`${outputDir}-7`);
  mkdirp(`${outputDir}-2`);

  const data = d3.csvParse(
    fs.readFileSync('./output/people--all-deaths.csv', 'utf-8')
  );

  data.forEach((person, i) => {
    console.log(`${i} of ${data.length}`);
    createBinData({ person, days: 7 });
    createBinData({ person, days: 2 });
  });
}

init();
