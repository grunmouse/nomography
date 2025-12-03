const {
	equationLexer,
	shuntingYard
} = require('./parser.js');


function parseConfig(code, funcs){
	let rows = code.split(/[\r\n]+/g);
	const functions = [...funcs];
	const variables = [];
	rows = rows.filter(row=>(row.indexOf("=")>-1 && !/^\s*\/\//.test(row))).map(row=>{
		row = row.replace(/^\s*const\s+/,'').replace(/;.*$/,'');
		
		if(row.indexOf("=>")>-1){
			let m = row.match(/^([^=]+)=([^=]+)=>(.+)$/).map(a=>a.trim());
			let [_, name, argnames, source] = m;
			let tokens = equationLexer(source, functions);
			let poliz = shuntingYard(tokens);
			
			argnames = argnames.split(',').map((argname)=>(argname.match(/[A-Za-z][A-Za-z_0-9]*/)[0])).filter(a=>(a));
			
			functions.push(name);
			
			return {rowtype:'function', name, arity: argnames.length, argnames, source, poliz};
		}
		else{
			let m = row.match(/^([^=]+)=(.+)$/).map(a=>a.trim());
			let [_, name, source] = m;
			let tokens = equationLexer(source, functions);
			let poliz = shuntingYard(tokens);
			
			variables.push(name);
			return {rowtype:'const', name, source, poliz};
		}
	});
	
	return {functions, variables, rows};
}

module.exports = parseConfig;