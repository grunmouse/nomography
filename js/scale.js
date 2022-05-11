const {Vector2} = require('@grunmouse/math-vector');
const {flags} = require('@grunmouse/binary');
const Decimal = require('decimal.js');

const toDecimal = (a)=>(new Decimal(a));

const {toLevels, decimalLevels, decimal25Levels} = require('./mark-levels.js');
const ScalePoints = require('./scale-points.js');

const euclid = (a, b)=>(Math.hypot(a.x - b.x, a.y - b.y));


/**
 * Функция для заданной шкалы находит точки для надписанных и немых штрихов 
 * @param f : Object - уравнение шкалы
 * @property f.x : Function - отображает параметр на координату
 * @property f.y : Function
 * @param D : Array[2]<Number> - отрезок значений параметра, отображаемый на шкалу
 * @param levels : Array<Number> - хорошие кратности параметра для штрихов.
 * @param labeldist : Object
 * @property labeldist.min : Number - наименьшее разрешённое расстояние между надписанными штрихами
 * @property labeldist.max : Number - наибольшее допустимое расстояние между надписанными штрихами
 *
 * @return Array<{a, x, y}> - таблица значений надписанных штрихов
 */
function createLabeled(f, metric, D, levels, labeldist){
	D = D.map(toDecimal);
	levels = toLevels(levels);
	//Находим наибольших полезный шаг штрихов
	let step = levels.findTop(D);

	return new ScalePoints(f, metric, D, step.step, levels, labeldist).downsingle().expand();
}


function createMute(f, metric, D, levels, dist){
	D = D.map(toDecimal);
	levels = toLevels(levels);

	//Находим наибольший полезный шаг штрихов
	//Предположим, что это меньший из шагов границ
	let step = D.map(a=>levels.findLevel(a)).sort((a,b)=>(a.minus(b)))[0];
	//Если он слишком велик - уменьшим его
	while(!levels.hasAllowStep(D, step)){
		step = levels.getLess(step);
	}
	
	let [min, max] = D;

	let acceptedStep, acceptedPoints;
	
	//Находим наименьший полезный шаг штрихов
	let pair = levels.findPair((index)=>{
		let step = levels.getStep(index);
		let points = new ScalePoints(f, metric, D, step, levels, dist);
		return !points.downsingled;
	});
	
	acceptedStep = levels.getStep(pair.over);

	//console.log(+step, +acceptedStep);
	let points = new ScalePoints(f, metric, D, acceptedStep, levels, dist);
	
	let usedLevels = new Set();
	for(let i = 1; i<points.length-1; ++i){
		let point = points.points[i];
		point.level = levels.findLevel(point.a);
		usedLevels.add(point.level);
	}
	
	usedLevels = Array.from(usedLevels);
	usedLevels.sort((a,b)=>(b.minus(a)));
	
	for(let i = 1; i<points.length-1; ++i){
		let point = points.points[i];
		point.levelIndex = usedLevels.indexOf(point.level);
	}

	return {min, max, step:acceptedStep, levels:usedLevels.length, prev:usedLevels[0]};
	
}


module.exports = {
	createLabeled,
	createMute,
	decimalLevels,
	decimal25Levels,
	euclid
};
