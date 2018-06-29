const fs = require('fs');
const mkdirp = require('mkdirp');
const cheerio = require('cheerio');
const d3 = require('d3');

const START = { month: 6, year: 2015 };
const inputDir = './output/year-pages';
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function checkForDate(str) {
  const split = str.split(' ');
  const isMonth = months.includes(split[0]);
  const isDate = !isNaN(split[1]);
  return isMonth && isDate;
}

function parseLi({ sel, year }) {
  const isPerson = !sel.find('ul').length;

  if (isPerson) {
    const a = sel.find('a');

    const firstA = a.first();
    const firstTitle = firstA.attr('title');
    const isDate = checkForDate(firstTitle);
    const name = isDate ? a.eq(1).attr('title') : firstTitle;
    const link = isDate ? a.eq(1).attr('href') : firstA.attr('href');

    // birth year
    const birthSel = a.eq(-1);
    const year_of_birth = birthSel.attr('title');

    // date of death
    let date_of_death = null;
    if (isDate) {
      date_of_death = a.eq(0).attr('title');
    } else {
      const parentLi = sel.parent().parent();
      date_of_death = parentLi
        .find('a')
        .first()
        .attr('title');
    }

    // description
    const text = sel.text();
    const sentence = isDate ? text.replace(`${date_of_death} – `, '') : text;

    const withoutName = sentence.replace(`${name}, `, '');
    const bIndex = withoutName.lastIndexOf(' (b.');

    const description = withoutName.substring(0, bIndex);

    const year_of_death = year;
    return {
      name,
      link,
      year_of_birth,
      year_of_death,
      date_of_death,
      description
    };
  }

  return null;
}

function checkValidStart(year, monthIndex) {
  if (+year === START.year && monthIndex < START.month) return false;
  return true;
}

function extractPeople(file) {
  const html = fs.readFileSync(`${inputDir}/${file}`, 'utf-8');
  const $ = cheerio.load(html);

  const peopleByMonth = months.map((month, monthIndex) => {
    const parent = $(`#${month}_2`).parent();
    const ul = parent.nextAll('ul').eq(0);
    const year = file.replace('.html', '');

    const output = [];
    ul.find('li').each((i, el) => {
      const person = parseLi({ sel: $(el), year });
      if (person && checkValidStart(year, monthIndex)) output.push(person);
    });
    return output;
  });

  return [].concat(...peopleByMonth);
}

function init() {
  const files = fs.readdirSync(inputDir).filter(d => d.includes('.html'));

  const peopleByYear = files.map(extractPeople);
  const flatPeople = [].concat(...peopleByYear);

  const output = d3.csvFormat(flatPeople);

  mkdirp('./output');
  fs.writeFileSync('./output/all-deaths-2015-2018.csv', output);
}

init();
