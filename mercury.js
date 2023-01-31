const Mercury = require('@postlight/mercury-parser')

async function base(URL) {
    return await Mercury.parse(URL)
}

async function main() {
    console.log(await base('https://www.youtube.com/watch?v=TUB9jgMuC7U&list=LL&index=81'))
}

(async () => {
    main()

})();

module.exports = {
    base
}