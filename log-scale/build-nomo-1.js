const {scale} = require('@grunmouse/nomography');
const fmt = require('@grunmouse/format-recursive');

const fs = require('fs');

const promisify = require('util').promisify;
const child_process = require('child_process');

const max_length = 270;

const tau_max = 10;
const tau_min = 1;
const line_count = 10;

const lambda = max_length * line_count / 2;


const fun = {
	x:(t)=>(lambda * Math.log10(t)),
	y:(t)=>(0)
};

const common = {
	max_length,
	tau_max,
	tau_min,
	line_count,
	lambda
};


const report = scale.createScaleReport(fun, scale.euclid, [1,10], scale.rational25Levels, {min:3, max:6}, {min:0.5});

const table = report.labeledMarks;

//console.log(table.points[0]);

const muteTable = report.mutegroups.map((gr)=>{;
	let {step, prev, min, max, two} = gr;
	if(!two){
		return `${min.simple().join()} ${max.simple().join()} ${prev.simple().join()} 2 mutegrouprat`;
	}
	else{
		return `${min.simple().join()} ${max.simple().join()} ${step.simple().join()} 2 ${prev.simple().join()} mutegrouprat2`;
	}
});

const env = {
	commonvar:(env)=>{
		let name = env.get('')();
		
		return `/${name} ${common[name]} def`;
		
	},
	marks:()=>{
		const commands = table.map((item)=>(`\t\t\t${+item.a} value`));
		
		return commands.join('\n');
	},
	mute:()=>{
		return muteTable.map((t)=>('\t\t\t'+t)).join('\n');
	}
}


function build(name, env){
	const tmp = fs.readFileSync(name+'-tmp.ps',{ encoding:'utf-8'});
	const code = fmt.use(tmp, env);
	fs.writeFileSync(name + '.ps',  code);
	child_process.execSync(`ps2pdf -dNOSAFER ${name}.ps`);
}

//исполнение

build('nomo-1', env);
//build('nomo-2', env);