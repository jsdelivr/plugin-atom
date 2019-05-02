'use babel';

import { SelectListView } from 'atom-space-pen-views';
import { searchPackage } from './pkgSearch';
import { getFiles, getHash, isGenMin } from './pkgFiles';
import jsDelivrPackage from './package';
import * as semver from 'semver';

export default class PackageView extends SelectListView {
	constructor () {
		super();

		super.storeFocusedElement();
		super.setLoading('Loading...');

		this.currentList = [];
		this.selectedPkg = {};
		this.lastQuery = null;
		this.listUpdated = false;
		this.insertOptions = [ 'Insert URL', 'Insert HTML', 'Insert HTML + SRI' ];
		this.jsDelivrUrl = 'https://cdn.jsdelivr.net/npm/';

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

			return searchPackage(this.lastQuery).then((result) => {
				this.currentList = result;

				let items = result.map((hit) => {
					return hit.name;
				});

				super.setItems(items);
			});
		}

		if (!this.listUpdated) {
			if (this.selectedPkg.selectedVersion === '') {
				super.setItems(semver.rsort(Object.keys(this.selectedPkg.versions)));
				this.listUpdated = true;

				return;
			}

			if (this.selectedPkg.selectedFile === '') {
				return getFiles(this.selectedPkg).then((items) => {
					super.setItems(items);
					this.listUpdated = true;
				});
			}

			if (isGenMin(this.selectedPkg.selectedFile)) {
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

		let url = this.jsDelivrUrl + this.selectedPkg.name + '@' + this.selectedPkg.selectedVersion + '/' + this.selectedPkg.selectedFile;
		let editor = atom.workspace.getActiveTextEditor();

		if (item === this.insertOptions[0]) {
			editor.insertText(url);
		} else if (item === this.insertOptions[1]) {
			if (this.selectedPkg.selectedFile.toLowerCase().endsWith('.js')) {
				editor.insertText('<script src="' + url + '"></script>');
			} else {
				editor.insertText('<link rel="stylesheet" href="' + url + '">');
			}
		} else {
			if (this.selectedPkg.selectedFile.toLowerCase().endsWith('.js')) {
				editor.insertText('<script src="' + url + '" integrity="sha256-' + getHash(this.selectedPkg.selectedFile) + '" crossorigin="anonymous"></script>');
			} else {
				editor.insertText('<link rel="stylesheet" href="' + url + '" integrity="sha256-' + getHash(this.selectedPkg.selectedFile) + '" crossorigin="anonymous">');
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
