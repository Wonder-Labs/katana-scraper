const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const Graph = require("graph-data-structure");
const search = require("./search")
const fs = require('fs');
const { config } = require('process');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function filterLinks(links, config) {
    if (config.allowedDomains[0] != '*') {
        // remove links that don't belong to the URL domain array
        links = links.filter(link => {
            for (let i = 0; i < config.allowedDomains.length; i++) {
                if (link.includes(config.allowedDomains[i])) {
                    return true;
                }
            }
            return false;
        })
    }
    // convert to URL object and remove links with ? or #
    links = links.map(link => {
        return new URL(link)
    }
    ).filter(link => {
        return !link.search && !link.hash
    })

    // remove links that contain a string that exists in config.disallowedStrings
    links = links.filter(link => {
        for (let i = 0; i < config.ignoreStrings.length; i++) {
            // convert link to all lowercase
            if (link.href.toLowerCase().includes(config.ignoreStrings[i].toLowerCase())) {
                return false;
            }
        }
        return true;
    })

    // convert back to string
    links = links.map(link => {
        return link.href
    })

    // remove empty strings from array
    links = links.filter(link => link !== '')


    // remove duplicates
    links = [...new Set(links)];

    // turn links back into an array
    links = Array.from(links);
    return links;
}


// helper method
async function findPageLinks(URL, page, config) {

    // if page is undefined, then we need to make a new page
    if (page === undefined) {
        const browser = await puppeteer.launch();
        page = await browser.newPage();
    }

    if (config.hasOwnProperty('rateLimit')) {
        await sleep(config.rateLimit)
    }

    await page.goto(URL);

    // get all the links on the page
    let links = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(link => link.href);
    });

    links = filterLinks(links, config);

    return links
}

// This scrapes the body of a webpage and returns the text using puppeteer
async function getContentFromURLWithPuppeteer(page, links) {
    let content = [];
    // if links is an array, then we need to loop through each link
    if (Array.isArray(links)) {
        for (let i = 0; i < links.length; i++) {
            await page.goto(links[i]);
            let text = await page.evaluate(() => {
                return document.body.innerText;
            });
            content.push(text);
            break
        }
    }
    // if links is a string, then we just need to go to the link (index.js uses this)
    else {
        await page.goto(links);
        let text = await page.evaluate(() => {
            return document.body.innerText;
        });
        content = text;
    }
    return content;
}

async function createLinkGraph(seedURL, config) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    if (config.timeout) {
        page.setDefaultNavigationTimeout(config.timeout);
    }
    let graph = []
    let visited = new Set();

    // if config.cookieFile is true, then we need to load the cookies from the file
    if (config.cookieFile) {
        let cookies = JSON.parse(fs.readFileSync(config.cookieFile));
        await page.setCookie(...cookies);
    }

    // check if saved graph file exists
    if (fs.existsSync(config.output + '-graph-progress.json')) {
        console.log('Loading data from disk...')
        // if it does, open the graph file
        graph = JSON.parse(fs.readFileSync(config.output + '-graph-progress.json'));

        // check if visited set file exists
        if (fs.existsSync(config.output + '-visited-progress.json')) {
            visited = new Set(JSON.parse(fs.readFileSync(config.output + '-visited-progress.json')))
        }

    } else {
        visited.add(seedURL);
    }

    const queue = [seedURL];

    let depth = 0;

    while (queue.length > 0) {

        const currentURL = queue.shift();
        let pageLinks
        if (config.search == true) {
            // currentURL here is a search query
            pageLinks = await search.google(page, currentURL)
        }
        else {
            pageLinks = await findPageLinks(currentURL, page, config); // parse pageHTML to find new URLs
        }

        for (const link of pageLinks) {
            if (!visited.has(link)) {
                let content
                if (config.nativeScraper) {
                    content = await scrapeURLNative(link, config.rateLimit, config, page)
                }
                else {
                    content = await scrapeURL(link, config.rateLimit, config, page)
                }

                console.log('content:', content)
                visited.add(link);
                graph.push(content)
                if (depth < config.maxDepth || config.maxDepth == -1) {
                    queue.push(link);
                }

            }
        }

        depth++;
        // save everything after visiting each URL
        fs.writeFileSync(config.output + '-graph-progress.json', JSON.stringify(graph));
        fs.writeFileSync(config.output + '-visited-progress.json', JSON.stringify(Array.from(visited)))
    }

    await browser.close();

    // after writing, delete the saved files
    fs.unlinkSync(config.output + '-graph-progress.json');
    fs.unlinkSync(config.output + '-visited-progress.json');

    // save graph to file
    fs.writeFileSync(config.output + '.json', JSON.stringify(graph));
    return graph;
}

