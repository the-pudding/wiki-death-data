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

function getMedianSides({ person, data, metric }) {
  const { year_of_death, date_of_death } = person;
  const deathDate = new Date(`${date_of_death} ${year_of_death}`);

  const before = data.filter(d => {
    const date = convertTimestampToDate(d.timestamp);
    return date < deathDate;
  });

  const after = data.filter(d => {
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

  const bin2Data = clean(
    d3.csvParse(fs.readFileSync(`./output/people-bin-2/${id}.csv`, 'utf-8'))
  );

  const bin7Data = clean(
    d3.csvParse(fs.readFileSync(`./output/people-bin-7/${id}.csv`, 'utf-8'))
  );

  // daily
  const median_views = d3.median(dailyData, d => d.views);
  const median_share = d3.median(dailyData, d => d.share);
  const max_views = d3.max(dailyData, d => d.views);
  const max_share = d3.max(dailyData, d => d.share);
  const medianViewsObj = getMedianSides({
    person,
    data: dailyData,
    metric: 'views'
  });
  const medianShareObj = getMedianSides({
    person,
    data: dailyData,
    metric: 'share'
  });

  const max_change_before_views = max_views / medianViewsObj.medianBefore;

  const max_change_before_share = max_share / medianShareObj.medianBefore;

  // bin 2
  const median_views_bin2 = d3.median(bin2Data, d => d.views);
  const median_share_bin2 = d3.median(bin2Data, d => d.share);
  const max_views_bin2 = d3.max(bin2Data, d => d.views);
  const max_share_bin2 = d3.max(bin2Data, d => d.share);
  const medianViewsObj_bin2 = getMedianSides({
    person,
    data: bin2Data,
    metric: 'views'
  });
  const medianShareObj_bin2 = getMedianSides({
    person,
    data: bin2Data,
    metric: 'share'
  });

  const max_change_before_views_bin2 =
    max_views_bin2 / medianViewsObj_bin2.medianBefore;

  const max_change_before_share_bin2 =
    max_share_bin2 / medianShareObj_bin2.medianBefore;

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
    max_change_before_share,
    median_views_bin2,
    median_views_before_bin2: medianViewsObj_bin2.medianBefore,
    median_views_after_bin2: medianViewsObj_bin2.medianAfter,
    median_share_bin2,
    median_share_before_bin2: medianShareObj_bin2.medianBefore,
    median_share_after_bin2: medianShareObj_bin2.medianAfter,
    max_views_bin2,
    max_share_bin2,
    max_change_before_views_bin2,
    max_change_before_share_bin2
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
