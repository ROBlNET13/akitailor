import { transform } from "esbuild";
import fs from "fs/promises";
import path from "path";
import os from "os";
import fg from "fast-glob";
import JSZip from "jszip";

// make a temporary build directory
const buildDir = path.join(os.tmpdir(), `akitailor-build-${Date.now()}`);
await fs.mkdir(buildDir, { recursive: true });

// copy everything in the current directory to the
// build directory, excluding things in .gitignore
const ignorePatterns = (await fs.readFile(".gitignore", "utf-8"))
	.split("\n")
	.filter((line) => line && !line.startsWith("#"));

const entries = await fg.sync(["**/*"], {
	ignore: [...ignorePatterns, ".git", ".git/**", "node_modules/**"],
	dot: true,
});

for (const entry of entries) {
	const srcPath = path.join(process.cwd(), entry);
	const destPath = path.join(buildDir, entry);
	await fs.mkdir(path.dirname(destPath), { recursive: true });
	await fs.copyFile(srcPath, destPath);
}

// minify js files in the build directory
const jsFiles = await fg.sync(["**/*.js"], {
	cwd: buildDir,
});

for (const jsFile of jsFiles) {
	// skip minifying the build script itself
	if (jsFile === "build.js") continue;

	const filePath = path.join(buildDir, jsFile);
	try {
		const code = await fs.readFile(filePath, "utf-8");
		const result = await transform(code, {
			minify: true,
			target: "es2015",
		});
		await fs.writeFile(filePath, result.code, "utf-8");
		console.log(`✓ Minified: ${jsFile}`);
	} catch (error) {
		console.warn(`⚠ Failed to minify ${jsFile}: ${error.message}`);
		console.warn(`  Keeping original file.`);
	}
}

// minify json files in the build directory
const jsonFiles = await fg.sync(["**/*.json"], {
	cwd: buildDir,
});

for (const jsonFile of jsonFiles) {
	const filePath = path.join(buildDir, jsonFile);
	try {
		const content = await fs.readFile(filePath, "utf-8");
		const parsed = JSON.parse(content);
		const minified = JSON.stringify(parsed);
		await fs.writeFile(filePath, minified, "utf-8");
		console.log(`✓ Minified: ${jsonFile}`);
	} catch (error) {
		console.warn(`⚠ Failed to minify ${jsonFile}: ${error.message}`);
		console.warn(`  Keeping original file.`);
	}
}

// minify css files in the build directory
const cssFiles = await fg.sync(["**/*.css"], {
	cwd: buildDir,
});

for (const cssFile of cssFiles) {
	const filePath = path.join(buildDir, cssFile);
	try {
		const code = await fs.readFile(filePath, "utf-8");
		const result = await transform(code, {
			loader: "css",
			minify: true,
		});
		await fs.writeFile(filePath, result.code, "utf-8");
		console.log(`✓ Minified: ${cssFile}`);
	} catch (error) {
		console.warn(`⚠ Failed to minify ${cssFile}: ${error.message}`);
		console.warn(`  Keeping original file.`);
	}
}

// minify html files in the build directory
const htmlFiles = await fg.sync(["**/*.html"], {
	cwd: buildDir,
});

for (const htmlFile of htmlFiles) {
	const filePath = path.join(buildDir, htmlFile);
	try {
		const code = await fs.readFile(filePath, "utf-8");
		// simple html minification: remove extra whitespace and comments
		const minified = code
			.replace(/<!--[\s\S]*?-->/g, "") // remove html comments
			.replace(/>\s+</g, "><") // remove whitespace between tags
			.replace(/\s{2,}/g, " ") // replace multiple spaces with single space
			.trim();
		await fs.writeFile(filePath, minified, "utf-8");
		console.log(`✓ Minified: ${htmlFile}`);
	} catch (error) {
		console.warn(`⚠ Failed to minify ${htmlFile}: ${error.message}`);
		console.warn(`  Keeping original file.`);
	}
}

// delete these root level files if they exist
const filesToDelete = [
	".gitignore",
	".prettierignore",
	".prettierrc",
	"build.js",
	"ideas.txt",
	"package.json",
	"pnpm-lock.yaml",
	"package-lock.json",
	"pnpm-workspace.yaml",
	"README.md",
];

for (const fileName of filesToDelete) {
	const filePath = path.join(buildDir, fileName);
	try {
		await fs.unlink(filePath);
		console.log(`✓ Deleted: ${fileName}`);
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.warn(`⚠ Failed to delete ${fileName}: ${error.message}`);
		}
	}
}

// recursively delete files prefixed with a dot
async function deleteDotFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.name.startsWith(".")) {
			if (entry.isDirectory()) {
				await fs.rm(entryPath, { recursive: true, force: true });
				console.log(`✓ Deleted directory: ${entryPath}`);
			} else {
				await fs.unlink(entryPath);
				console.log(`✓ Deleted file: ${entryPath}`);
			}
		} else if (entry.isDirectory()) {
			await deleteDotFiles(entryPath);
		}
	}
}

await deleteDotFiles(buildDir);

// create a zip of the build directory
const zip = new JSZip();

async function addFolderToZip(folderPath, zipFolder) {
	const entries = await fs.readdir(folderPath, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(folderPath, entry.name);
		if (entry.isDirectory()) {
			const newZipFolder = zipFolder.folder(entry.name);
			await addFolderToZip(entryPath, newZipFolder);
		} else {
			const fileData = await fs.readFile(entryPath);
			zipFolder.file(entry.name, fileData);
		}
	}
}

const outputDir = path.join(process.cwd(), "build");
await fs.mkdir(outputDir, { recursive: true });

await addFolderToZip(buildDir, zip);

const zipContent = await zip.generateAsync({ type: "nodebuffer" });
const zipPath = path.join(outputDir, "akitailor.zip");
await fs.writeFile(zipPath, zipContent);

console.log(`\n✓ Build complete: ${zipPath}`);
