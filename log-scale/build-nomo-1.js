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

const env = {
	commonvar:(env)=>{
		let name = env.get('')();
		
		return `/${name} ${common[name]} def`;
		
	},
	marks:()=>{
		const table = scale.createLabeled(fun, [1,10], [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], {min:4, max:10});
		const commands = table.map((item)=>(`\t\t\t${item.a} value`));
		
		return commands.join('\n');
	}
}



//исполнение
const tmp = fs.readFileSync('nomo-1-tmp.ps',{ encoding:'utf-8'});
const code = fmt.use(tmp, env);
fs.writeFileSync('nomo-1.ps',  code);
child_process.execSync('ps2pdf -dNOSAFER nomo-1.ps');