//const {flags} = require('@grunmouse/binary');

/**
 * Прореживает точки, удаляя некоторые из них в тех местах, где они слишком частые
 */
function downsinglePoints(group, dist, metric){
	let minmaxD = Infinity, selgroup = group;

	let vars = generateVariants(group, dist, metric);
	
	//const debugMap = [];
	for(let points of vars){
		let maxD = points.reduce((d, p, i)=>(i=== 0 ? 0 : Math.max(d, metric(p, points[i-1]))), 0);
		if(maxD < minmaxD){
			minmaxD = maxD;
			selgroup = points;
		}
		//debugMap.push([points, points.maxD]);
	}
	
	//debugMap.sort(([A, ad], [B, bd])=>(ad-bd));
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

module.exports = {
	downsinglePoints
}