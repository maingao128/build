#!/usr/bin/env node
const exec = require('child_process').execSync;
const colors = require('colors');
const path = require('path');
const fs = require('fs');
const co = require('co');

const config = {
	build: path.join(process.cwd(), 'dist'),
	staticDist: path.join(process.cwd(), '../rack-static/rack')
}


console.log(colors.green('================开始构建================'));
exec('npm run build', {
	stdio: 'inherit'
});

if(!fs.existsSync(config.build) || !fs.existsSync(config.staticDist)) {
	throw new Error(`构建结果${config.build}或者${config.staticDist}不存在`);
}

co(function *() {
	yield * copy(config.build, config.staticDist);
	updateGit();
});

function updateGit() {
	console.log(colors.green('================拷贝文件完成，开始同步git================'));
	exec('git pull && git add . && git commit -m "update" && git push', {
		cwd: config.staticDist,
		stdio: 'inherit'
	})

	console.log(colors.green('================同步git完成，可以进行发布================'));
}

function* copy(src, dist) {
	const paths = yield readDirSync(src);
	const l = paths.length;
	for(let i = 0; i < l; i++) {
		const currPath = paths[i];
		if(currPath.indexOf('.') === 0) {
			continue
		}
		const _src = src + '/' + currPath;
		const _dist = dist + '/' + currPath;
		const stat = fs.statSync(_src);

		if(!fs.existsSync(path.dirname(_dist))) {
			fs.mkdirSync(path.dirname(_dist));
		}

		if(stat.isFile()) {
			fs.writeFileSync(_dist, fs.readFileSync(_src));
		} else if(stat.isDirectory()) {
			yield * copy(_src, _dist)
		} 
	}
}

function readDirSync(src) {
	return new Promise(function(resolve, reject) {
		fs.readdir(src, function(err, paths){
			if(err) reject(err);
			resolve(paths);
		})
	})
	
}
