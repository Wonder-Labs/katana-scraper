const puppeteer = require('puppeteer');

async function google(page, query) {
    const url = new URL('https://google.com/search');
    url.searchParams.append('q', query);

    await page.goto(url);

    // get all the links on the page
    let links = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(link => link.href);
    });

    // remove links from google.com domain
    links = links.filter(link => !link.includes('google.com'));

    // remove empty strings from array
    links = links.filter(link => link !== '');

    console.log(links);
    return links;

}

async function bing() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = new URL('https://www.bing.com/search');
    url.searchParams.append('q', 'puppeteer');

    await page.goto(url);

    // get all the links on the page
    let links = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(link => link.href);
    });

    // remove links from google.com domain
    links = links.filter(link => !link.includes('bing.com'));

    // remove empty strings from array
    links = links.filter(link => link !== '');

    // remove strings that are not links
    links = links.filter(link => link.includes('http'));


    console.log(links);

    await browser.close();
}

module.exports = {
    google,
    bing
}