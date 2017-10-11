const express = require('express');
const request = require('superagent');
const app = express();
const fs = require('fs'); 
const path = require('path');
const https = require('https'); 
const exec = require('child_process').execSync;
const bodyParser = require('body-parser');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const buildPath = path.resolve(__dirname, '../');

module.exports = function() {
	if(!fs.existsSync(buildPath + '/privatekey.pem') || !fs.existsSync(buildPath + '/certificate.pem')) {
		createCert();
	}
	const privatekey = fs.readFileSync(buildPath + '/privatekey.pem', 'utf8');  
	const certificate = fs.readFileSync(buildPath + '/certificate.pem', 'utf8');
	const options = {key:privatekey, cert:certificate}; 
	// 静态资源

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));

	app.use('/rack', express.static(path.join(process.cwd(), '/dist')));

	// 请求转发
	app.use('/', agentMiddleware)

	const server = https.createServer(options, app);  
	server.listen(443);	
	console.log('服务启动成功');
} 

function agentMiddleware(req, res, next) {
	// 暂时写死ip
	const url = 'https://111.206.227.230' + req.url;
	
	if(req.method.toLowerCase() === 'post') {
		request.post(url)
			.send(req.body)
			.set('Cookie', req.headers.cookie || '')
			.set('Referer', req.headers.referer || '')
			.set('Host', 'daojia.jd.com')
			.set('Content-Type', req.headers['content-type'])
			.set('X-Requested-With', 'XMLHttpRequest')
			.end(handleResult(req, res))
	} else {
		request[req.method.toLowerCase()](url)
			.set('Cookie', req.headers.cookie || '')
			.set('Referer', req.headers.referer || '')
			.set('Host', 'daojia.jd.com')
			.end(handleResult(req, res))
	} 
}


function handleResult(req, res) {
	return function(err, response) {
		if(err) {
			console.log(err);
			res.end('err');
			return;
		}

		// JSONP
		if(req.query.callback) {
			res.writeHead(200, {
				'Content-Type': "text/plain"
			})
			res.end(response.res.text);
		}else {
			if(response.headers['content-type'] === 'text/html') {
				res.end(response.res.text);
				return;
			}
			res.send((response || {}).body);
		}
	}
}


function createCert() {
	exec('openssl genrsa -out privatekey.pem 1024', {
			stdio: 'inherit',
			cwd: buildPath
		})
	exec('openssl req -new -key privatekey.pem -out certrequest.csr', {
			stdio: 'inherit',
			cwd: buildPath
		})
	exec('openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem', {
			stdio: 'inherit',
			cwd: buildPath
		})
}
