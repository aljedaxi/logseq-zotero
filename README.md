# logseq x zotero

## how to use

first, clone your logseq repo. 

```
API_KEY=this is my api key, that i made by going to https://www.zotero.org/settings/keys
USER_ID=this is my user id, that's listed at https://www.zotero.org/settings/keys
BIB_FILE_TITLE=title for the file that links to all created files; optional
export API_KEY USER_ID; node ./index.js ${pathToMyLogseqInstance}/pages
```

this will access your zotero library and create a file called `z_${titleOfWorkLowerSnakeCase}.md`, with the title of the work as the title. each file has the title of the work as the title, so you can reference it in logseq as [[title of the work]].  a link to every added file is put into `${BIB_FILE_TITLE.toLowerCase().replace(/\s+/, '_')}`, a little bibliography of sorts.

it only writes files that don't currently exist, so feel free to add notes to created files.

if you want a different file name or file title, go into index.js and replace the function `makeName` with anything with the same signature.  the function takes as input the data property of https://gist.github.com/dstillman/f1030b9609aadc51ddec and returns `Maybe<{title: string; fileName: string}>`. follow your heart.
