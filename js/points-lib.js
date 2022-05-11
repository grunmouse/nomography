const {flags} = require('@grunmouse/binary');

/**
 * Проверяет группу точек на минимальное деление
 */
function ctrlGroup(points, min){
	for(let pair of pairsUp(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<min){
			return false;
		}
	}
	return true;
}

/**
 * Прореживает точки, удаляя некоторые из них в тех местах, где они слишком частые
 */
function downsinglePoints(points, labeldist){
	for(let group of unfullGroupDown2(points, labeldist)){
		
		let index = points.indexOf(group[0]), length = group.length;

		group = handleUnfull(group, labeldist.min);
		
		points.splice(index, length, ...group);
	}
	
	return points;
}


function handleUnfull(group, min){
	const length = group.length;
	const first = group[0];
	const last = group[length-1];
	const count = BigInt(length-2);
	const over = 1n<<count;


	const gen = function *(first, over){
		for(let mask = 0n; mask<over; ++mask){
			let points = [first].concat(flags.flagNumbers(mask).map((i)=>(group[Number(i)+1])), last);
			yield points;
		}
	};
	let minmaxD = Infinity, selgroup = group;

	const debugMap = [];
	for(let points of filterVariants(gen(first, over), min)){
		if(points.maxD < minmaxD){
			minmaxD = points.maxD;
			selgroup = points;
		}
		debugMap.push([points, points.maxD]);
	}
	
	debugMap.sort(([A, ad], [B, bd])=>(ad-bd));
	//console.dir(debugMap.slice(0,2), {depth:4});
	
	return selgroup;
}


function * filterVariants(genPoint, min){

	byvalue:for(let points of genPoint){
		let maxD = 0;
		//Контроль дистанций
		for(let pair of pairsUp(points)){
			let [cur, next, i] = pair;
			let d = Math.hypot(next.x - cur.x, next.y - cur.y);
			if(d<min){
				continue byvalue;
			}
			if(d >= maxD){
				maxD = d;
			}
		}
		points.maxD = maxD;
		yield points;
	}
}


function *unfullGroupDown2(points, dist){
	let group, after;
	for(let pair of pairsDown(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<=dist.min){
			if(group){
				group.unshift(cur);
			}
			else{
				group = after ? [cur, next, after] : [cur, next];
			}
		}
		else{
			if(d<=dist.max){
				if(group){
					group.unshift(cur);
					yield group;
					group = null;
					after = next;
				}
				else{
					after = next;
				}
			}
			else{
				if(group){
					yield group;
					group = null;
					after = null;
				}
				else{
					after = null;
				}
			}
		}
	}
	if(group){
		yield group;
		group = null;
	}	
}


function *groupPointsDown(points, dist){

	const pairs = pairsDown(points);
	
	const queue = []; //Очередь чтения
	
	const EOF = 1, SHORT = 2, MIDDLE = 4, LONG = 8;
	
	/**
	 * Читает очередной токен или генерирует токен <EOF>
	 */
	const doread = ()=>{
		let item = tokens.next();
		if(item.done){
			return {type:EOF};
		}
		else{
			let pair = item.value;
			let [cur, next, i] = pair;
			let d = Math.hypot(next.x - cur.x, next.y - cur.y);
			let type;
			if(d<=dist.min){
				type = SHORT;
			}
			else if(d<=dist.max){
				type = MIDDLE;
			}
			else{
				type = LONG;
			}
			pair = [cur, next];
			pair.index = i;
			return {type, pair, d, index:i};
		}
	};
	
	const read = ()=>{
		if(queue.length){
			return queue.shift();
		}
		else{
			return doread();
		}
	}
	
	const view = (count)=>{
		while(queue.length<count){
			queue.push(doread());
		}
		return queue.slice(0, count);
	}
	
	let group;
	const intoGroup = (pair)=>{
		if(group){
			group.unshift(pair[0]);
			group.index = pair.index;
		}
		else{
			group = pair;
		}
	}
	
	while(true){
		let item = read();
		if(item.type === SHORT){
			intoGroup(item.pair);
		}
		else if(item.type === MIDDLE){
			if(group){
				let prev = view(1);
				if(prev[0].type === SHORT){
					intoGroup(item.pair);
				}
				else{
					intoGroup(item.pair);
					yield group;
					group = null;
				}
			}
			else{
				let prev = view(1);
				if(prev[0].type === SHORT){
					intoGroup(item.pair);
				}
			}
		}
		else if(item.type === LONG){
			if(group){
				let prev = view(1);
				if(prev.type === SHORT){
					yield group;
					group = null;
					yield item.pair;
				}
				else{
					if(group.length < 4){
						intoGroup(item.pair);
						yield group;
						group = null;
					}
					else{
						yield group;
						group = null;
						yield item.pair;
					}
				}
			}
			else{
				yield item.pair;
			}
		}
		else if(item.type === EOF){
			if(group){
				yield group;
			}
			break;
		}
	}
	
}



/**
 * Генерирует пары значений массива от начала к концу
 */
function * pairsUp(arr){
	let len = arr.length-1;
	for(let i=0; i<len; ++i){
		let pair = arr.slice(i, i+2).concat(i);
		yield pair;
	}	
}

/**
 * Генерирует пары значений массива от конца к началу
 */
function * pairsDown(arr){
	let len = arr.length-1;
	for(let i=len; i--;){
		let pair = arr.slice(i, i+2).concat(i);
		yield pair;
	}	
}

module.exports = {
	pairsDown,
	pairsUp,
	unfullGroupDown2,
	downsinglePoints,
	ctrlGroup
}