const {
	pairsDown,
	pairsUp,
	ctrlGroup,
	unfullGroupDown2,
	downsinglePoints
} = require('./points-lib.js');

const inspect = Symbol.for('nodejs.util.inspect.custom');

class Points{

	constructor(f, D, step, levels, labeldist){
		let fun = (a)=>({a, x:f.x(a), y:f.y(a)});
		this.fun = fun;
		this.levels = levels;
		this.labeldist = labeldist;
		
		let args = levels.generateArgs(D, step);
		
		this.points = args.map(fun);
		this.downsingled = ctrlGroup(this.points, labeldist.min);
		this.fulled = !ctrlGroup(this.points, labeldist.max);
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
	
	get length(){
		return this.points.length;
	}
	
	[inspect](depth, options){
		//console.log(options);
		let name = this.constructor.name;
		let values = this.points.map(p=>(options.stylize(p.a, 'number')));
		
		return `${name} { ${values.join(', ')} }`;
	}		
	//points.map(p=>p.a).join()
}

module.exports = Points;