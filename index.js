const {
	justs,
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
		fs.writeFile(filePath, fileData, (err) => {
			if (err) res (Left (err.message));
			res (Right (`wrote file ${filePath}`));
		});
	});

const writeFileIfDoesntExist = filePath => fileData =>
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

const fileTitleThing = title => links =>
`\
---
title: ${title}
---

${map (link => `\
## [[${link}]]

`) (links).join('')}
`

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

const writeFiles = ({outDir, bibFileTitle}) => fileStuffs => {
	const titles = map (prop ('title')) (justs (fileStuffs));
	const bibData = fileTitleThing (bibFileTitle) (titles);
	return Promise.all([
		...fileStuffs.map(
			maybe (
				Promise.resolve (Left ('someone didn\'t have a title'))
			) (
				({title, fileName}) => 
					writeFileIfDoesntExist(`${outDir}/${fileName}.md`)(emptyFileWithTitle(title))
			)
		),
		writeFilePromised (`${outDir}/${bibFileTitle.replace(/\s+/g, '_').toLowerCase()}.md`) (bibData)
	]);
};

const main = ({outDir, apiKey, userId, bibFileTitle = 'Zotero Bibliography'}) => 
	fetch(`https://api.zotero.org/users/${userId}/items`, {
		method: 'GET',
		headers: { 'Zotero-API-Key': apiKey },
	})
	.then(r => r.json())
	.then(map (({data}) => makeName (data)))
	.then(writeFiles ({outDir, bibFileTitle}))
	;

const {API_KEY: apiKey, USER_ID: userId, BIB_FILE_TITLE: bibFileTitle} = process.env;
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
	main ({outDir: outDir.endsWith('/') ? outDir.slice(0, -1) : outDir, apiKey, userId, bibFileTitle})
		.then(console.log);
});
