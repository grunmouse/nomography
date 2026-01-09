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
const betweenPoints = require('./between.js');

//const PointsBase = require('./scale-points-base.js');

const { gapArea, getIntersection, getSpacing, joinArea, commonTicks, fillArea, sortArea, getNestedAreas} = require('./interval-utils.js');

const {metricArea} = require('./penalty.js');

const { startingSteps, collectAreas, muteArea, resolveNested } = require('./mute-areas.js');

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
	
	let nested = getNestedAreas(areas);
	for(let cmp of nested){
		if(cmp.length === 1){
			let action = resolveNested(cmp[0], distance, levels, mutedist, labeldist);
			//console.log(action);
			if(action.created){
				areas.splice(areas.indexOf(action.removed), 1, ...action.created)
			}
			else{
				areas.splice(areas.indexOf(action.removed), 1);
			}
		}
		else{
			throw new Error('STUB. Many nested unsupported');
		}
	}
	
	areas.sort(sortArea);
	
	let points = makePoints(areas, levels);
	
	points = resolveUnknownPoints(points, distance, mutedist);
	
	//if(!false){
	for(let i = points.length-1; i>0; --i){
		let a = points[i-1], b = points[i];
		let d = distance(a.a, b.a);
		if(d>labeldist.max){
			let p = betweenPoints(a.a, b.a, b.step, distance, levels, labeldist);
			p = p.slice(1,-1).map((a)=>({a, step:b.step}));
			
			points.splice(i, 0, ...p); //Вставляем точки перед p;
			
		}
		else if(d<labeldist.min){
			//Нужна какая-то обработка
		}
	}
	//}
	
	return convertToScaleReport(points, fun,  metric, levels, labeldist);
}

module.exports = {
	createScaleReport
};
