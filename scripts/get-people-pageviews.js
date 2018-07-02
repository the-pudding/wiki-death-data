const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');
const outputDir = './output/people-pageviews';

function getEnd() {
  const d = new Date();
  const year = d.getFullYear();
  const month = d3.format('02')(d.getMonth() + 1);
  const date = d3.format('02')(d.getDate());
  return `${year}${month}${date}`;
}

function query(person) {
  return new Promise((resolve, reject) => {
    const id = person.link.replace('/wiki/', '');
    pageviews
      .getPerArticlePageviews({
        project: 'en.wikipedia',
        agent: 'user',
        granularity: 'daily',
        start: '20150701',
        end: getEnd(),
        article: person.name
      })
      .then(result => {
        const output = d3.csvFormat(result.items);
        fs.writeFileSync(`${outputDir}/${id}.csv`, output);
        resolve();
      })
      .catch(reject);
  });
}

async function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  // keep index just for progress monitoring
  let i = 0;
  for (const item of data) {
    await query(item)
      .then(() => console.log(`${i} of ${data.length}`))
      .catch(console.error);
    i += 1;
  }
}

init();
