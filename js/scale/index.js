const {symbols:{SUB, ADD, LT}}= require('@grunmouse/multioperator-ariphmetic');


const {rational25Levels} = require('./mark-levels.js');
const ScalePoints = require('./scale-points.js');

const euclid = (a, b)=>(Math.hypot(a.x - b.x, a.y - b.y));


/**
 * Функция для заданной шкалы находит точки для надписанных штрихов 
 * @param f : Object - уравнение шкалы
 * @property f.x : Function - отображает параметр на координату
 * @property f.y : Function
 * @param metric : Function({x,y}, {x,y})=>Number - функция расстояния между точками в принятой метрике
 * @param D : Array[2]<Number> - отрезок значений параметра, отображаемый на шкалу
 * @param levels : Levels - хорошие кратности параметра для штрихов.
 * @param labeldist : Object
 * @property labeldist.min : Number - наименьшее разрешённое расстояние между надписанными штрихами
 * @property labeldist.max : Number - наибольшее допустимое расстояние между надписанными штрихами
 *
 * @return ScalePoints - таблица значений надписанных штрихов
 */
function createLabeled(f, metric, D, levels, labeldist){

	//Находим наибольших полезный шаг штрихов
	let step = levels.findTop(D);

	return new ScalePoints(f, metric, D, step.step, levels, labeldist).downsingle().expand();
}


function createMute(f, metric, D, levels, dist){

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
		let two = points.full;
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
	
	let two = accepted.two;
	let prev = accepted.steps[0];
	let acceptedStep = two ? accepted.steps[accepted.steps.length-1] : prev;

	

	return {
		min:D[0], 
		max:D[1], 
		step:acceptedStep, 
		two: two, 
		levels: two ? 2: 1, 
		prev:prev
	};
	
}

/**
 * Создаёт описания групп немых штрихов между надписанными
 * возвращает массив
 * имеет побочный эффект - добавляет свойство muteGroup во вторую точку пары
 */
function createAllMute(table, dist){
	const {f, metric, levels} = table;
	const result = [];
	for(let pair of table.pairs()){
		pair = pair.slice(0,2);
		if(pair.some(p=>p.anomal)) continue;
		
		let gr = createMute(f, metric, [pair[0].a, pair[1].a], levels, dist);
		pair[1].muteGroup = gr;
		result.push(gr);
	}
	return result;
}

function createScaleReport(f, metric, D, levels, labeldist, mutedist){
	const labeledMarks = createLabeled(f, metric, D, levels, labeldist);
	const mutegroups = createAllMute(labeledMarks, mutedist);
	
	return labeledMarks;
}

function *allPoints(report){
	yield report.points[0].a;
	for(let pair of report.pairs()){
		let point = pair[1];
		if(point.muteGroup){
			let {min, max, step} = point.muteGroup;
			let a = min[ADD](step);
			for(;a[LT](max); a=a[ADD](step)){
				yield a;
			}
		}
		yield point.a;
	}
}


module.exports = {
	createLabeled,
	allPoints,
	//createMute,
	//createAllMute,
	createScaleReport,
	rational25Levels,
	euclid
};
