const {Vector2} = require('@grunmouse/math-vector');
const {flags} = require('@grunmouse/binary');
const Decimal = require('decimal.js');

const toDecimal = (a)=>(new Decimal(a));

const {toLevels} = require('../mark-levels.js');

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
function createLabeled(f, D, levels, labeldist){
	D = D.map(toDecimal);
	levels = toLevels(levels);
	//Находим наибольших полезный шаг штрихов
	let step = levels.findTop(D);

	if(!step){
		console.warn('Not allowed level for D: ' + D);
		return D.map((a)=>({a, x:f.x(a), y:f.y(a)}));
	}
	
	//Получаем отрезки
	let args = generateArgs(D, step.min, step.max, step.step);
	
	let points = args.map((a)=>({a, x:f.x(a), y:f.y(a)}));
	
	for(let group of unfullGroupDown2(points, labeldist)){
		
		let index = points.indexOf(group[0]), length = group.length;

		group = handleUnfull(group, labeldist.min);
		
		points.splice(index, length, ...group);
	}
	
	if(points.length === 2){
		console.warn('Not points inner D: ' + D);
		return points;
	}
	
	for(let pair of pairsDown(points)){
		let [cur, next, index] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d > labeldist.max){
			let group = zwischenLabeled(f, [cur.a, next.a], step, levels, labeldist);
			points.splice(index, 2, ...group);
		}
	}
	
	return points;
}

function zwischenLabeled(f, D, step,  levels, labeldist){
	return createLabeled(f, D, levels, labeldist);
}


function generateArgs(D, min, max, step){
	let args = [];
	for(let x = min; x.lessThan(max); x = x.plus(step)){
		args.push(x);
	}
	args.push(max);
	if(max.lessThan(D[1])){
		args.push(D[1]);
	}
	if(min.greaterThan(D[0])){
		args.unshift(D[0]);
	}
	return args;
}

function handleUnfull(group, min){
	const length = group.length;
	const first = group[0];
	const last = group[length-1];
	const count = BigInt(length-2);
	const over = 1n<<count;


	const gen = function *(first, over){
		for(let mask = 0n; mask<over; ++mask){
			let points = [first].concat(flags.flagNumbers(mask).map((i)=>(group[Number(i)+1])), last);
			yield points;
		}
	};
	let minmaxD = Infinity, selgroup = group;

	const debugMap = [];
	for(let points of filterVariants(gen(first, over), min)){
		if(points.maxD < minmaxD){
			minmaxD = points.maxD;
			selgroup = points;
		}
		debugMap.push([points, points.maxD]);
	}
	
	debugMap.sort(([A, ad], [B, bd])=>(ad-bd));
	//console.dir(debugMap.slice(0,2), {depth:4});
	
	return selgroup;
}

/**
 * Проверяет группу точек на минимальное деление
 */
function ctrlGroup(points, min){
	for(let pair of pairsUp(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<min){
			return false;
		}
	}
	return true;
}

function * filterVariants(genPoint, min){

	byvalue:for(let points of genPoint){
		let maxD = 0;
		//Контроль дистанций
		for(let pair of pairsUp(points)){
			let [cur, next, i] = pair;
			let d = Math.hypot(next.x - cur.x, next.y - cur.y);
			if(d<min){
				continue byvalue;
			}
			if(d >= maxD){
				maxD = d;
			}
		}
		points.maxD = maxD;
		yield points;
	}
}

/**
 * Находит группы точек, расстояние между которыми меньше min
 */
function *unfullGroup(points, min){
	let group;
	for(let pair of pairsUp(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<=min){
			if(group){
				group.push(next);
			}
			else{
				group = [cur, next];
			}
		}
		else{
			if(group){
				yield group;
				group = null;
			}
		}
	}
	if(group){
		yield group;
		group = null;
	}
}
/**
 * Находит группы точек, расстояние между которыми меньше min
 */
function *unfullGroupDown(points, min){
	let group;
	for(let pair of pairsDown(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<=min){
			if(group){
				group.unshift(cur);
			}
			else{
				group = [cur, next];
			}
		}
		else{
			if(group){
				yield group;
				group = null;
			}
		}
	}
	if(group){
		yield group;
		group = null;
	}	
}

function *unfullGroupDown2(points, dist){
	let group, after;
	for(let pair of pairsDown(points)){
		let [cur, next, i] = pair;
		let d = Math.hypot(next.x - cur.x, next.y - cur.y);
		if(d<=dist.min){
			if(group){
				group.unshift(cur);
			}
			else{
				group = after ? [cur, next, after] : [cur, next];
			}
		}
		else{
			if(d<=dist.max){
				if(group){
					group.unshift(cur);
					yield group;
					group = null;
					after = next;
				}
				else{
					after = next;
				}
			}
			else{
				if(group){
					yield group;
					group = null;
					after = null;
				}
				else{
					after = null;
				}
			}
		}
	}
	if(group){
		yield group;
		group = null;
	}	
}


function createMute(f, D, levels, dist){
	D = D.map(toDecimal);
	levels = toLevels(levels);

	//Находим наибольших полезный шаг штрихов
	let step = levels.findTop(D);
	
	let {min, max} = step;
	step = step.step;

	let acceptedStep, acceptedPoints;
	
	const gen = function*(step){
		for(;step;step = levels.getLess(step)){
			let args = generateArgs(D, min, max, step);
			let points = args.map((a)=>({a, x:f.x(a), y:f.y(a)}));
			points.step = step;
			yield points;
		}
	};
	for(let points of filterVariants(gen(step), dist.min)){
		acceptedStep = points.step;
		acceptedPoints = points;
	}

	let points = acceptedPoints;
	if(!points){
		return {min, max};
	}
	
	let usedLevels = new Set();
	for(let i = 1; i<points.length-1; ++i){
		let point = points[i];
		point.level = levels.findLevel(point.a);
		usedLevels.add(point.level);
	}
	
	usedLevels = Array.from(usedLevels);
	usedLevels.sort((a,b)=>(b.minus(a)));
	
	for(let i = 1; i<points.length-1; ++i){
		let point = points[i];
		point.levelIndex = usedLevels.indexOf(points);
	}

	return {min, max, step:acceptedStep, levels:usedLevels.length, prev:usedLevels[0]};
	
}

/**
 * Генерирует пары значений массива от начала к концу
 */
function * pairsUp(arr){
	let len = arr.length-1;
	for(let i=0; i<len; ++i){
		let pair = arr.slice(i, i+2).concat(i);
		yield pair;
	}	
}

/**
 * Генерирует пары значений массива от конца к началу
 */
function * pairsDown(arr){
	let len = arr.length-1;
	for(let i=len; i--;){
		let pair = arr.slice(i, i+2).concat(i);
		yield pair;
	}	
}


module.exports = {
	createLabeled,
	createMute
};
