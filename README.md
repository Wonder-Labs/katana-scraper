# AI Browser

AI-browser is a web scraping program built with puppeteer focused on making it easy to scrape the entirety of a website or search engine results without writing a specific scraper for each task. The scraper focuses on getting semantic content (articles/writing) rather than specific structured information.

This tool also allows outputs a format that you can easily import into a *knowledge base* to make it searchable with AI using the Wonder Labs holograf-python package (https://github.com/Wonder-Labs/holograf-python)

## Setup

Make sure to install the dependencies:

```bash
# I suggest using yarn
yarn install

# npm
npm install

# pnpm
pnpm install --shamefully-hoist
```

## Using ai-browser
AI-browser uses a config file to determine how you will scrape the web.

There are two start the process of scraping content from the web.

1. Providing a website link where the scraping starts.
2. Searching Google using provided search queries

Once you start the scraper, it finds all URLs on a webpage. It then visits every single URL and scrapes it, keeping track of which URLs have already been visited. In case your program is interrupted, progress is saved while running.

In this example, we start scraping from a single webpage. In theory, because we have only allowed the scraper to pull from the investopedia domain, this config file will result in you scraping the entirety of the Investopedia website:
``` javascript
// import the scraper
const gc = require('./graphCreator');

// create our scraping config
let config = {
  allowedDomains: ["https://www.investopedia.com/terms/", "https://www.investopedia.com/articles/", "https://www.investopedia.com/financial-term", "https://www.investopedia.com/terms-"],
  ignoreStrings: [
    ".pdf",
    ".png",
    ".jpeg",
  ],
  ignoreParams: [],
  rateLimit: 0,
  maxDepth: -1,
  nativeScraper: true,
  output: "./investopedia",
  search: false,
  cookieFile: false,
  timeout: 300000
}

// we start the scraper by running createLinkGraph()
(async () => {
  // because we are not using search, we pass the starting URL as a string.
  await gc.createLinkGraph('https://www.investopedia.com/terms/', config);
})()

```

Here is how we can define a config file and start scraping using google:
``` javascript

const gc = require('./graphCreator');

let config = {
  allowedDomains: ["*"],
  ignoreStrings: [
    ".pdf",
  ],
  ignoreParams: [],
  rateLimit: 0,
  maxDepth: 1,
  nativeScraper: true,
  output: "./geography",
  search: true,
  cookieFile: false,
  timeout: 300000
}

(async () => {
  // because we are using search, we can pass an array here for multiple search tasks.
  await gc.createLinkGraph(['learn geography', 'geography for dummies'], config);
})()

```

## Config Parameters

When using createLinkGraph(), you must define two parameters for the function to build your link graph - seedURL and config.

### Modes:
search: true
- if set to true, program will use seedURL as an array of query strings to search google, pulling results in at your desired depth level.
- if set to false, you will start the recursive link building from a specific URL rather than a search engine results page.

### Graph settings
maxDepth: -1,
- Grabbing all links from a single page and then scraping each page is considered 1 depth. This number grows fast when you start allowing multiple domains or multiple google searches.
- Set to -1 to turn this feature off.

### Filtering:
allowedDomains: ["*"]
- list of domains that are allowed to be visted, scraped, and then recursively adding their internal links to continue scraping.
- add '*' to allow any domain to turn filter off
ignoreStrings: [".pdf"]
- strings that if present, will be filtered and thus will not be visted and scraped.
ignoreParams: [],
- to do: filter out specific URL parameters like '?='
rateLimit: 100,
- millisecond time to pause when making requests

### nativeScraper
nativeScraper: true
- if set to true, the app grabs the web content using puppeteer.
I'd recommend to set this to false and use (https://github.com/Wonder-Labs/PageZap/tree/main/microservices/scraper) scraper instead. The reason for this is because puppeteer grabs irrelevant content from the page like the navigation bar or footer. For whatever reason, using the scraper from this repo only grabs the semantic content. If someone can figure out how to do this with puppeteer only I'd happily fix it!

### File
output: "./geography",
- name of file. program will save partial progress and can be resumed if program is interrupted.

### cookieFile
cookieFile: "./cookie.json"
- A file that has your chrome cookies. This is useful if you want to scrape a website that requires authentication.

### timeout
timeout: 1000000
- Max amount of time to wait for a page to load before shutting the program down.
