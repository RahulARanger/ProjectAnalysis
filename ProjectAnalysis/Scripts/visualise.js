"use strict";

// SOME GLOBALS

let ignoreWindow = null;
const charts = [];

// some pointers in DOCS

const getChart = (name) => document.getElementById(name);
const rootDetails = (index) =>
	document.querySelector(
		`.mid > span:nth-of-type(${index}) > span:last-of-type`
	);

// layout theme
const layout = {
	paper_bgcolor: "black",
};

// status of each file/ folder/ language
function stat_us(index, disable = false) {
	this.Enabled[index] = disable;
	this.refresh = true;
}

function do_refresh() {
	this.Selected = this.Selected.map((actual_index, index) =>
		this.Enabled[actual_index] ? index : null
	).filter((value) => value);

	this.refresh = false;
}

function getValues(parameter) {
	this.refresh ? this.do_refresh() : null;
	return this.Selected.map((index) => this[parameter][index]);
}

// above functions can't be lambda or arrow functions since arrow doesn't have it's own this so we can't bind it

const sum = (array) => array.reduce((acc, value) => acc + value, 0);

const options = {
	scrollZoom: true,
	editable: false,
	displaylogo: false,
	responsive: true,
};

const files = {
	Names: [],
	Path: [],
	T_Spaces: [],
	T_Tabs: [],
	M_Spaces: [],
	M_Tabs: [],
	Enabled: [],
	ParentID: [],
	Selected: [],
	Depth: [],
	Size: [],
	refresh: false,
	stat_us,
	do_refresh,
	getValues,
};

const folders = {
	Names: [],
	Enabled: [],
	Path: [],
	refresh: false,
	Selected: [],
	Depth: [],
	ParentID: [],
	stat_us,
	do_refresh,
	getValues,
	associatedFiles() {
		return folders.getValues("Path").map((folderPath, folderIndex) =>
			files
				.getValues("Depth")
				.map((value, index) =>
					folders["Depth"][folderIndex] < value &&
					files["Path"][index].startsWith(folderPath)
						? index
						: null
				)
				.filter((value) => value)
		);
	},

	getMass() {
		const meta = this.associatedFiles();
		return [meta.map((value) => sum(value) / 100), meta];
	},

	getVolume(meta) {
		return meta.map((value) => value.length);
	},
};

const languages = {
	Colors: [],
	Extensions: [],

	ItsWeight() {},
};

// HELPER FUNCTIONS

function nonZero(array) {
	return array.filter((value) => value > 0);
}

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle

function shuffledArray(array) {}

function sillyFilter(_files, _folders, _languages) {
	d3.csvParse(_folders, (folder, index) => {
		folders["Names"].push(folder.Name);
		folders["Path"].push(folder.Path);
		folders["Enabled"].push(true);
		folders["Selected"].push(index);
		folders["Depth"].push(+folder["Depth Level"]);
		folders["ParentID"].push(+folder.ParentID);
	});
	d3.csvParse(_files, function (file, index) {
		files["Names"].push(file.Name);
		files["T_Spaces"].push(+file["TOTAL_SPACES"]);
		files["T_Tabs"].push(+file["TOTAL_TABS"]);
		files["M_Spaces"].push(+file["MAX_SPACES"]);
		files["M_Tabs"].push(+file["MAX_TABS"]);
		files["Path"].push(file.Path);
		files["Enabled"].push(true);
		files["ParentID"].push(+file.ParentID);
		files["Selected"].push(index);
		files["Size"].push(+file.Size);
		files["Depth"].push(+file["Depth Level"]);
	});

	d3.csvParse(_languages, function (language) {
		languages["Extensions"].push(language.Extension);
		languages["Colors"].push(language.Color);
	});

	// document
	// 	.getElementById("ignore")
	// 	.addEventListener("click", gitIgnoreWindow);

	connectListeners();

	setTimeout(createCharts, 0);
}

