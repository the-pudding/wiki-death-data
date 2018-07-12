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
    share: d.share.length ? +d.share : null
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

function getMedianSides({ person, data, metric }) {
  const { year_of_death, date_of_death } = person;
  const deathDate = new Date(`${date_of_death} ${year_of_death}`);

  const before = getSide({ data, deathDate, before: true });
  const after = getSide({ data, deathDate, before: false });

  const medianBefore = d3.median(before, d => d[metric]);
  const medianAfter = d3.median(after, d => d[metric]);
  return { medianBefore, medianAfter };
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

function calculate(person) {
  const id = person.link.replace('/wiki/', '');
  const file =
    BIN > 1
      ? `./output/people-bin-${BIN}/${id}.csv`
      : `./output/people-pageviews/${id}.csv`;

  const data = clean(d3.csvParse(fs.readFileSync(file, 'utf-8')));

  const median_views = Math.floor(d3.median(data, d => d.views));
  const median_views_adjusted = Math.floor(
    d3.median(data, d => d.views_adjusted)
  );
  const median_share = Math.floor(d3.median(data, d => d.share));

  const max_views = d3.max(data, d => d.views);
  const max_views_adjusted = d3.max(data, d => d.views_adjusted);
  const max_share = d3.max(data, d => d.share);

  const medianViewsObj = getMedianSides({
    person,
    data,
    metric: 'views'
  });
  const medianViewsAdjustedObj = getMedianSides({
    person,
    data,
    metric: 'views_adjusted'
  });
  const medianShareObj = getMedianSides({
    person,
    data,
    metric: 'share'
  });

  const max_change_before_views = Math.floor(
    max_views / medianViewsObj.medianBefore
  );
  const max_change_before_views_adjusted = Math.floor(
    max_views_adjusted / medianViewsAdjustedObj.medianBefore
  );
  const max_change_before_share = Math.floor(
    max_share / medianShareObj.medianBefore
  );

  const withViews = data.filter(d => d.views_adjusted);
  const { std, iqr } = getDistribution({ person, data: withViews });

  return {
    ...person,
    bin: BIN,
    median_views,
    median_views_before: Math.floor(medianViewsObj.medianBefore),
    median_views_after: Math.floor(medianViewsObj.medianAfter),
    median_views_adjusted,
    median_views_adjusted_before: Math.floor(
      medianViewsAdjustedObj.medianBefore
    ),
    median_views_adjusted_after: Math.floor(medianViewsAdjustedObj.medianAfter),
    median_share,
    median_share_before: Math.floor(medianShareObj.medianBefore),
    median_share_after: Math.floor(medianShareObj.medianAfter),
    max_views_adjusted,
    max_views,
    max_share,
    max_change_before_views,
    max_change_before_views_adjusted,
    max_change_before_share,
    std,
    iqr
  };
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
