const assert = require('assert');


const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		EQ,
		LT,
		GT,
		LE,
		GE
	}
} = require('@grunmouse/multioperator-ariphmetic');

const {
	createLabeled,
	createMute,
	//decimalLevels,
	//decimal25Levels,
	rational25Levels,
	createScaleReport,
	
	euclid
} = require('../index.js');

const {
	muteArea,
	//getIntersection,
	//commonTicks,
	makePoints,
	resolveUnknownPoints
} = require('../build-scale.js');

function checkNeighboringOverlaps(array) {
    const nonOverlappingPairs = [];

    for (let i = 0; i < array.length - 1; i++) {
        const obj1 = array[i];
        const obj2 = array[i + 1];

        // Предполагаем, что RationalNumber поддерживает операторы сравнения (<=, >=)
        // Если нет, нужно реализовать их через nom/den (например, сравнение дробей)
        const overlaps = obj1.start[LE](obj2.end) && obj2.start[LE](obj1.end);

        if (!overlaps) {
            nonOverlappingPairs.push({
                pair: [i, i + 1],
                range1: `[${obj1.start} - ${obj1.end}]`,
                range2: `[${obj2.start} - ${obj2.end}]`
            });
        }
    }

    if (nonOverlappingPairs.length === 0) {
        console.log("Все соседние объекты пересекаются.");
    } else {
        console.log("Непересекающиеся соседние пары:");
        nonOverlappingPairs.forEach(pair => {
            console.log(`Пара ${pair.pair[0]} - ${pair.pair[1]}: диапазоны ${pair.range1} и ${pair.range2}`);
        });
    }
}

describe('log', ()=>{
	
	it('log', ()=>{
		assert.ok('true');
		
		const fun = (value)=>{
			let x = 100*Math.log10(value);
			let y = 0;
			return {x, y};
		};
		
		const distance = (a, b)=>(euclid(fun(a),fun(b)));
		const mutedist = {min:1, max:2.5};
		
		let areas = muteArea(distance, [1, 100], rational25Levels, mutedist);
		
		checkNeighboringOverlaps(areas);
		
		let com = makePoints(areas, rational25Levels);
		com = resolveUnknownPoints(com, distance, mutedist);
		console.log(com);
	});

});