async function setIcon(
	base = "base_current",
	hat = "turban",
	clothes = "orient"
) {
	const offscreenCanvas = new OffscreenCanvas(128, 128);
	const ctx = offscreenCanvas.getContext("2d");

	const [img1, img2, img3] = await Promise.all([
		loadImage(`img/akinator/bases/${base}/defi.webp`),
		loadImage(`img/akinator/clothes/${clothes}/defi.webp`),
		loadImage(`img/akinator/hats/${hat}/defi.webp`),
	]);

	const scale = 427 / Math.max(img1.width, img1.height);
	const w = img1.width * scale;
	const h = img1.height * scale;
	const x = (128 - w) / 2 - 16;
	const y = 128 - h / 2;

	ctx.drawImage(img1, x, y, w, h);
	ctx.drawImage(img2, x, y, w, h);
	ctx.drawImage(img3, x, y, w, h);

	const imageData = ctx.getImageData(0, 0, 128, 128);
	chrome.action.setIcon({ imageData });
}

async function loadImage(path) {
	const url = chrome.runtime.getURL(path);
	const response = await fetch(url);
	const blob = await response.blob();
	const imageBitmap = await createImageBitmap(blob);
	return imageBitmap;
}

chrome.storage.local.get(["akitailorSave"], (result) => {
	if (result.akitailorSave) {
		const { base, hat, clothes } = result.akitailorSave;
		setIcon(base, hat, clothes);
	} else {
		setIcon();
	}
});

chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "newCostume") {
		const { base, hat, clothes } = message.data;
		setIcon(base, hat, clothes);
	}
});
