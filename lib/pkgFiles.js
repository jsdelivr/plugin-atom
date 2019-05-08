'use babel';

import got from 'got';
import { version } from '../package.json';

const jsDelivrEndpoint = 'https://data.jsdelivr.com/v1/package/npm/';
const userAgent = `jsDelivr Atom plugin/${version} (https://github.com/jsdelivr/plugin-atom)`;

let files = [];

let completeFileList = [];
let hashes = new Map();

async function getFiles (pkg) {
	let response = await got(pkg.name + '@' + pkg.selectedVersion + '/flat', { baseUrl: jsDelivrEndpoint, headers: { 'user-agent': userAgent } });
	let minFiles = [];
	JSON.parse(response.body).files.forEach((file) => {
		hashes.set(file.name.substr(1), file.hash);
	});
	files = JSON.parse(response.body).files.filter((file) => {
		return file.name.endsWith('.js') || file.name.endsWith('.css');
	}).map((file) => {
		return file.name.substr(1);
	});

	files.forEach((file) => {
		if (!file.toLowerCase().endsWith('.min.js') && !file.toLowerCase().endsWith('.min.css')) {
			minFiles.push(file.toLowerCase().endsWith('.js') ? file.toLowerCase().replace(new RegExp(/\.js$/), '.min.js') : file.toLowerCase().replace(new RegExp(/\.css$/), '.min.css'));
		}
	});

	completeFileList = files.concat(minFiles)
		.filter((v, i, a) => a.indexOf(v) === i)
		.sort((file1, file2) => {
			return file1 > file2;
		});

	return completeFileList;
}

function getHash (file) {
	return hashes.get(file);
}

function isGenMin (file) {
	return !files.includes(file);
}

module.exports.getFiles = getFiles;
module.exports.getHash = getHash;
module.exports.isGenMin = isGenMin;
