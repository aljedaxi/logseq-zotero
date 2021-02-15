const {
	prop, 
	map,
	splitOn,
	head,
	fromMaybe,
	pipe,
	isNothing,
	Left,
	Right,
} = require ('sanctuary');

const fetch = require('node-fetch');
const fs = require('fs');

const maybe = ifBad => ifGood => m => 
	isNothing (m) ? ifBad : ifGood (m.value);

const writeFilePromised = filePath => fileData =>
	new Promise((res, rej) => {
		fs.stat(filePath, (err, stat) => {
			// ENOENT means the file exists
			if (err?.code !== 'ENOENT') {
				res (Left (err === null ? `file ${filePath} exists` : err.message));
				return;
			}
			fs.writeFile(filePath, fileData, (err) => {
				if (err) res (Left (err.message));
				res (Right (`wrote file ${filePath}`));
			});
		});
	});

const emptyFileWithTitle = title => 
`\
---
title: ${title}
---

##
`;

/**
 * this takes the data property of https://gist.github.com/dstillman/f1030b9609aadc51ddec as its input
 * @returns {Object} Maybe an object with keys title and fileName
 */
const makeName = pipe([
	prop ('title'),
	splitOn (':'),
	head,
	map (title => ({
		title, 
		fileName: `z_${title.replace(/\s+/g, '_').toLowerCase()}`
	})),
]);

const writeFiles = dir => fileStuffs => 
	Promise.all(
		fileStuffs.map(
			maybe (
				Promise.resolve (undefined)
			) (
				({title, fileName}) => 
					writeFilePromised(`${dir}/${fileName}.md`)(emptyFileWithTitle(title))
			)
		)
	);

const main = ({outDir, apiKey, userId}) => 
	fetch(`https://api.zotero.org/users/${userId}/items`, {
		method: 'GET',
		headers: { 'Zotero-API-Key': apiKey },
	})
	.then(r => r.json())
	.then(trace)
	.then(map (({data}) => makeName (data)))
	.then(writeFiles (outDir))
	;

const {API_KEY: apiKey, USER_ID: userId} = process.env;
const outDir = process.argv.pop();
if (!apiKey || !userId || !outDir || outDir.includes('index')) {
	console.error('something\'s wrong here.', {apiKey, userId, outDir});
	return;
};

fs.stat(outDir, err => {
	if (err) {
		console.error(`${outDir} isn't a directory. please specify a directory to write to.`);
		return;
	}
	main ({outDir: outDir.endsWith('/') ? outDir.slice(0, -1) : outDir, apiKey, userId})
		.then(console.log);
});
