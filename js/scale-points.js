const {
	pairsDown,
	pairsUp,
	ctrlGroup,
	unfullGroupDown2,
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


class Points{

	constructor(f, metric, D, step, levels, labeldist){
		let fun = (a)=>({a, x:f.x(a), y:f.y(a)});
		this.f = f;
		this.metric = metric;
		this.fun = fun;
		this.levels = levels;
		this.labeldist = labeldist;
		this.step = step; //Верхний шаг
		
		let args = levels.generateArgs(D, step);
		
		this.points = args.map(fun);
		this.downsingled = this.full = this.ctrlMin(labeldist.min);
		this.fulled = this.ctrlMax(labeldist.max);
		this.edited = false;
	}
	
	downsingle(){
		if(!this.edited && !this.downsingled){
			this.points = downsinglePoints(this.points, this.labeldist);
			this.downsingled = true;
			if(this.points.length === 2){
				this.fulled = true;
			}
		}
		return this;
	}
	
	expand(){
		if(this.edited || this.fulled){
			return this;
		}
		const points = this;
		const {f, metric, step, levels, labeldist} = this;
		for(let pair of points.pairsDown()){
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

	pairsDown(){
		return pairsDown(this.points);
	}
	pairsUp(){
		return pairsUp(this.points);
	}
	
	pairToGroup(index, group){
		if(group){
			this.points.splice(index, 2, ...group.points);
			this.edited = true;
		}
	}
	
	map(fun){
		return this.points.map(fun);
	}
	
	get length(){
		return this.points.length;
	}
	
	ctrlMin(min){
		for(let pair of this.pairsDown()){
			let [cur, next, i] = pair;
			let d = this.metric(next, cur);
			if(d<min){
				return false;
			}
		}
		return true;
	}

	ctrlMax(max){
		for(let pair of this.pairsDown()){
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
		for(let pair of this.pairsDown()){
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
		for(let pair of this.pairsDown()){
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

module.exports = Points;