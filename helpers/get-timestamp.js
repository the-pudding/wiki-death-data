const d3 = require('d3');

module.exports = function getTodayTimestamp({
  date = new Date(),
  suffix = ''
}) {
  const year = date.getFullYear();
  const month = d3.format('02')(date.getMonth() + 1);
  const day = d3.format('02')(date.getDate());
  return `${year}${month}${day}${suffix}`;
};
