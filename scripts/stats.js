const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output';

function clean(data) {
  return data.map(d => ({
    ...d,
    views: d.views.length ? +d.views : null,
    share: d.share.length ? +d.share : null
  }));
}

function convertTimestampToDate(timestamp) {
  const year = timestamp.substring(0, 4);
  const month = +timestamp.substring(4, 6) - 1;
  const date = timestamp.substring(6, 8);
  return new Date(year, month, date);
}

function getMedianSides({ person, dailyData, metric }) {
  const { year_of_death, date_of_death } = person;
  const deathDate = new Date(`${date_of_death} ${year_of_death}`);

  const before = dailyData.filter(d => {
    const date = convertTimestampToDate(d.timestamp);
    return date < deathDate;
  });
  // console.log(before);
  const after = dailyData.filter(d => {
    const date = convertTimestampToDate(d.timestamp);
    return date > deathDate;
  });
  const medianBefore = d3.median(before, d => d[metric]);
  const medianAfter = d3.median(after, d => d[metric]);
  return { medianBefore, medianAfter };
}

function calculate(person) {
  const id = person.link.replace('/wiki/', '');
  const dailyData = clean(
    d3.csvParse(fs.readFileSync(`./output/people-pageviews/${id}.csv`, 'utf-8'))
  );

  const median_views = d3.median(dailyData, d => d.views);
  const median_share = d3.median(dailyData, d => d.share);
  const max_views = d3.max(dailyData, d => d.views);
  const max_share = d3.max(dailyData, d => d.share);
  const medianViewsObj = getMedianSides({
    person,
    dailyData,
    metric: 'views'
  });
  const medianShareObj = getMedianSides({
    person,
    dailyData,
    metric: 'share'
  });

  const max_change_before_views = max_views / medianViewsObj.medianBefore;

  const max_change_before_share = max_share / medianShareObj.medianBefore;

  return {
    ...person,
    median_views,
    median_views_before: medianViewsObj.medianBefore,
    median_views_after: medianViewsObj.medianAfter,
    median_share,
    median_share_before: medianShareObj.medianBefore,
    median_share_after: medianShareObj.medianAfter,
    max_views,
    max_share,
    max_change_before_views,
    max_change_before_share
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
