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

  const timestampOfDeath = +`${person.timestamp_of_death}00`;
  const withCalc = data
    .map((d, i) => ({ diff: +d.timestamp - timestampOfDeath, i }))
    .filter(d => d.diff >= 0);
  withCalc.sort((a, b) => d3.descending(a.diff, b.diff));

  if (withCalc.length) {
    const weekOfDeathIndex = withCalc.pop().i;
    const output = data.map(
      ({ week, timestamp, timestamp_index, views, percent_traffic }) => ({
        week,
        timestamp_index,
        week_death_index: week - weekOfDeathIndex,
        pageid,
        timestamp: timestamp.substring(0, 8),
        views,
        percent_traffic: (+percent_traffic).toFixed(8)
      })
    );
    return output;
  }
  return [];
}

function getPageviews(person) {
  const id = getID(person.link);
  const { pageid, median_views_before, median_percent_traffic_before } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-joined/${id}.csv`, 'utf-8')
  );

  const deathIndex = data.findIndex(
    d => d.timestamp === `${person.timestamp_of_death}00`
  );

  const output = data.map(
    ({ timestamp, timestamp_index, views, percent_traffic }) => ({
      timestamp_index,
      death_index: timestamp_index - deathIndex,
      pageid,
      timestamp: timestamp.substring(0, 8),
      views,
      percent_traffic: (+percent_traffic).toFixed(8),
      change_baseline_views: +views / median_views_before,
      change_basline_percent_traffic:
        +percent_traffic / median_percent_traffic_before
    })
  );

  return output;
}

function init() {
  mkdirp(outputDir);

  const dataAll = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  const population = d3.csvParse(
    fs.readFileSync('./output/details.csv', 'utf-8')
  );

  const populationLinks = population.map(d => d.link);

  // people
  const dataAllFiltered = dataAll.filter(d => populationLinks.includes(d.link));

  const peopleData = dataAllFiltered.map(d => ({
    ...d,
    ...population.find(p => p.link === d.link)
  }));

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
