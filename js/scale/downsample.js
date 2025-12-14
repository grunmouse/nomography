const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		EQ,
		LT,
		GT,
		LE,
		GE
	}
} = require('@grunmouse/multioperator-ariphmetic');

/**
 * Проредить группу точек, если в ней есть слишком короткие деления
 */
function downsamplePoints(group, dist, metric){
	let minmaxD = Infinity, selgroup = group;

	let vars = downsampleVariants(group, dist, metric);
	
	//Выбор среди вариантов разбивки лучшего (УТОЧНИТЬ)
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
function * downsampleVariants(group, dist, metric){
	const mapCode = new WeakMap(group.map((p, i)=>([p, 1n<<BigInt(i)])));
	
	const codeIndex = (points)=>(points.reduce((akk, p)=>(akk + mapCode.get(p)), 0n));
	
	function getToDrop(points){
		const ubound = points.length-1;
		return Array.from(points, (b, i)=>{
			if(i === 0 || i === ubound){
				return {drop:0, leave:Infinity};
			}
			let a = points[i-1], c = points[i+1];
			
			let dist_a = dist.min/metric(a, b);
			let dist_c = dist.min/metric(b, c);
			 //Защищаем от удаления надписанный штрих, соседствующий с немым концом шкалы
			if(i===1 && a.anomal){
				dist_a = 0;
			}
			if(i=== ubound-1 && c.anomal){
				dist_c = 0;
			}
			
			let _min = Math.max(dist_a, dist_c);
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

module.exports = downsamplePoints;