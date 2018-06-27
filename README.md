# Wiki Death Data

“You only live as long as the last person to remember you.” - Akecheta (Westworld)

[Screencasts](https://www.youtube.com/playlist?list=PLsuhXm2zs07JuSfrNentA3DxAbaFO7ay2) of the story as it is created.

## Installation

Clone the repo and run `npm i`

## Replication

### 1) `npm run download-year-pages`

Download the HTML for the year event pages from wiki that contain a list of all notable deaths (2015-2018).

### 2) `npm run parse-year-pages`

Extract every person and their meta data from the event pages to create a single csv of all notable deaths from 2015-2018.

### 3) `npm run get-wiki-pageviews`

Use wiki pageviews api to get the daily pageviews for en.wikipedia.org so that we can calculate percent of traffic for each person and look into seasonality in the data.

### 4) `npm run get-people-pageviews`

Use the wiki pageviews api to get the daily pageviews for each person in our full list of notable deaths.

### 5) `npm run join-people`

Join all three sources into a single csv for each person that contains the daily pageviews, percent traffic, and metadata.
