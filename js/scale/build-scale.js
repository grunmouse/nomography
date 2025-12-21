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

const {
	RationalNumber
} = require('../rational-number/index.js');

const downsamplePoints = require('./downsample.js');

//const PointsBase = require('./scale-points-base.js');

const { gapArea, getIntersection, getSpacing, joinArea, commonTicks, fillArea} = require('./interval-utils.js');

const {metricArea} = require('./penalty.js');

const { startingSteps, collectAreas, muteArea } = require('./mute-areas.js');

const {convertToScaleReport, makePoints, resolveUnknownPoints} = require('./points-utils.js');
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
 * Обертывает функцию отображения в стандартный формат {a, x, y}.
 * @param {Function|Object} f - Функция или объект {x,y}.
 * @returns {Function} Обернутая функция.
 */
function wrapFunction(f){
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
	return fun;
}


/**
 * Основная функция: создает отчет о шкале из функции, метрики и параметров.
 * @param {Function|Object} f - Функция отображения.
 * @param {Function} metric - Метрика расстояния между точками.
 * @param {Array[2]} D - Параметровый диапазон.
 * @param {*} levels - Уровни шкалы.
 * @param {Object} labeldist - Диапазон для labeled штрихов.
 * @param {Object} mutedist - Диапазон для mute штрихов.
 * @returns {PointsBase} Отчет о шкале.
 */
function createScaleReport(f, metric, D, levels, labeldist, mutedist){
	const fun = wrapFunction(f);
	const distance = (a, b)=>(metric(fun(a),fun(b)));
	
	let areas = muteArea(distance, D, levels, mutedist);
	
	let points = makePoints(areas, levels);
	//console.log(points[1].alt);
	points = resolveUnknownPoints(points, distance, mutedist);
	
	for(let i = points.length-1; i>0; --i){
		let a = points[i-1], b = points[i];
		let d = distance(a.a, b.a);
		if(d>labeldist.max){
			//console.log(points[i]);
			let lareas = labeledArea([a.a, b.a], b.step, distance, levels, labeldist);
			if(lareas && lareas.length){
				let lpoints = lareas.map(fillArea).flat();
				console.log(lpoints);
				//console.log(lareas);
				console.log({a, b});
			}
			
			//break;
		}
	}
	
	//console.log(points);
	return convertToScaleReport(points, fun,  metric, levels, labeldist);
}

module.exports = {
	createScaleReport
};
