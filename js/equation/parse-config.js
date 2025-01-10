const {
	equationLexer,
	shuntingYard
} = require('./parser.js');


function parseConfig(code, funcs){
	let rows = code.split(/[\r\n]+/g);
	const functions = [...funcs];
	const variables = [];
	rows = rows.filter(row=>(row.indexOf("=")>-1)).map(row=>{
		row = row.replace(/^const\s+/,'').replace(/;.*$/,'');
		
		if(row.indexOf("=>")>-1){
			let m = row.match(/^([^=]+)=([^=]+)=>(.+)$/).map(a=>a.trim());
			let [_, name, argname, source] = m;
			let tokens = equationLexer(source, functions);
			let poliz = shuntingYard(tokens);
			
			argname = argname.match(/[A-Za-z][A-Za-z_0-9]*/)[0];
			
			functions.push(name);
			return {rowtype:'function', name, argname, source, poliz};
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