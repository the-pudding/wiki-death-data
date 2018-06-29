const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './web-data';

function getID(str) {
  return str.replace('/wiki/', '');
}

function getPageviews(person) {
  const id = getID(person.link);
  const { pageid } = person;
  const data = d3.csvParse(
    fs.readFileSync(`./output/people-joined/${id}.csv`, 'utf-8')
  );

  const output = data.map(({ timestamp, views, percent_traffic }) => ({
    pageid,
    timestamp: timestamp.substring(0, 8),
    views,
    percent_traffic: (+percent_traffic).toFixed(8)
  }));

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
}

init();
