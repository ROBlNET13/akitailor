// store the current accessory data globally so it can be updated
let currentAccessoryData = null;

function akinate(savedAccessoryData) {
	let akinatorDiv = document.querySelector(".akinator");
	let akinatorImg = document.querySelector(".akinator-body img");

	// initialize the global current accessory data
	currentAccessoryData = { ...savedAccessoryData };

	if (akinatorDiv) {
		function returnEmotion() {
			let akinatorImgSrc = akinatorImg.src;
			let emotionName = akinatorImgSrc.substring(
				akinatorImgSrc.lastIndexOf("/") + 1
			); // stack overflow ily
			return emotionName.replace(".png", ".webp");
		}
		console.log(
			"Akinator found! Applying following data: ",
			savedAccessoryData
		);
		akinatorDiv.style = "display: none;";
		let akitailorDiv = document.createElement("div");
		akitailorDiv.className = "akitailor-akinator akinator";
		let akitailorBodyDiv = document.createElement("div");
		akitailorBodyDiv.classList = "akitailor-akinator akinator-body";
		akitailorBodyDiv.style = "transform: scaleX(-1); display: grid;";
		akitailorDiv.appendChild(akitailorBodyDiv);
		let akitailorAkitudeBaseImg = document.createElement("img");
		akitailorAkitudeBaseImg.id = "akitudeBase";
		akitailorAkitudeBaseImg.style.cssText = `
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-size: 1rem;
    line-height: 1.5;
    text-align: left;
    font-family: "ArimaMadurai";
    font-weight: 900;
    color: #18455A;
    width: 604px;
    height: 988px;
    aspect-ratio: auto 604 / 988;
    box-sizing: border-box;
    vertical-align: middle;
    border-style: none;
    transform: none;
    filter: none;
    max-width: 100%;
    grid-area: 1 / 1;
    `;
		akitailorAkitudeBaseImg.src = chrome.runtime.getURL(
			"img/akinator/bases/base_current/defi.webp"
		);

		let akitailorAkitudeHatImg = document.createElement("img");
		akitailorAkitudeHatImg.id = "akitudeHat";
		akitailorAkitudeHatImg.style.cssText =
			akitailorAkitudeBaseImg.style.cssText;
		akitailorAkitudeHatImg.src = chrome.runtime.getURL(
			"img/akinator/hats/" +
				akitailorAccessories.hats[savedAccessoryData.hat] +
				"/defi.webp"
		);

		if (akitailorAccessories.hats[savedAccessoryData.hat] == "none") {
			akitailorAkitudeHatImg.style.cssText =
				akitailorAkitudeBaseImg.style.cssText + "opacity: 0;";
		}

		let akitailorAkitudeClothesImg = document.createElement("img");
		akitailorAkitudeClothesImg.id = "akitudeClothes";
		akitailorAkitudeClothesImg.style.cssText =
			akitailorAkitudeBaseImg.style.cssText;
		akitailorAkitudeClothesImg.src = chrome.runtime.getURL(
			"img/akinator/clothes/" +
				akitailorAccessories.clothes[savedAccessoryData.clothes] +
				"/defi.webp"
		);

		if (
			akitailorAccessories.clothes[savedAccessoryData.clothes] == "none"
		) {
			akitailorAkitudeClothesImg.style.cssText =
				akitailorAkitudeBaseImg.style.cssText + "opacity: 0;";
		}
		akitailorBodyDiv.appendChild(akitailorAkitudeBaseImg);
		akitailorBodyDiv.appendChild(akitailorAkitudeClothesImg);
		akitailorBodyDiv.appendChild(akitailorAkitudeHatImg);

		akinatorDiv.parentElement.appendChild(akitailorDiv);

		function setAkitailorImages() {
			let currentEmotion = returnEmotion();
			akitailorAkitudeBaseImg.src = chrome.runtime.getURL(
				"img/akinator/bases/" +
					akitailorAccessories.bases[currentAccessoryData.base] +
					"/" +
					currentEmotion
			);
			akitailorAkitudeHatImg.src = chrome.runtime.getURL(
				"img/akinator/hats/" +
					akitailorAccessories.hats[currentAccessoryData.hat] +
					"/" +
					currentEmotion
			);
			akitailorAkitudeClothesImg.src = chrome.runtime.getURL(
				"img/akinator/clothes/" +
					akitailorAccessories.clothes[currentAccessoryData.clothes] +
					"/" +
					currentEmotion
			);
		}

		setAkitailorImages();

		observer = new MutationObserver((changes) => {
			// stack overflow ily x2
			changes.forEach((change) => {
				if (change.attributeName.includes("src")) {
					setAkitailorImages();
				}
			});
		});
		observer.observe(akinatorImg, { attributes: true });
	} else {
		console.log("No Akinator on the page");
	}
}

chrome.storage.local.get(["akitailorSave"], (result) => {
	if (result.akitailorSave) {
		let currentSave = result.akitailorSave;

		currentSave.base = akitailorAccessories.bases.indexOf(currentSave.base);
		currentSave.hat = akitailorAccessories.hats.indexOf(currentSave.hat);
		currentSave.clothes = akitailorAccessories.clothes.indexOf(
			currentSave.clothes
		);

		akinate(currentSave);
	} else {
		chrome.storage.local.set({ akitailorSave: defaultAccessories }, () => {
			akinate({
				base: akitailorAccessories.bases.indexOf(
					defaultAccessories.base
				),
				hat: akitailorAccessories.hats.indexOf(defaultAccessories.hat),
				clothes: akitailorAccessories.clothes.indexOf(
					defaultAccessories.clothes
				),
			});
		});
	}
});

chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "newCostume") {
		console.log("Received newCostume message:", message.data);
		const { base, hat, clothes } = message.data;

		// update the current accessory data so mutationobserver uses new values
		currentAccessoryData = {
			base: akitailorAccessories.bases.indexOf(base),
			hat: akitailorAccessories.hats.indexOf(hat),
			clothes: akitailorAccessories.clothes.indexOf(clothes),
		};

		let akitailorAkitudeBaseImg = document.getElementById("akitudeBase");
		let akitailorAkitudeHatImg = document.getElementById("akitudeHat");
		let akitailorAkitudeClothesImg =
			document.getElementById("akitudeClothes");

		if (
			akitailorAkitudeBaseImg &&
			akitailorAkitudeHatImg &&
			akitailorAkitudeClothesImg
		) {
			let akinatorImg = document.querySelector(".akinator-body img");
			let currentEmotion = akinatorImg
				? akinatorImg.src
						.substring(akinatorImg.src.lastIndexOf("/") + 1)
						.replace(".png", ".webp")
				: "defi.webp";

			akitailorAkitudeBaseImg.src = chrome.runtime.getURL(
				"img/akinator/bases/" + base + "/" + currentEmotion
			);
			akitailorAkitudeHatImg.src = chrome.runtime.getURL(
				"img/akinator/hats/" + hat + "/" + currentEmotion
			);
			akitailorAkitudeClothesImg.src = chrome.runtime.getURL(
				"img/akinator/clothes/" + clothes + "/" + currentEmotion
			);

			akitailorAkitudeHatImg.style.opacity = hat === "none" ? "0" : "1";
			akitailorAkitudeClothesImg.style.opacity =
				clothes === "none" ? "0" : "1";
		}
	}
});
