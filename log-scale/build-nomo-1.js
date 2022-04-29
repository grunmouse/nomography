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
}


const table = scale.createLabeled(fun, [1,10], [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], {min:3, max:8});

const muteTable = [];
for(let i=1; i<table.length; ++i){
	let gr = scale.createMute(fun, [table[i-1].a, table[i].a], [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], {min:0.5});
	let {step, prev, min, max} = gr;
	if(step.equals(prev)){
		muteTable.push(`${min} ${max} ${step} 1 mutegroup`);
	}
	else{
		let den = 10**(-step.e);
		let nom = prev.times(den).toNumber();
		muteTable.push(`${min} ${max} ${step} 2 ${nom} ${den} rat mutegroup2`);
	}
}

const env = {
	commonvar:(env)=>{
		let name = env.get('')();
		
		return `/${name} ${common[name]} def`;
		
	},
	marks:()=>{
		const commands = table.map((item)=>(`\t\t\t${item.a} value`));
		
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