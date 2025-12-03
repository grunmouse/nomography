const {
	toPS,
	toJS
} = require('./compil.js');

const {RationalNumber} = require('../rational-number/index.js');

function buildJSFunction(name, argnames, code){
	return `const ${name} = (${argnames.join(',')})=>(${code});`;
}

function buildPSFunction(name, argnames, code){
	let argdef = argnames.map((argname)=>(`\t\t/${argname} exch def`)).reverse().join('\n');
	return `/${name} {
	0 dict begin
${argdef}
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
		return `new RationalNumber(${value.nom}, ${value.den})`;
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
		
		let coderows = config.rows.map(({rowtype, name, argnames, poliz, source})=>{
			let code = compil(poliz, functions, handleLiteral);
			if(rowtype === 'function'){
				return toFunc(name, argnames, code);
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