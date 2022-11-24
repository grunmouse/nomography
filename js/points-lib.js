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
function downsinglePoints(points, labeldist, metric){
	return handleUnfull(points, labeldist, metric)
}



function handleUnfull(group, dist, metric){
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

	//let vars = filterVariants(gen(first, over), dist.min, metric);
	let vars = generateVariants(group, dist, metric);
	
	const debugMap = [];
	for(let points of vars){
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

/**
 * Генерирует варианты прореженной группы
 */
function * generateVariants(group, dist, metric){
	const mapCode = new WeakMap(group.map((p, i)=>([p, 1n<<BigInt(i)])));
	
	const codeIndex = (points)=>(points.reduce((akk, p)=>(akk + mapCode.get(p)), 0n));
	
	function getToDrop(points){
		const ubound = points.length-1;
		return Array.from(points, (b, i)=>{
			if(i === 0 || i === ubound){
				return {drop:0, leave:Infinity};
			}
			let a = points[i-1], c = points[i+1];
			
			let _min = dist.min / Math.min(metric(a,b), metric(b, c));
			let drop = _min < 1 ? 0 : _min;
			let _max = metric(a, c) / dist.max;
			let leave = _max < 1 ? 0 : _max;
			
			return {drop, leave, i};
		});
	}
	
	const queue = [], exists = new Set();
	const push = (points)=>{
		let i = codeIndex(points);
		if(!exists.has(i)){
			queue.push(points);
			exists.add(i);
		}
	};
	
	push(group);
	let index = 0;
	while(index < queue.length){
		let current = queue[index];
		
		let anote = getToDrop(current);
		
		let isAccept = anote.every(({drop})=>(drop === 0));
		
		if(isAccept){
			let maxD = current.reduce((d, p, i)=>(i=== 0 ? 0 : Math.max(d, metric(p, current[i-1]))), 0);
			current.maxD = maxD;
			yield current;
		}
		else{
			for(let a of anote){
				if(a.drop > 0){
					//Для каждой точки, назначенной на удаление, создаём вариант без этой точки
					let variant = current.filter((p, i)=>(i != a.i));
					push(variant);
				}
			}
		}
		++index;
	}
	
}


function * filterVariants(genPoint, min, metric){

	byvalue:for(let points of genPoint){
		let maxD = 0;
		//Контроль дистанций
		for(let pair of pairsUp(points)){
			let [cur, next, i] = pair;
			let d = metric(cur, next);
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


function *unfullGroupDown2(points, dist, metric){
	let group, after;
	for(let pair of pairsDown(points)){
		let [cur, next, i] = pair;
		let d = metric(cur, next);
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
	downsinglePoints
}