const inspect = Symbol.for('nodejs.util.inspect.custom');

const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		EQ,
		LT,
		GT
	}
} = require('@grunmouse/multioperator-ariphmetic');


function downsinglePoints(group, dist, metric){
	let minmaxD = Infinity, selgroup = group;

	let vars = downsingleVariants(group, dist, metric);
	
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
function * downsingleVariants(group, dist, metric){
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


/**
 * Разбивает слишком длинное деление
 */
function zwischenLabeled(f, metric, D, step,  levels, labeldist){
	if(levels.hasAllowStep(D, step)){ //Прореженные отрезки не делим
		return;
	}
	let lessUniversal = levels.getLessUniversalStep(step);
	
	let points = new Points(f, metric, D, lessUniversal, levels, labeldist);
	
	if(points.downsingled){
		return points.expand();
	}
	else{
		let steps = levels.getLessStepVariants(step);
		if(steps.length>0){
			let groups = steps.map((step)=>{
				return new Points(f, metric, D, step, levels, labeldist).downsingle().expand();
			});
			
			const cmp = (a, b)=>(b.length - a.length || b.full - a.full || a.maxD() - b.maxD());
			groups.sort(cmp);
			
			if(groups[1] && cmp(groups[0], groups[1]) === 0){
				//debugger;
			}
			
			return groups[0];
		}
		else{
			return points.downsingle().expand();
		}
	}
	
	return createLabeled(f, D, levels, labeldist);
	
}


/**
 *
 * @typevar V - объект, представляющий числовое значение, или числовой скаляр. Библиотека абстрагирована от реализации этого типа.
 *
 * @typedef P : Object - структура, представляющая точку с одной числовой пометкой
 * @property a : V - числовая пометка точки
 * @property x : number - абсцисса точки
 * @property y : number - ордината точки
 *
 * @class Poins
 * представляет множество помеченных точек некоторой шкалы;
 * хранит информацию о функции, для которой строится шкала, правилах построения шкалы и диапазон построения;
 * предоставляет интерфейс для изменения множества помеченных точек;
 * хранит признаки завершённости некоторых манипуляций.
 * @property f : Object - пара функций, отображающих значение числовой пометки точки, на её координаты
 * @property f.x : Function<(V)=>(number)>
 * @property f.y : Function<(V)=>(number)>
 * @property fun : Function<(V)=>(P)> - функция, создающая точку, для заданной числовой пометки.
 * @property metric : Function<(P, P)=>(number)> - функция метрики, отображающая пару точек на расстояние между ними
 * @property levels : Levels - объект, представляющий множество цен деления, которое применяется при построении шкалы
 * @property labeldist : Object
 * @property labeldist.max : number - наибольшее расстояние между надписанными штрихами
 * @property labeldist.min : number - наименьшее расстояние между надписанными штрихами
 * @property step : V - заданная наибольшая цена деления, с которой начинается построение шкалы
 * @property points : Array<P> - массив помеченных точек
 * @property downsingled : Boolean - признак выполнения требования labeldist.min
 * @property fulled : Boolean - признак выполнения требования labeldist.max
 * @property edited : Boolean - признак наличия ручных изменений в наборе точек (после этого нельзя применять автоматические методы)
 * @property full : Boolean - признак того, что требование labeldist.min выполняется изначально, без прореживания
 *
 */

class PointsBase{

	constructor(points, metric, levels, labeldist){
		this.metric = metric;
		this.levels = levels;
		this.labeldist = labeldist;
		
		this.points = points;

		this.downsingled = this.full = this.ctrlMin(labeldist.min);
		this.fulled = this.ctrlMax(labeldist.max);
		this.edited = false;
	}
	
	/**
	 * Генерирует пары значений массива от конца к началу
	 */
	*pairsLast(){
		let arr = this.points;
		let len = arr.length-1;
		for(let i=len; i--;){
			let pair = arr.slice(i, i+2).concat(i);
			yield pair;
		}	
	}
	
	*pairs(){
		let arr = this.points;
		let len = arr.length-1;
		for(let i=0; i<len; ++i){
			let pair = arr.slice(i, i+2).concat(i);
			yield pair;
		}	
	}
	
	/**
	 * Заменяет пару точек группой. Две точки будут удалены, а вместо них в массив будут добавлены новые точки
	 * @param index : number - индекс первой удаляемой точки
	 * @param group : Points - объект, представляющий вставляемые точки
	 */
	pairToGroup(index, group){
		if(group){
			this.points.splice(index, 2, ...group.points);
			this.edited = true;
		}
	}
	
	dropPoint(index){
		if(index == 0 || index == this.length -1){
			return;
		}
		
		let p = this.points.splice(index, 1);
		
		let removed = p._removed || [];
		removed.push(p.a);
		let cur = this.points[index];
		
		if(!cur._removed){
			cur._removed = [];
		}
		
		cur._removed.push(...removed);
		cur._removed(sort);
	}
	
	map(fun){
		return this.points.map(fun);
	}
	
	get length(){
		return this.points.length;
	}
	
	ctrlMin(min){
		for(let pair of this.pairsLast()){
			let [cur, next, i] = pair;
			let d = this.metric(next, cur);
			if(d<min){
				return false;
			}
		}
		return true;
	}

	ctrlMax(max){
		for(let pair of this.pairsLast()){
			let [cur, next, i] = pair;
			let d = this.metric(next, cur);
			if(d>max){
				return false;
			}
		}
		return true;
	}
	
	maxD(){
		let result = 0;
		for(let pair of this.pairsLast()){
			let [cur, next, index] = pair;
			let d = this.metric(next, cur);
			if(d > result){
				result = d;
			}
		}
		return result;
	}	
	
	minD(){
		let result = Infinity;
		for(let pair of this.pairsLast()){
			let [cur, next, index] = pair;
			let d = this.metric(next, cur);
			if(d < result){
				result = d;
			}
		}
		return result;
	}
	
	[Symbol.iterator](){
		return this.points[Symbol.iterator]();
	}
	
	[inspect](depth, options){
		//console.log(options);
		let name = this.constructor.name;
		let values = this.map(p=>(options.stylize(p.a, 'number')));
		
		return `${name} { ${values.join(', ')} }`;
	}		
	
	toString(){
		let name = this.constructor.name;
		let values = this.map(p=>(p.a));
		
		return `${name} { ${values.join(', ')} }`;
	}
}

class Points extends PointsBase{

	constructor(f, metric, D, step, levels, labeldist){
		let fun = (a)=>({a, x:f.x(a), y:f.y(a)});
		let args = levels.generateArgs(D, step);
		let points = args.map(fun);

		super(points, metric, levels, labeldist);
		
		const {min, max}  = levels.getLimits(D, step);
		
		const firstPoint = points[0];
		const lastPoint = points[points.length-1];
		
		if(max[LT](lastPoint.a)){
			lastPoint.anomal = true;
		}
		else if(lastPoint.anomal){
			lastPoint.anomal = false;
		}
		
		if(min[GT](firstPoint.a)){
			firstPoint.anomal = true;
		}		
		else if(firstPoint.anomal){
			firstPoint = false;
		}
		
		this.f = f;
		this.fun = fun;
		this.step = step;
	}
	
	/**
	 * Объединяет слишком короткие деления.
	 * Ищет наилучший вариант объединения
	 */
	downsingle(){
		if(this.downsingled){
			return this;
		}
		if(this.edited){
			console.log('call downsingle after edit');
			return this;
		}
		const {points, labeldist, metric} = this;
		this.points = downsinglePoints(points, labeldist, metric);
		this.downsingled = true;
		
		for(let pair of this.pairs()){
			let i = pair.map(p=>points.indexOf(p));
			if(i[1]-i[0] > 1){
				pair[1].downsingled = true;
			}
		}

		return this;
	}
	
	/**
	 * Разбивает слишком короткие деления.
	 * Ищет наиболее подходящую цену меньших делений
	 */
	expand(){
		if(this.fulled){
			return this;
		}
		if(this.edited){
			console.log('call expand after edit');
			return this;
		}
		const me = this;
		const {f, metric, step, levels, labeldist} = this;

		for(let pair of me.pairsLast()){
			let [cur, next, index] = pair;
			
			if(next.downsingled) continue;
			
			let d = metric(next, cur);
			if(d > labeldist.max){
				let group = zwischenLabeled(f, metric, [cur.a, next.a], step, levels, labeldist);
				me.pairToGroup(index, group);
			}
		}

		this.fulled = true;
		return this;
	}

}


module.exports = Points;