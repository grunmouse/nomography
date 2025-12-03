const operators = {
	'-negate':{order:0, arity:1},
	'+number':{order:0, arity:1},
	'**':{order:1, right:true},
	'*':{order:2},
	'/':{order:2},
	'+':{order:3},
	'-':{order:3}
};

for(let [sign, obj]  of Object.entries(operators)){
	obj.sign = sign;
	obj.token = "operator";
	obj.arity = obj.arity || 2;
	obj.right = obj.right === true;
}

const engine = require('@grunmouse/equation-engine');

/**
 * @param functions : Array<String> - имена доступных функций
 */
function equationLexer(str, functions){
	/*
	Константы
		целые
			десятичные \d+
			двоичные 0b[01]+
			шестнадцатеричные 0x[0-9A-Fa-f]+
		с плавающей точкой
			\d+(?:\.\d+)?(?:[eE][+-]?\d+)?
	Имена
		[A-Za-z][A-Za-z_0-9]*
	Операторы
		арифметические
			\*\*|[-+/*]
	Скобки
		\(|\)
	Разделитель аргументов в функции
		,
	*/
	
	const reLex = /0b[01]+|0x[0-9A-Fa-f]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z][A-Za-z_0-9]*|\*\*|[-+*/]|\(|\)|,/g
	
	let tokens = str.split(/\s+/).map((s)=>(s.match(reLex))).flat();
	let operand = false;
	for(let i=0; i<tokens.length; ++i){
		let token = tokens[i];
		let first = token[0];
		if(/\d/.test(first)){
			//число
			let value, type;
			if(token[1]=="b" || token[1]==="x"){
				value = parseInt(token);
			}
			else{
				value = parseFloat(token);
			}
			tokens[i] = {token:'literal', value, str:token};
			operand=true;
		}
		else if(/^[A-Za-z]/.test(first)){
			//имя
			if(functions.includes(token)){
				tokens[i] = {token:"function", name:token, arity:-1};
				operand = false;
			}
			else{
				tokens[i] = {token:"variable", name:token};
				operand = true;
			}
		}
		else{
			if(token === "("){
				tokens[i] = {token:"open", sign:token};
				operand = false;
			}
			else if(token === ")"){
				tokens[i] = {token:"close", sign:token};
				operand = true;
			}
			else if(token === ','){
				tokens[i] = {token:"colon", sign:token};
				operand = false;
			}
			else if(token === "-"){
				if(operand){
					tokens[i] = operators["-"];
					operand = false;
				}
				else{
					tokens[i] = operators["-negate"];
				}
			}
			else if(token === "+"){
				if(operand){
					tokens[i] = operators["+"];
					operand = false;
				}
				else{
					tokens[i] = operators["+number"];
				}
			}
			else{
				let oper = operators[token];
				if(oper){
					tokens[i] = oper;
					operand = false;
				}
				else{
					throw new Error(`Unknown token ${token}`);
				}
			}
		}
			
	}
	
	return tokens;
}


module.exports = {
	operators,
	equationLexer,
	shuntingYard:engine.shuntingYard
};