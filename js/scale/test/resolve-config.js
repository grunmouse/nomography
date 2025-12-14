/**
 * @param config : Object
 * @param scaleName : String - имя шкалы или имя переменной, по которой она построена
 * @param target : String - префикс извлекаемого поля, "min", "max", "point", или что-то ещё, если это есть в конфиге
 */
function resolveConfig(config, scaleName, target){
	let name = scaleName.replace(/^scale/, '');
	let basename = name.replace(/\d+$|_[a-z0-9_]+$/i, '');
	let namesuffix = name.slice(basename.length);
	
	let fullKey = target + name;
	let baseKey = target + basename;
	
	if(fullKey in config){
		return config[fullKey];
	}
	if(baseKey in config){
		return config[baseKey];
	}
	
	throw new Error('Not exists in config ' + baseKey);
}

module.exports = resolveConfig;