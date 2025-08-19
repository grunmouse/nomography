const {
	toPS,
	toJS
} = require('./compil.js');

const RationalNumber = require('../rational-number.js');

function buildJSFunction(name, argname, code){
	return `const ${name} = (${argname})=>(${code});`;
}

function buildPSFunction(name, argname, code){
	return `/${name} {
	0 dict begin
		/${argname} exch def
		${code}
	end
} def`;
}

function buildJSConst(name, code){
	return `const ${name} = ${code};`;
}

function buildPSConst(name, code){
	return `/${name} ${code} def`;
}

function handleJSLiteral(token){
	let value = RationalNumber.parseDecimal(token.str);
	if(value.isInteger()){
		return token.value;
	}
	else{
		return value.serialize();
	}
}

function handleFunctions(system, declared){
	let functions = Object.assign(
		Object.fromEntries(declared.map(name=>([name,name]))),
		system
	);
	for(let key in functions){
		let func = functions[key];
		if(typeof func === "string"){
			functions[key] = {name:func, arity:1};
		}
		else{
			func.arity = func.arity || 1;
		}
	}
	
	return functions;
	
}

function builder(compil, toConst, toFunc, handleLiteral){
	return function(config, functions){
		functions = handleFunctions(functions, config.functions);
		
		let coderows = config.rows.map(({rowtype, name, argname, poliz, source})=>{
			let code = compil(poliz, functions, handleLiteral);
			if(rowtype === 'function'){
				return toFunc(name, argname, code);
			}
			else if(rowtype === 'const'){
				return toConst(name, code);
			}
		});
		
		let code = coderows.join('\n');
		
		return code;
	}
	
}

const buildJsConfig = builder(toJS, buildJSConst, buildJSFunction, handleJSLiteral);
const buildPsConfig = builder(toPS, buildPSConst, buildPSFunction);

module.exports = {
	buildJsConfig,
	buildPsConfig
};