function loadGraph(path) {

    let graph = Graph();

    // open graph from file
    const graphJSON = JSON.parse(fs.readFileSync(path));
    graph = graph.deserialize(graphJSON);

    // console.log(graph.topologicalSort());

    return graph

}

// This scrapes the body of a webpage and returns the text from the page zap api
async function getContentFromURL(URL) {
    let result = await fetch('http://localhost:5000/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: URL }),
    })
    let data = await result.json()
    return data
}


// async function scrapeGraph(graphPath, filename, rateLimit) {
//     let graph = loadGraph(graphPath)
//     let URLs = graph.nodes()

//     let results = []
//     for (let i = 0; i < URLs.length; i++) {
//         await sleep(rateLimit)
//         let response = await getContentFromURL(URLs[i])

//         console.log('scraping the current URL: ' + URLs[i])

//         console.log('response from API: ', response)

//         if (response && !response.error) {
//             // TO DO: sometimes the API returns empty open graph data. need to check for that
//             let date = new Date()
//             results.push({
//                 'url': URLs[i],
//                 'content': response['content'],
//                 'metadata': response['og'],
//                 'date': date
//             })
//         }
//         else {
//             console.log('No response for ' + URLs[i] + ', skipping...')
//         }
//     }

//     fs.writeFileSync(filename + '.json', JSON.stringify(results))

//     return results

// }

async function scrapeURLNative(URL, rateLimit, config, page) {
    await sleep(rateLimit)
    console.log('scraping the current URL: ' + URL)

    response = await getContentFromURLWithPuppeteer(page, URL)
    return {
        'url': URL,
        'content': response,
        'metadata': '',
        'date': new Date()
    }
}

async function scrapeURL(URL, rateLimit) {
    await sleep(rateLimit)
    console.log('scraping the current URL: ' + URL)
    let result = await fetch('http://localhost:5000/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: URL }),
    })
    let data = await result.json()
    return {
        'url': URL,
        'content': data['content'],
        'metadata': data['og'],
        'date': new Date()
    }
}

// function that gets og data from HTML. If there is no og data, it returns meta title and description
async function getMetadata(page, URL) {
    page = await getPage(page)
    console.log('here')
    await page.goto(URL);
    let metadata = await page.evaluate(() => {
        let og = {}
        let meta = document.querySelectorAll('meta')
        console.log(meta)
        for (let i = 0; i < meta.length; i++) {
            if (meta[i].hasAttribute('property')) {
                og[meta[i].getAttribute('property')] = meta[i].getAttribute('content')
            }
            else if (meta[i].hasAttribute('name')) {
                og[meta[i].getAttribute('name')] = meta[i].getAttribute('content')
            }
        }
        return og
    })
    return metadata
}

// if page is not defined, return page by creating new browser
async function getPage(page) {
    console.log(page)
    if (!page) {
        console.log('No page initialzed, creating new browser...')
        const browser = await puppeteer.launch();
        page = await browser.newPage();
    }
    return page
}



// export all functions
module.exports = {
    createLinkGraph,
    findPageLinks,
    filterLinks,
    getContentFromURL,
    getMetadata
}
