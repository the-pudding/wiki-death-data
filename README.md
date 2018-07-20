# Wiki Death Data

“You only live as long as the last person to remember you.” - Akecheta (Westworld)

[Screencasts](https://www.youtube.com/playlist?list=PLsuhXm2zs07JuSfrNentA3DxAbaFO7ay2) of the story as it is created.

## Setup

#### Dependencies

- [node](https://nodejs.org)
- [npm-run-all CLI](https://github.com/mysticatea/npm-run-all)

#### Install

Clone the repo and run `npm i`

## Reproduce

Individual steps below, or run `make reproduce`

##### `npm run download-year-pages`

Download the HTML for the year event pages from wiki that contain a list of all notable deaths (2015-2018).

#### `npm run parse-year-pages`

Extract every person and their meta data from the event pages to create a single csv of all notable deaths from 2015-2018.

#### `npm run get-wiki-pageviews`

Use wiki pageviews api to get the daily pageviews for en.wikipedia.org so that we can calculate percent of traffic for each person and look into seasonality in the data.

#### `npm run get-people-pageviews`

Use the wiki pageviews api to get the daily pageviews for each person in our full list of notable deaths.

#### `npm run bin`

Bin each person's pageviews by multiple intervals (1 week, 72hrs, 48 hrs).

#### `npm run stats`

Calculates a bunch of summary statistics for each person (Must choose bin).

#### `npm run filter-population`

Reduces the data to people who satisfy some quantiative criteria.

#### `npm run add-details`

Gets more detail info on each person from wiki and custom spreadsheet.

#### `npm run prepare-explore`

Consolidates and optimizes data for visual exploration.

#### `npm run prepare-web`

Streamlines data for web presentation.
