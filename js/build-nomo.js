const fmt = require('@grunmouse/format-recursive');

const fs = require('fs');

const promisify = require('util').promisify;
const child_process = require('child_process');


const rePsFileExt = /(?:-tmp|-prod)?\.ps$/
const rePdfFileExt = /\.pdf$/

function buildTmpFileSync(sourceFile, env){
	const tmp = fs.readFileSync(sourceFile,{ encoding:'utf-8'});
	const code = fmt.use(tmp, env);
	const prodps = sourceFile.replace(rePsFileExt, '-prod.ps');
	const outFile = sourceFile.replace(rePsFileExt, '.pdf');
	fs.writeFileSync(prodps,  code);
	return child_process.execSync(`ps2pdf -dNOSAFER ${prodps} ${outFile}`);
}

function buildTmpCodeSync(tmp, env, outFile){
	const code = fmt.use(tmp, env);
	const prodps = outFile.replace(rePdfFileExt, '-prod.ps');
	fs.writeFileSync(prodps,  code);
	return child_process.execSync(`ps2pdf -dNOSAFER ${prodps} ${outFile}`);
}

function buildPsFileSync(inFile, outFile){
	return child_process.execSync(`ps2pdf -dNOSAFER ${inFile} ${outFile}`);
}

module.exports = {
	buildTmpFileSync,
	buildTmpCodeSync,
	buildPsFileSync
};