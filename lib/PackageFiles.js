'use babel';

import got from 'got';
import { version } from '../package.json';

const jsDelivrEndpoint = 'https://data.jsdelivr.com/v1/package/npm/';
const userAgent = `jsDelivr Atom plugin/${version} (https://github.com/jsdelivr/plugin-atom)`;

export default class PackageFiles {
	constructor (pkg) {
		this.files = [];
		this.hashes = new Map();
		this.pkg = pkg;
	}

	async getFiles () {
		let response;
		let completeFileList;

		try {
			response = await got(`${this.pkg.name}@${this.pkg.selectedVersion}/flat`, { baseUrl: jsDelivrEndpoint, headers: { 'user-agent': userAgent } });
		} catch (e) {
			return JSON.parse(e.body).message;
		}

		let minFiles = [];
		let parsedFiles = JSON.parse(response.body).files;

		parsedFiles.forEach((file) => {
			this.hashes.set(file.name.substr(1), file.hash);
		});

		this.files = parsedFiles.filter((file) => {
			return file.name.endsWith('.js') || file.name.endsWith('.css');
		}).map((file) => {
			return file.name.substr(1);
		});

		this.files.forEach((file) => {
			if (!file.toLowerCase().endsWith('.min.js') && !file.toLowerCase().endsWith('.min.css')) {
				minFiles.push(file.toLowerCase().endsWith('.js') ? file.replace(/\.js$/i, '.min.js') : file.replace(/\.css$/i, '.min.css'));
			}
		});

		completeFileList = this.files.concat(minFiles)
			.filter((v, i, a) => a.indexOf(v) === i)
			.sort((file1, file2) => {
				return file1 > file2 ? 1 : -1;
			});

		return completeFileList;
	}

	getHash (file) {
		return this.hashes.get(file);
	}

	isGenMin (file) {
		return !this.files.includes(file);
	}
}
