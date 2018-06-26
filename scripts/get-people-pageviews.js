const fs = require('fs');
const mkdirp = require('mkdirp');
const pageviews = require('pageviews');
const d3 = require('d3');
const outputDir = './output/people-pageviews';

function query(person, cb) {
  const id = person.link.replace('/wiki/', '');
  pageviews
    .getPerArticlePageviews({
      project: 'en.wikipedia',
      agent: 'user',
      granularity: 'daily',
      start: '20150701',
      end: '20180626',
      article: person.name
    })
    .then(result => {
      const output = d3.csvFormat(result.items);
      fs.writeFileSync(`${outputDir}/${id}.csv`, output);
      cb();
    })
    .catch(err => {
      console.error(err);
      cb();
    });
}

function init() {
  mkdirp(outputDir);

  const data = d3.csvParse(
    fs.readFileSync('./output/all-deaths-2015-2018.csv', 'utf-8')
  );

  let i = 0;
  let end = data.length;

  const next = () => {
    console.log(`${i} of ${end}`);
    query(data[i], () => {
      i += 1;
      if (i < end) next();
      else console.log('done');
    });
  };

  next();
}

init();
