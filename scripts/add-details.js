const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const request = require('request');
const outputDir = './output';
const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

function getID(str) {
  return str.replace('/wiki/', '');
}

function getDetails(person) {
  return new Promise((resolve, reject) => {
    const id = getID(person.link);
    const url = `${BASE_URL}/${id}`;
    request(url, (err, resp, body) => {
      if (err) reject(err);
      else if (resp.statusCode === 200) {
        const data = JSON.parse(body);
        const { pageid, thumbnail, description, extract_html } = data;
        const { canonical, display } = data.titles;

        const thumbnail_source = thumbnail ? thumbnail.source : null;
        const thumbnail_width = thumbnail ? thumbnail.width : null;
        const thumbnail_height = thumbnail ? thumbnail.height : null;

        resolve({
          ...person,
          pageid,
          description,
          canonical,
          display,
          thumbnail_source,
          thumbnail_width,
          thumbnail_height,
          extract_html: extract_html.replace(/\n/g, '')
        });
      } else reject(resp.statusCode);
    });
  });
}

async function init() {
  mkdirp(outputDir);

  const peopleData = d3.csvParse(
    fs.readFileSync('./output/filtered.csv', 'utf-8')
  );

  const withDetails = [];

  let index = 0;
  for (person of peopleData) {
    console.log(`${index + 1} of ${peopleData.length}: ${person.link}`);
    await getDetails(person)
      .then(response => {
        withDetails.push(response);
      })
      .catch(err => {
        console.log(err);
        withDetails.push(person);
      });
    index += 1;
  }

  const output = d3.csvFormat(withDetails);
  fs.writeFileSync('./output/details.csv', output);
}

init();
