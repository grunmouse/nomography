const jsoperators = {
	'-negate':"-",
	'+number':"+",
	'**':"**",
	'*':"*",
	'/':"/",
	'+':"+",
	'-':"-"
};

const psoperators = {
	'-negate':"neg",
	'+number':"",
	'**':"exp",
	'*':"mul",
	'/':"div",
	'+':"add",
	'-':"sub"
};


const brkt = (x)=>(`(${x})`);

function toJS(tokens, functions){
	const stack = [];
	
	for(let token of tokens){
		if(token.token === "literal"){
			stack.push({order:-1, code:token.value});
		}
		else if(token.token === "variable"){
			stack.push({order:-1, code:token.name});
		}
		else if(token.token === "operator"){
			if(token.arity === 1){
				let x = stack.pop();
				x = (x.order < token.order) ? x.code : brkt(x.code);
				let code = jsoperators[token.sign] + x;
				stack.push({order:token.order, code});
			}
			else{
				let y = stack.pop();
				let x = stack.pop();
				
				if(token.right){
					x = (x.order < token.order) ? x.code : brkt(x.code);
					y = (y.order <= token.order) ? y.code : brkt(y.code);
				}
				else{
					x = (x.order <= token.order) ? x.code : brkt(x.code);
					y = (y.order < token.order) ? y.code : brkt(y.code);
				}
				
				let code = x + jsoperators[token.sign] + y;
				stack.push({order:token.order, code});
			}
		}
		else if(token.token === "function"){
			let func = functions[token.name];
			let arity = token.arity || 1;
			let args = stack.splice(stack.length - arity, arity);
			args = args.map((arg)=>(arg.code));
			
			let code = func.name + "(" + args.join(",") + ")";
			stack.push({order:-1, code});
		}
	}
	
	if(stack.length !== 1){
		console.log(stack);
		throw new Error("Error in equation!");
	}
	
	return stack[0].code;
}


function toPS(tokens, functions){
	let words = tokens.map((token)=>{
		if(token.token === "literal"){
			return ""+token.value;
		}
		else if(token.token === "variable"){
			return token.name;
		}
		else if(token.token === "operator"){
			return psoperators[token.sign];
		}
		else if(token.token === "function"){
			return functions[token.name].name;
		}
	});
	return words.join(" ");
}

module.exports = {
	toPS,
	toJS
};