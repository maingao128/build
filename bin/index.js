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
console.log(colors.green('================构建结束，开始拷贝文件================'));

if(!fs.existsSync(config.build) || !fs.existsSync(config.staticDist)) {
	throw new Error(`构建结果${config.build}或者${config.staticDist}不存在`);
}

co(function *() {
	yield * copy(config.build, config.staticDist);
	console.log(colors.green('================拷贝文件完成================'));
	updateGit();
});

function updateGit() {
	console.log(colors.green('================开始同步git================'));
	exec('git add . && git commit -m "update" && git pull', {
		cwd: config.staticDist,
		stdio: 'inherit'
	})
	console.log(colors.green('================同步git完成，可以进行发布================'));
}

function* copy(src, dist) {
	const paths = yield readDirSync(src);
	const l = paths.length;
	for(let i = 0; i < l; i++) {
		const path = paths[i];
		if(path.indexOf('.') === 0) {
			continue
		}
		const _src = src + '/' + path;
		const _dist = dist + '/' + path;
		const stat = fs.statSync(_src);
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
