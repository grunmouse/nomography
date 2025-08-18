const functions = ["log", "sqrt", "log10"];


const funJS = {
	"log":"Math.log",
	"sqrt":"Math.sqrt",
	"log10":"Math.log10"
};

const funPS = {
	"log":"ln",
	"sqrt":"sqrt",
	"log10":"log"
};

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

module.exports = {
	convertConfig
};