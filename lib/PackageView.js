'use babel';

import { SelectListView } from 'atom-space-pen-views';
import { searchPackage } from './pkgSearch';
import PackageFiles from './pkgFiles';
import jsDelivrPackage from './package';
import * as semver from 'semver';

const open = require('open');

export default class PackageView extends SelectListView {
	constructor () {
		super();

		super.storeFocusedElement();
		super.setLoading('Loading...');

		this.currentList = [];
		this.selectedPkg = {};
		this.pkgVersions = [];
		this.lastQuery = null;
		this.listUpdated = false;
		this.pkgFiles = null;
		this.insertOptions = [ 'Insert URL', 'Insert HTML', 'Insert HTML + SRI' ];
		this.jsDelivrUrl = 'https://cdn.jsdelivr.net/npm/';

		atom.keymaps.addKeystrokeResolver(({ event }) => {
			if (Object.keys(this.selectedPkg).length === 0 && super.getSelectedItem() && event.type !== 'keyup') {
				if (event.code === 'F1') {
					open(`https://www.jsdelivr.com/package/npm/${super.getSelectedItem()}`);
				} else if (event.code === 'F2') {
					open(`https://www.npmjs.com/package/${super.getSelectedItem()}`);
				} else if (event.code === 'F3') {
					let selected = this.currentList.find(pkg => pkg.name === super.getSelectedItem());

					if (selected && selected.repository) {
						open(selected.repository.url);
					}
				}
			}
		});

		this.updateList();
	}

	viewForItem (item) {
		let li = document.createElement('li');
		li.classList.add('item');

		let div = document.createElement('div');
		div.textContent = item;
		li.appendChild(div);

		return li;
	}

	updateList () {
		if (Object.keys(this.selectedPkg).length === 0) {
			if (this.lastQuery === super.getFilterQuery()) {
				return;
			}

			this.lastQuery = super.getFilterQuery();

			try {
				return searchPackage(this.lastQuery).then((result) => {
					if (this.lastQuery !== result.params.replace('query=', '').split('&')[0]) {
						return;
					}

					if (typeof result === 'string') {
						super.setError(result);
						return;
					}

					this.currentList = result.hits;

					let items = result.hits.map((hit) => {
						return hit.name;
					});

					super.setItems(items);
				});
			} catch (e) {
				super.setError('Unexpected error occurred');
				return;
			}
		}

		if (!this.listUpdated) {
			if (this.selectedPkg.selectedVersion === '') {
				super.setItems(this.pkgVersions);
				this.listUpdated = true;

				return;
			}

			if (this.selectedPkg.selectedFile === '') {
				try {
					this.pkgFiles = new PackageFiles(this.selectedPkg);
					return this.pkgFiles.getFiles(this.selectedPkg).then((items) => {
						if (typeof items === 'string') {
							super.setError(items);
							this.listUpdated = true;
							return;
						}

						super.setItems(items);
						this.listUpdated = true;
					});
				} catch (e) {
					super.setError('Unpexpected error occurred');
					this.listUpdated = true;
					return;
				}
			}

			if (this.pkgFiles.isGenMin(this.selectedPkg.selectedFile)) {
				super.setItems(this.insertOptions.slice(0, 2));
			} else {
				super.setItems(this.insertOptions);
			}

			this.listUpdated = true;
		}
	}

	confirmed (item) {
		super.cancel();
		super.focusFilterEditor();

		if (Object.keys(this.selectedPkg).length === 0) {
			this.currentList.forEach((pkg) => {
				if (pkg.name === item) {
					this.selectedPkg = pkg;
					this.selectedPkg.selectedVersion = '';
					this.selectedPkg.selectedFile = '';

					Object.keys(this.selectedPkg.versions).forEach((version) => {
						if (!semver.valid(version)) {
							delete this.selectedPkg.versions[version];
						}
					});

					this.pkgVersions = semver.rsort(Object.keys(this.selectedPkg.versions));

					this.updateList();
				}
			});

			return;
		}

		if (this.selectedPkg.selectedVersion === '') {
			this.selectedPkg.selectedVersion = item;
			this.listUpdated = false;
			this.updateList();

			return;
		}

		if (this.selectedPkg.selectedFile === '') {
			this.selectedPkg.selectedFile = item;
			this.listUpdated = false;
			this.updateList();

			return;
		}

		let url = `${this.jsDelivrUrl}${this.selectedPkg.name}@${this.selectedPkg.selectedVersion}/${this.selectedPkg.selectedFile}`;
		let editor = atom.workspace.getActiveTextEditor();

		if (item === this.insertOptions[0]) {
			editor.insertText(url);
		} else if (item === this.insertOptions[1]) {
			if (this.selectedPkg.selectedFile.toLowerCase().endsWith('.js')) {
				editor.insertText(`<script src="${url}"></script>`);
			} else {
				editor.insertText(`<link rel="stylesheet" href="${url}">`);
			}
		} else {
			if (this.selectedPkg.selectedFile.toLowerCase().endsWith('.js')) {
				editor.insertText(`<script src="${url}" integrity="sha256-${this.pkgFiles.getHash(this.selectedPkg.selectedFile)}" crossorigin="anonymous"></script>`);
			} else {
				editor.insertText(`<link rel="stylesheet" href="${url}" integrity="sha256-${this.pkgFiles.getHash(this.selectedPkg.selectedFile)}" crossorigin="anonymous">`);
			}
		}

		super.restoreFocus();
		jsDelivrPackage.toggle();
	}

	previousStep () {
		this.listUpdated = false;
		this.lastQuery = null;

		if (Object.keys(this.selectedPkg).length !== 0) {
			if (this.selectedPkg.selectedVersion === '') {
				this.selectedPkg = {};
			} else if (this.selectedPkg.selectedFile === '') {
				this.selectedPkg.selectedVersion = '';
			} else {
				this.selectedPkg.selectedFile = '';
			}
		}

		this.updateList();
	}

	reset () {
		super.cancel();
		this.selectedPkg = {};
		this.listUpdated = false;
		this.lastQuery = null;
	}

	serialize () {}

	destroy () {
		this.element.remove();
	}

	getElement () {
		return this.element;
	}
}
