const {Vector2} = require('@grunmouse/math-vector');
const {flags} = require('@grunmouse/binary');

const {symbols:{SUB}}= require('@grunmouse/multioperator-ariphmetic');


const {toLevels, rational25Levels} = require('./mark-levels.js');
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
	levels = toLevels(levels);
	//Находим наибольших полезный шаг штрихов
	let step = levels.findTop(D);

	return new ScalePoints(f, metric, D, step.step, levels, labeldist).downsingle().expand();
}


function createMute(f, metric, D, levels, dist){
	levels = toLevels(levels);

	//Находим наибольший полезный шаг штрихов
	//Предположим, что это меньший из шагов границ
	let step = D.map(a=>levels.findLevel(a)).sort((a,b)=>(a[SUB](b)))[0];

	let variants;
	if(levels.hasAllowStep(D, step)){
		let next = levels.getLessStepVariants(step);
		
		variants = next.map((two)=>([step, two]));
	}
	else{
		variants = levels.getLessNStepVariants(step, 2);
	}
	
	let stats = variants.map((steps)=>{
		let points = new ScalePoints(f, metric, D, steps[1], levels, dist);
		let two = points.downsingled;
		if(!two){
			points = new ScalePoints(f, metric, D, steps[0], levels, dist);
		}
		let male = +steps[0].div(steps[1]);
		let maxD = points.maxD();
		let minD = points.minD();
		
		let rate = [-two, minD, Math.abs(male-4)];
		
		return {
			two,
			male,
			steps,
			maxD,
			minD,
			rate
		};
	});
	
	stats.sort((a, b)=>{
		for(let i=0; i<a.rate.length; ++i){
			let m = a.rate[i] - b.rate[i];
			if(m){
				return m;
			}
		}
		return 0;
	});
	
	let accepted = stats[0];
	
	let prev = accepted.steps[0];
	let acceptedStep = accepted.steps[accepted.steps.length-1];

	return {
		min:D[0], 
		max:D[1], 
		step:acceptedStep, 
		two: accepted.two, 
		levels:accepted.two ? 2: 1, 
		prev:prev
	};
	
}


function createAllMute(f, metric, table, levels, dist){
	const result = [];
	for(let pair of table.pairsUp()){
		let gr = createMute(f, metric, [pair[0].a, pair[1].a], levels, dist);
		result.push(gr);
	}
	return result;
}

function createScaleReport(f, metric, D, levels, labeldist, mutedist){
	const labeledMarks = createLabeled(f, metric, D, levels, labeldist);
	const mutegroups = createAllMute(f, metric, labeledMarks, levels, mutedist);
	
	return {
		labeledMarks,
		mutegroups
	};
}



module.exports = {
	createLabeled,
	createMute,
	createAllMute,
	createScaleReport,
	rational25Levels,
	euclid
};
