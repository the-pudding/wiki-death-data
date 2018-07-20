const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const movingAverages = require('moving-averages');
const outputDir = './web-data';
const MS_DAY = 86400000;
const INF = 99999;
const MA_PERIOD = 7;
const PRINCE_ID = '57317';

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

function zeroPad(number) {
  return d3.format('02')(number);
}
function init() {
  mkdirp(outputDir);

  const date = new Date();
  const last_updated = `${date.getFullYear()}${zeroPad(
    date.getMonth() + 1
  )}${zeroPad(date.getDate() - 1)}`;
  // people
  const peopleData = d3
    .csvParse(fs.readFileSync('./output/people--details.csv', 'utf-8'))
    .map(d => ({
      ...d,
      last_updated
    }));

  const peopleOutput = d3.csvFormat(peopleData);
  fs.writeFileSync('./web-data/people.csv', peopleOutput);

  // by 48hrs pageviews (perspective chart)
  const perspectiveData = [].concat(
    ...peopleData.map(person => {
      const start = person.pageid === PRINCE_ID ? -50 : 0;
      const v = getPageviewsByBin({ person, bin: 2, start, end: 0 });
      return v;
    })
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

  // after moving average (impact chart)
  const impactData = []
    .concat(
      ...peopleData.map(person => {
        const after = getPageviewsByBin({
          person,
          bin: 1,
          start: 23,
          end: INF
        });

        const afterVals = after.map(d => +d.views_adjusted);
        const maa = movingAverages.ma(afterVals, MA_PERIOD);

        const afterWithM = after.map((d, i) => ({
          ...d,
          median_before: +person.median_views_adjusted_bd_1,
          ma: maa[i],
          views_adjusted: +afterVals[i]
        }));

        return afterWithM;
      })
    )
    .filter(d => +d.bin_death_index <= 120 && +d.bin_death_index >= 30)
    .map(d => ({
      ...d,
      ma: d.ma ? Math.floor(d.ma) : null
    }))
    .map(d => {
      return {
        pageid: d.pageid,
        bin_death_index: d.bin_death_index,
        ma: d.ma,
        diff: d.ma - d.median_before,
        diff_percent: ((d.ma - d.median_before) / d.median_before).toFixed(2),
        diff_views: d.views_adjusted - d.median_before,
        diff_percent_views: (
          (d.views_adjusted - d.median_before) /
          d.median_before
        ).toFixed(2)
      };
    });

  const impactOutput = d3.csvFormat(impactData);
  fs.writeFileSync('./web-data/impact.csv', impactOutput);
}

init();
