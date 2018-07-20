const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const ss = require('simple-statistics');
const outputDir = './output';

const BIN = 2;

function clean(data) {
  return data.map(d => ({
    ...d,
    views: d.views.length ? +d.views : null,
    views_adjusted: d.views_adjusted.length ? +d.views_adjusted : null,
    share: d.share.length ? +d.share : null,
    bin_death_index: +d.bin_death_index
  }));
}

function convertTimestampToDate(timestamp) {
  const year = timestamp.substring(0, 4);
  const month = +timestamp.substring(4, 6) - 1;
  const date = timestamp.substring(6, 8);
  return new Date(year, month, date);
}

function getSide({ data, before, deathDate }) {
  return data.filter(d => {
    const date = convertTimestampToDate(d.timestamp);
    return before ? date < deathDate : date > deathDate;
  });
}

function getAverageSides({ person, data, metric, mode }) {
  const { year_of_death, date_of_death } = person;
  const deathDate = new Date(`${date_of_death} ${year_of_death}`);

  const before = getSide({ data, deathDate, before: true });
  const after = getSide({ data, deathDate, before: false });
  const vBefore = before.map(d => d[metric]);
  const vAfter = after.map(d => d[metric]);
  const mBefore = mode === 'median' ? d3.median(vBefore) : d3.mean(vBefore);
  const mAfter = mode === 'median' ? d3.median(vAfter) : d3.mean(vAfter);
  return { mBefore, mAfter };
}

function getDistribution({ person, data }) {
  const { year_of_death, date_of_death } = person;
  const deathDate = new Date(`${date_of_death} ${year_of_death}`);

  const before = getSide({ data, deathDate, before: true });
  const vals = before.map(d => d.views_adjusted);
  if (before.length) {
    const std = ss.standardDeviation(vals);
    const iqr = ss.interquartileRange(vals);
    return { std, iqr };
  }

  return {};
}

function addInfo({ data, bin, person }) {
  const withViews = data.filter(d => d.views_adjusted);
  const di = data.find(d => d.bin_death_index === 0);
  const death_views = di.views;
  const death_views_adjusted = di.views_adjusted;
  const medianViewsAdjustedObj = getAverageSides({
    person,
    data: withViews,
    metric: 'views_adjusted',
    mode: 'median'
  });
  const meanViewsAdjustedObj = getAverageSides({
    person,
    data: withViews,
    metric: 'views_adjusted',
    mode: 'mean'
  });

  const { std, iqr } = getDistribution({ person, data: withViews });

  const output = {};
  output[`median_views_adjusted_bd_${bin}`] = medianViewsAdjustedObj.mBefore;
  output[`median_views_adjusted_ad_${bin}`] = medianViewsAdjustedObj.mAfter;
  output[`mean_views_adjusted_bd_${bin}`] = meanViewsAdjustedObj.mBefore;
  output[`death_views_${bin}`] = death_views;
  output[`death_views_adjusted_${bin}`] = death_views_adjusted;
  output[`std_${bin}`] = std;
  output[`iqr_${bin}`] = iqr;

  return output;
}

function loadData({ bin, person }) {
  const id = person.link.replace('/wiki/', '');
  const file = `./output/people-bin-${bin}/${id}.csv`;
  return {
    data: clean(d3.csvParse(fs.readFileSync(file, 'utf-8'))),
    bin,
    person
  };
}

function calculate(person) {
  const bins = [1, 2, 3, 7].map(bin => loadData({ bin, person }));
  const withInfo = bins.map(addInfo).reduce(
    (prev, cur) => {
      return {
        ...prev,
        ...cur
      };
    },
    { ...person }
  );
  return withInfo;
}

function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/people--all-deaths.csv', 'utf-8')
  );

  const withAverages = data.map(calculate);
  const output = d3.csvFormat(withAverages);

  fs.writeFileSync('./output/people--stats.csv', output);
}

init();
