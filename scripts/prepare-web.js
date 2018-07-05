const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './web-data';
const MS_DAY = 86400000;

function getID(str) {
  return str.replace('/wiki/', '');
}

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

function getPageviewsByBin({ person, days }) {
  const id = getID(person.link);
  const { pageid } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-bin-${days}/${id}.csv`, 'utf-8')
  );

  const withCalc = data.map((d, i) => ({
    diff: getDiff(d.timestamp, person.timestamp_of_death),
    i
  }));
  withCalc.sort((a, b) => d3.ascending(a.diff, b.diff));

  const binOfDeathIndex = +withCalc[0].i;

  const output = data.map(
    ({ bin, timestamp, timestamp_index, views, share }, i) => ({
      bin,
      timestamp_index,
      bin_death_index: i - binOfDeathIndex,
      pageid,
      timestamp: timestamp.substring(0, 8),
      views,
      share: (+share).toFixed(8)
    })
  );
  return output;
}

function getPageviews(person) {
  const id = getID(person.link);
  const { pageid, median_views_before, median_share_before } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8')
  );

  const deathIndex = data.findIndex(
    d => d.timestamp === `${person.timestamp_of_death}`
  );

  const output = data.map(({ timestamp, timestamp_index, views, share }) => ({
    timestamp_index,
    death_index: timestamp_index - deathIndex,
    pageid,
    timestamp: timestamp.substring(0, 8),
    views,
    share: (+share).toFixed(8),
    change_before_share: +share / median_share_before
  }));

  return output;
}

function init() {
  mkdirp(outputDir);

  // people
  const peopleData = d3.csvParse(
    fs.readFileSync('./output/people--details.csv', 'utf-8')
  );

  const peopleOutput = d3.csvFormat(peopleData);
  fs.writeFileSync('./web-data/people.csv', peopleOutput);

  // pageviews
  const pageviewData = [].concat(...peopleData.map(getPageviews));

  const pageviewOutput = d3.csvFormat(pageviewData);
  fs.writeFileSync('./web-data/pageviews.csv', pageviewOutput);

  // by week pageviews
  const bin7PageviewData = [].concat(
    ...peopleData.map(person => getPageviewsByBin({ person, days: 7 }))
  );

  const bin7PageviewOutput = d3.csvFormat(bin7PageviewData);
  fs.writeFileSync('./web-data/pageviews-bin-7.csv', bin7PageviewOutput);

  // by 48hrs pageviews
  const bin2PageviewData = [].concat(
    ...peopleData.map(person => getPageviewsByBin({ person, days: 2 }))
  );

  const bin2PageviewOutput = d3.csvFormat(bin2PageviewData);
  fs.writeFileSync('./web-data/pageviews-bin-2.csv', bin2PageviewOutput);
}

init();
