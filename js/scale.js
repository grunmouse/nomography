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


function * pairsUp(arr){
	let len = arr.length-1;
	for(let i=0; i<len; ++i){
		let pair = arr.slice(i, i+2).concat(i);
		yield pair;
	}	
}

function * pairsDown(arr){
	let len = arr.length-1;
	for(let i=len-1; i--;){
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
	makeTable
};