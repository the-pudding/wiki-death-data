const fs = require('fs');
const mkdirp = require('mkdirp');
const d3 = require('d3');
const request = require('request');
const outputDir = './output';
const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

function downloadSheet({ id, gid }) {
  return new Promise((resolve, reject) => {
    const base = 'https://docs.google.com/spreadsheets/u/1/d';
    const url = `${base}/${id}/export?format=csv&id=${id}&gid=${gid}`;

    request(url, (err, response, body) => {
      if (err) reject(err);
      const data = d3.csvParse(body);
      resolve(data);
    });
  });
}

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
        const { pageid, thumbnail, description, extract } = data;
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
          extract: extract.replace(/\n/g, '')
        });
      } else reject(resp.statusCode);
    });
  });
}

function getInfo({ d, sheetData }) {
  const match = sheetData.find(s => s.canonical === d.canonical);
  if (!match) return {};
  return {
    industry: match.industry,
    cause: match.cause_broad,
    cause_specific: match.cause_specific,
    description_short: match.description_short,
    impact_annotation: match.impact_annotation,
    perspective_show: match.perspective_show,
    display: !!match.display ? match.display : d.display
  };
}

async function begin(sheetData) {
  const peopleData = d3.csvParse(
    fs.readFileSync('./output/people--filtered.csv', 'utf-8')
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

  const detailsWithSheet = withDetails.map(d => {
    const info = getInfo({ d, sheetData });
    return {
      ...d,
      ...info
    };
  });

  const output = d3.csvFormat(detailsWithSheet);
  fs.writeFileSync('./output/people--details.csv', output);
}

function init() {
  mkdirp(outputDir);

  downloadSheet({
    id: '1NhyrhMg-Pgl-1_TkGSKQ9QtfSjFRb0BvvcF1rB6Xkok',
    gid: '1675841094'
  })
    .then(begin)
    .catch(console.error);
}

init();
