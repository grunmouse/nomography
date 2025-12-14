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


function testingDistanceResult(a, b, metric, dist, type, into){
	let d = metric(a, b);
	if(isNaN(d)){
		throw new Error('distance is NaN')
	}
	if(d>dist.max){
		into.push(`Превышение ${type}.max между ${a.a} и ${b.a}`);
	}
	else if(d<dist.min){
		into.push(`Переуплотнение ${type}.min между ${a.a} и ${b.a}`);
	}

}

function controlDist(report, metric, labeldist, mutedist){
	let result = [];
	let curPoint = curLabeled = report.points[0];
	for(let pair of report.pairs()){
		let nextPoint = pair[1];
		testingDistanceResult(curLabeled, nextPoint, metric, labeldist, 'labeldist', result);
		if(nextPoint.muteGroup){
			let {min, max, step} = nextPoint.muteGroup;
			let a = min[ADD](step);
			for(;a[LT](max); a=a[ADD](step)){
				let point = report.fun(a);
				testingDistanceResult(curPoint, point, metric, mutedist, 'mutedist', result);
				curPoint = point;
			}
			testingDistanceResult(curPoint, nextPoint, metric, mutedist, 'mutedist', result);
		}
		else{
			result.push(`Нет немой группы между ${curLabeled.a} и ${nextPoint.a}`);
			testingDistanceResult(curLabeled, nextPoint, metric, mutedist, 'mutedist', result);
		}
		curPoint = curLabeled = nextPoint;
	}
	
	return result;
}

module.exports = {
	controlDist
};