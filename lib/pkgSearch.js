'use babel';

import algoliasearch from 'algoliasearch';

const appId = 'OFCNCOG2CU';
const apiKey = 'f54e21fa3a2a0160595bb058179bfb1e';
const indexName = 'npm-search';

let client = algoliasearch(appId, apiKey);

let index = client.initIndex(indexName);

async function searchPackage (input) {
	let res = await index.search(input);
	return res.hits;
}

module.exports.searchPackage = searchPackage;
