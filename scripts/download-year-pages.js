const fs = require('fs');
const mkdirp = require('mkdirp');
const wiki = require('wikijs').default;

const years = ['2015', '2016', '2017', '2018'];
const outputDir = './output/year-pages';

function download(year) {
  wiki()
    .page(year)
    .then(page => page.html())
    .then(response => {
      fs.writeFileSync(`${outputDir}/${year}.html`, response);
    });
}

mkdirp(outputDir);
years.forEach(download);
