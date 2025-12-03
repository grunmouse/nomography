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


/**
 * Для слишком длинного деления между надписанными штрихами ищет промежуточные цены деления
 * Рекурсивно применяет возможные деления
 * 
 */
function zwischenLabeled(f, metric, D, step,  levels, labeldist){
	if(levels.hasAllowStep(D, step)){ //Прореженные отрезки не делим
		return;
	}
	let lessUniversal = levels.getLessUniversalStep(step);
	
	let points = new Points(f, metric, D, lessUniversal, levels, labeldist);
	
	if(points.downsampled){
		return points.expand();
	}
	else{
		let steps = levels.getLessStepVariants(step);
		if(steps.length>0){
			//выбор лучшего варианта разбиения (УТОЧНИТЬ)
			let groups = steps.map((step)=>{
				return new Points(f, metric, D, step, levels, labeldist).downsample().expand();
			});
			
			const cmp = (a, b)=>(b.length - a.length || b.full - a.full || a.maxD() - b.maxD());
			groups.sort(cmp);
			
			if(groups[1] && cmp(groups[0], groups[1]) === 0){
				//debugger;
			}
			
			return groups[0];
		}
		else{
			return points.downsample().expand();
		}
	}
	
	throw new Error('Неинтерпретированный путь в zwischenLabeled');
	
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
 * хранит информацию о функции, для которой строится шкала, правилах построения шкалы и диапазоне построения;
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
 * @property downsampled : Boolean - признак выполнения требования labeldist.min
 * @property fulled : Boolean - признак выполнения требования labeldist.max
 * @property edited : Boolean - признак наличия ручных изменений в наборе точек (после этого нельзя применять автоматические методы)
 * @property full : Boolean - признак того, что требование labeldist.min выполняется изначально, без прореживания
 *
 */

const PointsBase = require('./scale-points-base.js');

class Points extends PointsBase{

	constructor(f, metric, D, step, levels, labeldist){
		let fun;
		if(typeof f == "function"){
			fun = (a)=>{
				let v = f(a);
				if(Array.isArray(v)){
					return {a, x:v[0], y:v[1]};
				}
				else if(!isNaN(v.x*v.y)){
					return {a, x:v.x, y:v.y};
				}
				else{
					throw new Error(`Invalid function return ${v}`);
				}
			};
		}
		else if(typeof f.x == "function" && typeof f.y == "function"){
			fun = (a)=>({a, x:f.x(a), y:f.y(a)});
		}
		else{
			throw new TypeError(`Incorrect argument type f ${typeof f}`);
		}
		
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
			firstPoint.anomal = false;
		}
		
		this.f = f;
		this.fun = fun;
		this.step = step;
	}
	
	/**
	 * Объединяет слишком короткие деления.
	 * Ищет наилучший вариант объединения
	 */
	downsample(){
		if(this.downsampled){
			return this;
		}
		if(this.edited){
			console.log('call downsample after edit');
			return this;
		}
		const {points, labeldist, metric} = this;
		this.points = downsamplePoints(points, labeldist, metric);
		this.downsampled = true;
		
		for(let pair of this.pairs()){
			let i = pair.map(p=>points.indexOf(p));
			if(i[1]-i[0] > 1){
				pair[1].downsampled = true;
			}
		}

		return this;
	}
	
	/**
	 * Разбивает слишком длинные деления.
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
			
			if(next.downsampled) continue;
			
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