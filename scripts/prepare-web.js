const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const movingAverages = require('moving-averages');
const outputDir = './web-data';
const MS_DAY = 86400000;
const INF = 99999;
const MA_PERIOD = 7;

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
      const after = getPageviewsByBin({ person, bin: 1, start: 2, end: INF });

      const match = after.find(
        d =>
          +d.views_adjusted <
          +person.mean_views_adjusted_bd_1 + +person.std_1 * 2
      );
      const cross = match ? +match.bin_death_index : INF;
      const filtered = after.filter(d => +d.bin_death_index <= cross);
      return filtered;
    })
  );

  const careOutput = d3.csvFormat(careData);
  fs.writeFileSync('./web-data/care.csv', careOutput);

  // before/after moving average (impact chart)
  const impactData = []
    .concat(
      ...peopleData.map(person => {
        const before = getPageviewsByBin({
          person,
          bin: 1,
          start: -INF,
          end: -1
        });
        const after = getPageviewsByBin({ person, bin: 1, start: 7, end: INF });

        const beforeN = before.map(d => +d.views_adjusted);
        const afterN = after.map(d => +d.views_adjusted);
        const mab = movingAverages.ma(beforeN, MA_PERIOD);
        const maa = movingAverages.ma(afterN, MA_PERIOD);

        const beforeWithM = before.map((d, i) => ({
          ...d,
          ma: mab[i],
          before: true
        }));

        const afterWithM = after.map((d, i) => ({
          ...d,
          ma: maa[i],
          before: false
        }));

        const joined = beforeWithM.concat(afterWithM);

        return joined;
      })
    )
    .filter(d => Math.abs(d.bin_death_index) < 100)
    .map(d => ({
      pageid: d.pageid,
      bin_death_index: d.bin_death_index,
      ma: d.ma ? Math.floor(d.ma) : null,
      before: d.before ? 1 : null
    }));

  const impactOutput = d3.csvFormat(impactData);
  fs.writeFileSync('./web-data/impact.csv', impactOutput);
}

init();
