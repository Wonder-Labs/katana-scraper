const gc = require('./graphCreator');

let config2 = {
  allowedDomains: ["https://www.khanacademy.org/economics-finance-domain/macroeconomics", "https://youtu.be/"],
  ignoreStrings: [
    ".pdf",
    "Calculator",
    ".png",
    "PrefixIndex",
    ".jpeg",
    "Browse",
    "contact",
    "WhatLinksHere",
    "contributions",
    "User:",
    "Archive",
    "Special:",
    "File:",
    "Category:",
    "Talk:",
    "User talk:"
  ],
  ignoreParams: [],
  rateLimit: 100,
  maxDepth: 3,
  nativeScraper: true,
  output: "./khan-economics",
  search: false,
  cookieFile: false,
}

let config = {
  allowedDomains: ["https://www.investopedia.com/terms/", "https://www.investopedia.com/articles/", "https://www.investopedia.com/financial-term", "https://www.investopedia.com/terms-"],
  ignoreStrings: [
    ".pdf",
    "Calculator",
    ".png",
    "PrefixIndex",
    ".jpeg",
    "Browse",
    "contact",
    "WhatLinksHere",
    "contributions",
    "User:",
    "Archive",
    "Special:",
    "File:",
    "Category:",
    "Talk:",
    "User talk:"
  ],
  ignoreParams: [],
  rateLimit: 0,
  maxDepth: -1,
  nativeScraper: true,
  output: "./scu-kb",
  search: false,
  cookieFile: './cookies.json',
  timeout: 300000
}

// pass array of URLs and see which URLs are filtered by config.ignoreStrings and config.ignoreParams
function testFilter(URLs) {
  console.log(gc.filterLinks(URLs, config))
}

// function testScraper(URL) {


(async () => {
  
  await gc.createLinkGraph('https://www.investopedia.com/financial-term-dictionary-4769738', config);
  
})()