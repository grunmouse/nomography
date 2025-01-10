const functions = ["log", "sqrt"];


const funJS = {
	"log":"Math.log",
	"sqrt":"Math.sqrt"
};

const funPS = {
	"log":"ln",
	"sqrt":"sqrt"
};

const {
	buildJsConfig,
	buildPsConfig
} = require('./build-config.js');

const parseConfig = require('./parse-config.js');

function convertConfig(source){
	let config = parseConfig(source, functions);
	
	let js = buildJsConfig(config, funJS);
	
	js += "\nmodule.exports = {" + config.functions.concat(config.variables).join(", ")+"};\n";
	
	let ps = buildPsConfig(config, funPS);
	
	return {js, ps};
}

module.exports = {
	convertConfig
};