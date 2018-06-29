const margin = { top: 10, right: 30, bottom: 30, left: 60 };
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

function setupChart(data) {
  const [peopleData, pageviewData] = data;

  const joinedData = peopleData.map(d => ({
    ...d,
    pageviews: pageviewData.filter(p => p.pageid === d.pageid)
  }));

  const $person = d3
    .select('main')
    .selectAll('.person')
    .data(joinedData)
    .enter()
    .append('div')
    .attr('class', 'person');

  $person
    .append('p')
    .attr('class', 'name')
    .text(d => d.display);

  const $svg = $person.append('svg');

  $svg
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const $g = $svg.append('g');

  $g.attr('transform', `translate(${margin.left}, ${margin.top})`);

  const $axisX = $g.append('g').attr('class', 'g-axis axis--x');
  const $axisY = $g.append('g').attr('class', 'g-axis axis--y');
  const $vis = $g.append('g').attr('class', 'g-vis');
  const $path = $vis.append('path').attr('class', 'pageviews');

  const scaleX = d3
    .scaleTime()
    .domain(d3.extent(pageviewData, d => d.date))
    .range([0, width]);

  const scaleY = d3
    .scaleLinear()
    .domain([0, d3.max(peopleData, d => d.max_views)])
    .range([height, 0]);

  const line = d3
    .line()
    .x(d => scaleX(d.date))
    .y(d => scaleY(d.views))
    .defined(d => d.date);

  $path.datum(d => d.pageviews).attr('d', line);

  // $vis
  //   .selectAll('circle')
  //   .data(pageviews)
  //   .enter()
  //   .append('circle')
  //   .attr('cx', d => scaleX(d.date))
  //   .attr('cy', d => scaleY(d.views))
  //   .attr('r', 2);

  const axisY = d3.axisLeft(scaleY);
  $axisY.call(axisY);

  const axisX = d3.axisBottom(scaleX);
  $axisX.call(axisX).attr('transform', `translate(0, ${height})`);
}

function convertTimestampToDate(timestamp) {
  const year = timestamp.substring(0, 4);
  const month = +timestamp.substring(4, 6) - 1;
  const date = timestamp.substring(6, 8);
  return new Date(year, month, date);
}

function loadPeopleData() {
  return new Promise((resolve, reject) => {
    d3.csv('data/people.csv', d => ({
      ...d,
      max_views: +d.max_views,
      max_percent_traffic: +d.max_percent_traffic,
      thumbnail_width: +d.thumbnail_width,
      thumbnail_height: +d.thumbnail_height,
      year_of_birth: +d.year_of_birth,
      year_of_death: +d.year_of_death
    }))
      .then(resolve)
      .catch(reject);
  });
}

function loadPageviewsData() {
  return new Promise((resolve, reject) => {
    d3.csv('data/pageviews.csv', d => ({
      ...d,
      date: convertTimestampToDate(d.timestamp),
      views: +d.views,
      percent_traffic: +d.percent_traffic
    }))
      .then(resolve)
      .catch(reject);
  });
}

function init() {
  const p = [loadPeopleData(), loadPageviewsData()];
  Promise.all(p)
    .then(setupChart)
    .catch(console.error);
}

init();
