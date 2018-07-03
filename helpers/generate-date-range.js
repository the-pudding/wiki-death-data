// via https://gist.github.com/miguelmota/7905510
// Returns an array of dates between the two dates
module.exports = function generateDateRange(startDate, endDate) {
  const dates = [];

  let currentDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  while (currentDate <= endDate) {
    dates.push(currentDate);

    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1 // Will increase month if over range
    );
  }

  dates.pop();
  return dates;
};