function connectListeners() {
	document.getElementById("ignore").addEventListener("click", createPopDoc);
}

function createCharts() {
	setRootDetails();
	charts.push(folderDensity());
}

function setRootDetails() {
	const filesCount = rootDetails(1);
	const foldersCount = rootDetails(2);
	const langCount = rootDetails(3);
	filesCount.textContent = files.getValues("ParentID").length;
	foldersCount.textContent = folders.getValues("ParentID").length;
	langCount.textContent = languages.Extensions.length;
}
function folderDensity() {
	const [size, ass_files] = folders.getMass();

	const data = [
		{
			x: folders.getValues("Names"),
			y: folders.getVolume(ass_files),
			text: folders.getValues("Path"),
			name: "Volume",
			type: "bar",

			marker: {
				color: "coral",
				opacity: 0.89,
				line: {
					color: "#FBCEB1",
					width: 1.5,
					opacity: 0.89,
				},
			},
		},
	];

	const for_this_layout = {
		title: "Folder Density",
		...layout,
	};

	return Plotly.newPlot(
		getChart(folderDensity.name),
		data,
		for_this_layout,
		options
	);
}

function extensionDominance() {
	const data = [
		{
			type: "sunburst",
			labels: folders.Names.concat(files.Names),
			id: folders.Path.concat(files.Path),
			parents: folders.ParentID.map((parent) =>
				parent === -1 ? "" : folders.Path[parent]
			).concat(files.ParentID.map((parent) => folders.Path[parent])),
		},
	];

	return Plotly.newPlot(
		document.getElementById(extensionDominance.name),
		data
	);
}

// POP DOC THINGS

function createPopDoc() {
	ignoreWindow = window.open(
		"../templates/gitignore.html",
		"ignore list",
		"width=690,height=420,popup=1"
	);

	const popDoc = ignoreWindow.document;
	popDoc.onload = function () {
		arrangePopDoc();
	};
}
function arrangePopDoc() {}

function closePopDoc() {
	// closes if ignoreWindow is created, if created closes and sets to null
	ignoreWindow = ignoreWindow && ignoreWindow.close() && null;
}

function sunBurstDirs(element) {
	const data = {
		labels: folders.Names.concat(files.Names),
		parent: folders.Names.map((_, index) => {
			const p_index = folders.ParentID[index];
			return p_index === -1 ? "" : folders.Names[p_index];
		}).concat(
			files.Names.map((_, index) => folders.Names[files.ParentID[index]])
		),
	};

	return Plotly.newPlot(element, data);
}

//document.getElementById("ignore").addEventListener("click", function () {
//	const ignoreList = window.open(
//		"../templates/gitignore.html",
//		"ignore list",
//		"width=690,height=420,popup=1"
//	);
//	// createTree(ignoreList.document, ignoreList.document.querySelector(".tree"));
//
//	// after loading ignorelist, then listen
//	ignoreList.onload = function () {
//		const popDoc = ignoreList.document;
//
//		popDoc.title = "Ignore List";
//
//		const textArea = popDoc.querySelector(".textarea");
//		const raw = wholeRawData("Name", "Path", "disable");
//		let controlled = false;
//
//		// first key down
//		popDoc.addEventListener("keydown", function (event) {
//			switch (event.key) {
//				case "Control": {
//					controlled = true;
//					break;
//				}
//
//				case "s": {
//					if (controlled) {
//						event.preventDefault();
//						if (popDoc.title.at(-1) !== "*") break;
//						popDoc.title = popDoc.title.slice(0, -1);
//					}
//				}
//			}
//		});
//		// next is key up
//		popDoc.addEventListener("keyup", function (event) {
//			switch (event.key) {
//				case "Escape": {
//					ignoreList.close();
//					break;
//				}
//
//				case "Control": {
//					controlled = false;
//				}
//			}
//		});
//
//		textArea.addEventListener("input", function () {
//			popDoc.title.at(-1) !== "*" && (popDoc.title += "*");
//		});
//	};
//});
