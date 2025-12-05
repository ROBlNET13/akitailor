document.getElementsByTagName("title")[0].innerText =
	chrome.i18n.getMessage("name_short");
document.getElementById("button-save").innerText =
	chrome.i18n.getMessage("save_changes");

let akinatorBase = document.getElementsByClassName("akinator-base")[0];
let akinatorHat = document.getElementsByClassName("akinator-hat")[0];
let akinatorClothes = document.getElementsByClassName("akinator-clothes")[0];

let selectedBase = 0;
let selectedHat = 0;
let selectedClothes = 0;

function loadAccessories() {
	let chosenBase = akitailorAccessories.bases[selectedBase];
	let chosenHat = akitailorAccessories.hats[selectedHat];
	let chosenClothes = akitailorAccessories.clothes[selectedClothes];

	if (chosenHat == "none") {
		akinatorHat.style = "opacity: 0";
	} else {
		akinatorHat.style = "";
	}

	if (chosenClothes == "none") {
		akinatorClothes.style = "opacity: 0";
	} else {
		akinatorClothes.style = "";
	}

	akinatorBase.src = "../img/akinator/bases/" + chosenBase + "/defi.webp";
	akinatorHat.src = "../img/akinator/hats/" + chosenHat + "/defi.webp";
	akinatorClothes.src =
		"../img/akinator/clothes/" + chosenClothes + "/defi.webp";

	console.log("hat  ", akitailorAccessories.hats[selectedHat]);
	console.log("clothes ", akitailorAccessories.clothes[selectedClothes]);
	console.log("hat number", selectedHat);
	console.log("clothes number", selectedClothes);
}

function setAccessory(accessory, increment) {
	console.log(accessory);
	if (accessory === "Hat") {
		const potentialHat = selectedHat + increment;

		if (potentialHat >= akitailorAccessories.hats.length) {
			selectedHat = 0;
		} else if (potentialHat < 0) {
			selectedHat = akitailorAccessories.hats.length - 1;
		} else {
			selectedHat += increment;
		}
	} else if (accessory === "Clothes") {
		const potentialClothes = selectedClothes + increment;

		if (potentialClothes >= akitailorAccessories.clothes.length) {
			selectedClothes = 0;
		} else if (potentialClothes < 0) {
			selectedClothes = akitailorAccessories.clothes.length - 1;
		} else {
			selectedClothes += increment;
		}
	} else {
		const potentialBase = selectedBase + increment;

		if (potentialBase >= akitailorAccessories.bases.length) {
			selectedBase = 0;
		} else if (potentialBase < 0) {
			selectedBase = akitailorAccessories.bases.length - 1;
		} else {
			selectedBase += increment;
		}
	}

	loadAccessories();
}

function saveAccessories() {
	const akitailorSave = {
		base: akitailorAccessories.bases[selectedBase],
		hat: akitailorAccessories.hats[selectedHat],
		clothes: akitailorAccessories.clothes[selectedClothes],
	};
	chrome.storage.local.set(
		{
			akitailorSave: akitailorSave,
		},
		() => {
			console.log("Saved Data! Yippee!");
		}
	);
	// send to background script (for icon update)
	chrome.runtime
		.sendMessage({ type: "newCostume", data: akitailorSave })
		.catch(() => {});
	// send to content script (for live akinator update)
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0]?.id) {
			chrome.tabs
				.sendMessage(tabs[0].id, {
					type: "newCostume",
					data: akitailorSave,
				})
				.catch(() => {
					// ignore error if no content script is listening
				});
		}
	});
}

chrome.storage.local.get(["akitailorSave"], (result) => {
	if (result.akitailorSave) {
		console.log(result.akitailorSave);

		selectedBase = akitailorAccessories.bases.indexOf(
			result.akitailorSave.base
		);
		selectedHat = akitailorAccessories.hats.indexOf(
			result.akitailorSave.hat
		);
		selectedClothes = akitailorAccessories.clothes.indexOf(
			result.akitailorSave.clothes
		);

		if (akitailorAccessories.bases[selectedBase] === undefined) {
			selectedBase = 0; // base_current
		}
		if (akitailorAccessories.hats[selectedHat] === undefined) {
			selectedHat = 1; // turban
		}
		if (akitailorAccessories.clothes[selectedClothes] === undefined) {
			selectedClothes = 1; // orient
		}

		loadAccessories();
	} else {
		chrome.storage.local.set({ akitailorSave: defaultAccessories }, () => {
			console.log("Set Default Data");
		});
	}
});

document.addEventListener("DOMContentLoaded", () => {
	document
		.getElementById("hat-left")
		.addEventListener("click", () => setAccessory("Hat", -1));
	document
		.getElementById("hat-right")
		.addEventListener("click", () => setAccessory("Hat", 1));

	document
		.getElementById("base-left")
		.addEventListener("click", () => setAccessory("Base", -1));
	document
		.getElementById("base-right")
		.addEventListener("click", () => setAccessory("Base", 1));

	document
		.getElementById("clothes-left")
		.addEventListener("click", () => setAccessory("Clothes", -1));
	document
		.getElementById("clothes-right")
		.addEventListener("click", () => setAccessory("Clothes", 1));

	document
		.getElementById("button-save")
		.addEventListener("click", () => saveAccessories());
});
