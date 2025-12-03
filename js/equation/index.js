
const {
	funJS,
	funPS
} = require('./functions.js');

const functions = Object.keys(funJS);

const {
	buildJsConfig,
	buildPsConfig
} = require('./build-config.js');

const parseConfig = require('./parse-config.js');

function convertConfig(source){
	let config = parseConfig(source, functions);
	
	let js = buildJsConfig(config, funJS);
	
	let exported = config.functions.filter(name=>(!functions.includes(name))).concat(config.variables);
	
	js += "\nmodule.exports = {" + exported.join(", ")+"};\n";
	
	let ps = buildPsConfig(config, funPS);
	
	return {js, ps};
}

const evalConfig = require('./eval-config.js');

module.exports = {
	convertConfig,
	evalConfig
};