function curveToPS(curve, keys, curveName, caption){
	const arrays = new Map(keys.map(key=>([key,[]])));
	const points = curve.points, len = points.length;
	//const report = curve.analyse();
	for(let i=0; i<len; ++i){
		for(let key of keys){
			let arr = arrays.get(key);
			arr[i]=points[i][key].toPrecision(9);
		}
	}
	let code = [];
	let headCode = '/'+ curveName + ' ' + (keys.length+1) + ' dict dup begin';
	code.push(headCode);
	code.push('/caption ' + caption + ' def');
	for(let key of keys){
		let arr = arrays.get(key);
		let codeRow = '/'+key +' ['+arr.join(' ')+'] def';
		code.push(codeRow);
	}
	
	code.push(curveParts(curve, keys.filter(key=>(!curve.coords.includes(key)))));
	
	let footCode = 'end def';
	
	code.push(footCode);
	
	return code.join('\n');
}

function curveParts(curve, keys){
	let result = [];
	for(let key of keys){
		let report = curve.analyse(key);
		let isOnePart = (report.parts.length === 1);
		let psParts = [];
		for(let part of report.parts){
			let {begin, sign, last} = part;
			let fun = [];
			if(!isOnePart){
				fun.push(begin, last+1, 'slice');
			}
			if(sign<0){
				fun.push('reverse');
			}
			//if(fun.length>0){
				fun.unshift('{');
				fun.push('}');
			//}
			psParts.push(fun.join(' '));
		}
		result.push(['/'+key+'_parts', '[', ...psParts, ']', 'def'].join(' '));
	}
	return result.join('\n');
}

function numOrRat(value){
	if(typeof value === 'number'){
		return value;
	}
	else if(value.simple){
		return '['+value.simple().join()+']';
	}
}

function scaleToPS(table, level){
	if(level == null){
		level = (a)=>(a);
	}
	else if(typeof level == 'number'){
		let value = level;
		level = ()=>(value);
	}
	if(!level.call){
		throw new TypeError('Argument "level" can by missing, number or function');
	}

	let result = [];
	for(let point of table){
		if(point.muteGroup){
			let gr = point.muteGroup;
			let {step, prev, min, max, two, levels} = gr;
			if(!two){
				result.push([
					numOrRat(min), 
					numOrRat(max), 
					numOrRat(step), 
					level(levels), 
					'mutegroup'
				].join(' '));
			}
			else{
				result.push([
					numOrRat(min), 
					numOrRat(max), 
					numOrRat(step), 
					level(levels), 
					numOrRat(prev),
					'mutegroup2'
				].join(' '));
			}
		}
		result.push([+point.a, 'value'].join(' '));
	}
	
	return result.join('\n');
}

function manyCurvesToPS(curves, keys){
	let code = curves.map(curve=>curveToPS(curve, keys, curve.name + curve.caption, curve.caption));
	return code.join('\n\n');
}

module.exports = {curveToPS,manyCurvesToPS,scaleToPS};