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
	if(d>dist.max){
		into.push(`Превышение ${type}.max между ${a} и ${b}`);
	}
	else if(d<dist.min){
		into.push(`Переуплотнение ${type}.min между ${a} и ${b}`);
	}

}

function controlDist(report, metric, labeldist, mutedist){
	let result = [];
	let curPoint = curLabeled = report[0].a;
	for(let pair of report.pairs()){
		let point = pair[1];
		testingDistanceResult(curLabeled, point.a, metric, labeldist, 'labeldist', result);
		if(point.muteGroup){
			let {min, max, step} = point.muteGroup;
			let a = min[ADD](step);
			for(;a[LT](max); a=a[ADD](step)){
				testingDistanceResult(curPoint, a, metric, mutedist, 'mutedist', result);
				curPoint = a;
			}
			testingDistanceResult(curPoint, point.a, metric, mutedist, 'mutedist', result);
		}
		else{
			result.push(`Нет немой группы между ${curLabeled} и ${point.a}`);
			testingDistanceResult(curLabeled, point.a, metric, mutedist, 'mutedist', result);
		}
		curPoint = curLabeled = point.a;
	}
	
	return result;
}