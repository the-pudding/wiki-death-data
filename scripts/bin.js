const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output/people-bin';
const MS_DAY = 86400000;

const wikiPageviewData = d3.csvParse(
  fs.readFileSync('./output/wiki-pageviews.csv', 'utf-8')
);

function getDiff(a, b) {
  const aDate = new Date(
    a.substring(0, 4),
    a.substring(4, 6),
    a.substring(6, 8)
  );
  const bDate = new Date(
    b.substring(0, 4),
    b.substring(4, 6),
    b.substring(6, 8)
  );
  return Math.abs(aDate - bDate) / MS_DAY;
}

function getBinDeathIndex(data, timestamp_of_death) {
  const withDiff = data.map((d, i) => ({
    diff: getDiff(d.timestamp, timestamp_of_death),
    i
  }));
  withDiff.sort((a, b) => d3.ascending(a.diff, b.diff));

  return withDiff.shift().i;
}

function createBinData({ person, days }) {
  const id = person.link.replace('/wiki/', '');
  const personPageviewData = d3.csvParse(
    fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8')
  );

  const exactDeathIndex = personPageviewData.findIndex(
    d => d.timestamp === `${person.timestamp_of_death}`
  );

  const rem = exactDeathIndex % days;
  const offset = -rem;

  const withBin = personPageviewData.map(d => ({
    ...d,
    bin: Math.floor((+d.timestamp_index + offset) / days)
  }));

  const nested = d3
    .nest()
    .key(d => d.bin)
    .rollup(values => {
      const views = d3.sum(values, v => +v.views);
      const views_adjusted = d3.sum(values, v => +v.views_adjusted);
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
        views_adjusted,
        share,
        bin,
        timestamp,
        timestamp_index,
        count
      };
    })
    .entries(withBin);

  const flat = nested.map(d => d.value).filter(d => d.count === days);

  // add binned death index
  const binDeathIndex = getBinDeathIndex(flat, person.timestamp_of_death);

  const withDeathIndex = flat.map((d, i) => ({
    ...d,
    bin_death_index: i - binDeathIndex
  }));

  const output = d3.csvFormat(withDeathIndex);
  fs.writeFileSync(`${outputDir}-${days}/${id}.csv`, output);
}

function init() {
  mkdirp(`${outputDir}-1`);
  mkdirp(`${outputDir}-2`);
  mkdirp(`${outputDir}-3`);
  mkdirp(`${outputDir}-7`);

  const data = d3.csvParse(
    fs.readFileSync('./output/people--all-deaths.csv', 'utf-8')
  );

  data.forEach((person, i) => {
    console.log(`${i} of ${data.length}`);
    createBinData({ person, days: 1 });
    createBinData({ person, days: 2 });
    createBinData({ person, days: 3 });
    createBinData({ person, days: 7 });
  });
}

init();
