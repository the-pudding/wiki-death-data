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

function getPageviewsByWeek(person) {
  const id = getID(person.link);
  const { pageid } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-by-week/${id}.csv`, 'utf-8')
  );

  const withCalc = data.map((d, i) => ({
    diff: getDiff(d.timestamp, person.timestamp_of_death),
    i
  }));
  withCalc.sort((a, b) => d3.ascending(a.diff, b.diff));

  if (['/wiki/Carrie_Fisher', '/wiki/Chester_Bennington'].includes(person.link))
    console.log(withCalc.slice(0, 4));

  const weekOfDeathIndex = +withCalc[0].i;

  const output = data.map(
    ({ week, timestamp, timestamp_index, views, share }, i) => ({
      week,
      timestamp_index,
      week_death_index: i - weekOfDeathIndex,
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
  const byWeekPageviewData = [].concat(...peopleData.map(getPageviewsByWeek));

  const byWeekPageviewOutput = d3.csvFormat(byWeekPageviewData);
  fs.writeFileSync('./web-data/pageviews-by-week.csv', byWeekPageviewOutput);
}

init();
