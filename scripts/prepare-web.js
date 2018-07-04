const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './web-data';

function getID(str) {
  return str.replace('/wiki/', '');
}

function getPageviewsByWeek(person) {
  const id = getID(person.link);
  const { pageid } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-by-week/${id}.csv`, 'utf-8')
  );

  const timestampOfDeath = +`${person.timestamp_of_death}`;
  const withCalc = data
    .map((d, i) => ({ diff: +d.timestamp - timestampOfDeath, i }))
    .filter(d => d.diff >= 0);
  withCalc.sort((a, b) => d3.descending(a.diff, b.diff));

  const weekOfDeathIndex = withCalc.pop().i;
  const output = data.map(
    ({ week, timestamp, timestamp_index, views, share }) => ({
      week,
      timestamp_index,
      week_death_index: week - weekOfDeathIndex,
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
    share: (+share).toFixed(8)
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
