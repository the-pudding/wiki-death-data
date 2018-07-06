const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const outputDir = './output';

const START = { month: 6, year: 2015 };
const MS_DAY = 86400000;
const MIN_DAYS_PAD = 30;

function clean(data) {
  return data.map(d => ({
    ...d,
    max_share: +d.max_share
  }));
}

function init() {
  mkdirp(outputDir);

  const data = clean(
    d3.csvParse(fs.readFileSync('./output/people--stats.csv', 'utf-8'))
  );

  // filter by share (must have hit 0.1% of total wiki traffic)
  // filter by share (must have median before of at least 0.0001%)
  // filter by date (must be at least 30 days from edges)
  const filtered = data
    .filter(d => d.max_share_bin2 >= 0.001)
    .filter(d => d.median_share_before_bin2 >= 0.000001)
    .filter(d => {
      const dateStart = new Date(START.year, START.month, 1);
      const dateEnd = new Date();
      const dateDeath = new Date(`${d.date_of_death} ${d.year_of_death}`);
      const diffStart = (dateDeath - dateStart) / MS_DAY;
      const diffEnd = (dateEnd - dateDeath) / MS_DAY;
      return diffStart >= MIN_DAYS_PAD && diffEnd >= MIN_DAYS_PAD;
    });
  const output = d3.csvFormat(filtered);
  fs.writeFileSync('./output/people--filtered.csv', output);
}

init();
