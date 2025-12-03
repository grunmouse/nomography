const inspect = Symbol.for('nodejs.util.inspect.custom');

/*const {
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
} = require('@grunmouse/multioperator-ariphmetic');*/

/**
 * @class PointsBase - абстрактный класс, предок класса Points
 * инкапсулирует общую часть конструктора и наиболее общие методы возможных реализаций Points
 */
class PointsBase{

	constructor(points, metric, levels, labeldist){
		this.metric = metric;
		this.levels = levels;
		this.labeldist = labeldist;
		
		this.points = points;

		this.downsampled = this.full = this.ctrlMin(labeldist.min);
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
	
	variance(){
		let d = [];
		for(let pair of this.pairsLast()){
			let [cur, next, index] = pair;
			d.push(this.metric(next, cur));
		}
		
		let m = d.reduce((a,b)=>(a+b),0)/d.length;
		let dd2 = d.map(a=>((m-a)**2));
		let s = dd2.reduce((a,b)=>(a+b),0)/d.length;
		return s;
	}
	
	[Symbol.iterator](){
		return this.points[Symbol.iterator]();
	}
	
	[inspect](depth, options, inspect){
		//console.log(options);
		let name = this.constructor.name;
		//const stylize = p=>(options.stylize(p.a, 'number'));
		//const utils = require('utils');
		//const stylize = p=>(inspect(p.a,options));
		const stylize = p=>(inspect(p,options));
		let values = this.map(stylize).slice(0,5);
		
		return `${name} { ${values.join(', ')} }`;
	}		
	
	toString(){
		let name = this.constructor.name;
		let values = this.map(p=>(p.a));
		
		return `${name} { ${values.join(', ')} }`;
	}
}

module.exports = PointsBase;