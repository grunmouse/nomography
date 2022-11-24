const {
	pairsLast,
	pairsUp,
	downsinglePoints
} = require('./points-lib.js');

const inspect = Symbol.for('nodejs.util.inspect.custom');

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
				debugger;
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

class PointsExcluded extends PointsBase{
	
	constructor(source, code, metric, labeldist){
		
		super(points, metric, levels, labeldist);
	}
}


class Points extends PointsBase{

	constructor(f, metric, D, step, levels, labeldist){
		let fun = (a)=>({a, x:f.x(a), y:f.y(a)});
		let args = levels.generateArgs(D, step);
		let points = args.map(fun);

		super(points, metric, levels, labeldist);
		
		this.f = f;
		this.fun = fun;
		this.step = step;
		//this.downsingled = this.full = this.ctrlMin(labeldist.min);
		//this.fulled = this.ctrlMax(labeldist.max);
		//this.edited = false;
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

		this.points = downsinglePoints(this.points, this.labeldist, this.metric);
		this.downsingled = true;
		if(this.points.length === 2){
			this.fulled = true;
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
		const points = this;
		const {f, metric, step, levels, labeldist} = this;
		for(let pair of points.pairsLast()){
			let [cur, next, index] = pair;
			let d = metric(next, cur);
			if(d > labeldist.max){
				let group = zwischenLabeled(f, metric, [cur.a, next.a], step, levels, labeldist);
				points.pairToGroup(index, group);
			}
		}
		this.fulled = true;
		return this;
	}

}


module.exports = Points;