const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './web-data';
const MS_DAY = 86400000;

function getID(str) {
  return str.replace('/wiki/', '');
}

function getPageviewsByBin({ person, bin, start, end }) {
  const id = getID(person.link);

  const data = d3.csvParse(
    fs.readFileSync(`./output/people-bin-${bin}/${id}.csv`, 'utf-8')
  );

  const output = data
    .filter(d => +d.bin_death_index >= start && +d.bin_death_index <= end)
    .map(d => ({
      pageid: person.pageid,
      bin: d.bin,
      timestamp_index: d.timestamp,
      bin_death_index: d.bin_death_index,
      timestamp: d.timestamp,
      views: d.views,
      views_adjusted: d.views_adjusted
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

  // by 48hrs pageviews (perspective chart)
  const perspectiveData = [].concat(
    ...peopleData.map(person =>
      getPageviewsByBin({ person, bin: 2, start: -50, end: 0 })
    )
  );

  const perspectiveOutput = d3.csvFormat(perspectiveData);
  fs.writeFileSync('./web-data/perspective.csv', perspectiveOutput);

  // daily pageviews until < 2 std (eventually bin by week) (care chart)
  // start looking at 48hrs after
  const careData = [].concat(
    ...peopleData.map(person => {
      const after = getPageviewsByBin({ person, bin: 1, start: 2, end: 9999 });

      const match = after.find(
        d =>
          +d.views_adjusted <
          +person.mean_views_adjusted_bd_1 + +person.std_1 * 2
      );
      const cross = match ? +match.bin_death_index : 9999;
      const filtered = after.filter(d => +d.bin_death_index <= cross);
      return filtered;
    })
  );

  const careOutput = d3.csvFormat(careData);
  fs.writeFileSync('./web-data/care.csv', careOutput);
}

init();
