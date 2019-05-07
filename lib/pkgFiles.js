let got = require('got');

const jsDelivrEndpoint = 'https://data.jsdelivr.com/v1/package/npm/';
const userAgent = 'jsDelivr Atom plugin';

let files = [];

let completeFileList = [];
let hashes = new Map();

async function getFiles (pkg) {
	let response = await got(pkg.name + '@' + pkg.selectedVersion + '/flat', { baseUrl: jsDelivrEndpoint, headers: { 'user-agent': userAgent } });
	let minFiles = [];
	JSON.parse(response.body).files.forEach((file) => {
		hashes.set(file.name.replace('/', ''), file.hash);
	});
	files = JSON.parse(response.body).files.filter((file) => {
		return file.name.endsWith('.js') || file.name.endsWith('.css');
	}).map((file) => {
		return file.name.replace('/', '');
	});

	files.forEach((file) => {
		if (!file.endsWith('.min.js') && !file.endsWith('.min.css')) {
			minFiles.push(file.endsWith('.js') ? file.replace(new RegExp('.js$'), '.min.js') : file.replace(new RegExp('.css$'), '.min.css'));
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
