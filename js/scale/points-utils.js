const inspect = Symbol.for('nodejs.util.inspect.custom');

const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		MOD,
		EQ,
		LT,
		GT,
		LE,
		GE
	}
} = require('@grunmouse/multioperator-ariphmetic');

const downsamplePoints = require('./downsample.js');

const PointsBase = require('./scale-points-base.js');

const { gapArea, getIntersection, getSpacing, joinArea, commonTicks, fillArea} = require('./interval-utils.js');

const {metricArea} = require('./penalty.js');

/**
 * Генерирует области для помещенных (labeled) штрихов.
 * @param {Array[2]} D - Отрезок.
 * @param {*} step - Начальный шаг.
 * @param {Function} distance - Расстояние.
 * @param {*} levels - Уровни.
 * @param {Object} labeldist - Диапазон для labeled.
 * @returns {Array} Области. 
 */
function labeledArea(D, step, distance, levels, labeldist){
	if(!levels.isUniversal(step)){
		step = levels.getGreatUniversalStep(step);
	}
	
	const startSteps = startingSteps(step, distance, D, levels, labeldist);
	//console.log(startSteps);
	let limits = startSteps[0];
	
	if(limits){
	debugger;
		return collectAreas([limits.min, limits.max], limits.step, distance, levels, labeldist);	
	}
	else{
		//TODO
	}
}


/**
 * Создает список точек из областей, включая общие ticks на границах.
 * @param {Array} areas - Список областей.
 * @param {*} levels - Уровни.
 * @returns {Array} Точки: {a: Rational, step?, alt?}.
 */
function makePoints(areas, levels){

	let points = [{a:areas[0].start}].concat(areas.map((area, i)=>{
		let next = areas[i+1];
		let a = area.end;
		let step = area.step;
		let common;
		if(next){
			let intersect = getIntersection(area, next);
			common = commonTicks(intersect, levels);
			a = common.ticks[0];
			if(!a){
				let nextstart = next.start.floorBy(common.lcmStep);
				let areaend = area.end.ceilBy(common.lcmStep);
				common.ticks = [
					nextstart,
					areaend
				];
			}
		}
		return {
			a,
			alt:common,
			step
		}
	}));
	
	return points;
}

/**
 * Разрешает неизвестные точки (a == null), выбирая лучший вариант по метрике.
 * @param {Array} points - Точки.
 * @param {Function} distance - Расстояние.
 * @param {Object} mutedist - Диапазон.
 * @returns {Array} Обновленные точки.
 */
function resolveUnknownPoints(points, distance, mutedist){
	for(let i=1; i<points.length-1; ++i){
		if(points[i].a == null){
			let current = points[i], next = points[i+1], prev = points[i-1];
			let {ticks, lcmStep} = current.alt;
			
			let curk = metricArea(prev.a, ticks[1], lcmStep, distance, mutedist);
			let nextk = metricArea(ticks[0], next.a, lcmStep, distance, mutedist);
			
			if(nextk<curk){
				current.a = ticks[0];
			}
			else{
				current.a = ticks[1];
			}
		}
	}
	return points;
}

function convertToScaleReport(points, fun,  metric, levels, labeldist){
	/*
	@typedef Point : object
	@property x : Number?
	@property y : Number?
	@property a : RationalNumber
	@property muteGroup : Object?
	@property muteGroup.min : RationalNumber
	@property muteGroup.max : RationalNumber
	@property muteGroup.step : RationalNumber
	@property muteGroup.levels : 1 | 2 
	@property muteGroup.two : Boolean? levels===2
	@property muteGroup.prev : RationalNumber?
	*/
	
	const repPoints = points.map((p, i)=>{
		let point = fun(p.a);
		point.a = p.a;
		if(p.step){
			point.muteGroup = {
				min: points[i-1].a,
				max: point.a,
				step: p.step,
				levels: 1
			};
		}
		return point;
	});
	
	let scale = new PointsBase(repPoints,  metric, levels, labeldist);
	
	scale.fun = fun;
	
	return scale;
}

module.exports = {
	convertToScaleReport, 
	makePoints,
	resolveUnknownPoints
};