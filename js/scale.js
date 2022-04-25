const {Vector2} = require('@grunmouse/math-vector');
const {flags} = require('@grunmouse/binary');

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
 *
 */



/**
 * Строит таблицу значений для надписанных штрихов
 */
function createLabeled(f, D, levels, labeldist){
	levels = levels.slice(0);
	levels.sort((a,b)=>(a-b));
	//Находим наибольших полезный шаг штрихов
	let max, min, step;
	for(let i = levels.length; i--;){
		let lev = levels[i];
		max = Math.floor(D[1] / lev) * lev;
		min = Math.ceil(D[0] / lev) * lev;
		let count = (max - min)/lev + 1 + (min!=D[0]) + (max!=D[1]);
		if(count > 2){
			step = lev;
			break;
		}
	}
	if(!step){
		console.warn('Not allowed level for D: ' + D);
		return D.map((a)=>({a, x:f.x(a), y:f.y(a)}));
	}
	
	//Получаем отрезки
	let args = [];
	for(let x = min; x<=max; x+=step){
		args.push(x);
	}
	if(max<D[1]){
		args.push(D[1]);
	}
	if(min>D[0]){
		args.unshift(D[0]);
	}
	
	let points = args.map((a)=>({a, x:f.x(a), y:f.y(a)}));
	
	for(let group of unfullGroupDown(points, labeldist.max)){
		
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
			let group = createLabeled(f, [cur.a, next.a], levels, labeldist);
			points.splice(index, 2, ...group);
		}
	}
	
	return points;
}

function handleUnfull(group, min){
	const length = group.length;
	const first = group[0];
	const last = group[length-1];
	const count = BigInt(length-2);
	const over = 1n<<count;

	let minmaxD = Infinity, selgroup = group;
	const debugMap = [];
	byvalue:for(let mask = 0n; mask<over; ++mask){
		let points = [first].concat(flags.flagNumbers(mask).map((i)=>(group[Number(i)+1])), last);
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
		debugMap.push([points, maxD]);
		//Поиск наименьшей наибольшей дистанции
		if(maxD < minmaxD){
			minmaxD = maxD;
			selgroup = points;
		}
	}
	
	debugMap.sort(([A, ad], [B, bd])=>(ad-bd));
	//console.dir(debugMap.slice(0,2), {depth:4});
	
	return selgroup;
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


/**
 * Составляет первичную таблицу для шкалы
 */
function createTable(f, D, step){
	var table = [], prev;
	for(let a = D[0]; a<=D[1]; a+=step){
		let x = f.x(a);
		let y = f.y(a);
		table.push({a, x, y});
	}
	
	return table;
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

function ofPair(gen, target, name, fun){
	return function(table){
		let len = table.length-1;
		for(let pair of gen(table)){
			pair[target][name] = fun(pair[0], pair[1]);
		}
		return table;
	}
}

const setupDistance = (table)=>{
	for(let [cur, next, i] of pairsUp(table)){
		cur.d = Math.hypot(next.x - cur.x, next.y - cur.y);
		cur.step = next.a - cur.a;
	}
	return table;
};
const setupPosition = (table)=>{
	table[0].p = 0;
	for(let [cur, next, i] of pairsUp(table)){
		next.p = cur.p + cur.d;
	}
	return table;
};

/**
 * Уточняет таблицу до тех пор, пока все расстояния не будут не больше d
 */
function precisionTable(table, f, d){
	let len = table.length;
	for(let [current, next, i] of pairsDown(table)){
		if(current.d > d){
			let div = Math.ceil(d/current.d);
			let step = current.step;
			let substep = step/div;
			
			let subtable = [current];
			for(let j = 1; j < div; ++j){
				let a = j*substep + current.a;
				let x = f.x(a);
				let y = f.y(a);
				subtable[j] = {a,x,y};
			}
			setupDistance([...subtable, next]);
			//precisionTable(subtable, f, d)
			
			table.splice(i, 1, ...subtable);
		}
	}
	return table;
}

function leveledPoints(table, levels){
	for(let point of table){
		let set = point.levels = new Set();
		for(let level of levels){
			if(point.a % level === 0){
				set.add(+level);
			}
		}
	}
}

function makeTable(f, D, step, d, levels){
	const table = createTable(f, D, step);
	setupDistance(table);
	//precisionTable(table, f, d);
	setupPosition(table);
	leveledPoints(table, levels);
	
	return table;
}

module.exports = {
	createLabeled,
	makeTable
};
