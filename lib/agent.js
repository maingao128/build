const express = require('express');
const request = require('superagent');
const app = express();
const fs = require('fs'); 
const path = require('path');
const https = require('https'); 
const exec = require('child_process').execSync;
const bodyParser = require('body-parser');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = function() {
	if(!fs.existsSync('privatekey.pem')) {
		createCert();
	}
	const privatekey = fs.readFileSync('privatekey.pem', 'utf8');  
	const certificate = fs.readFileSync('certificate.pem', 'utf8');
	const options = {key:privatekey, cert:certificate}; 
	// 静态资源

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));

	app.use('/rack', express.static(path.join(process.cwd(), '/dist')));

	// 请求转发
	app.use('/', function(req, res, next) {
		// 暂时写死ip
		request[req.method.toLowerCase()]('https://111.206.227.230' + req.url)
			.set('Cookie', req.headers.cookie || '')
			.set('Referer', req.headers.referer || '')
			.set('Host', 'daojia.jd.com')
			.set('Content-Type', req.headers['Content-Type'])
			.send(req.body)
			.end(function(err, response){
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
				
			})
	})

	const server = https.createServer(options, app);  
	server.listen(443);	
	console.log('服务启动成功');
} 


function createCert() {
	exec('openssl genrsa -out privatekey.pem 1024', {
			stdio: 'inherit'
		})
	exec('openssl req -new -key privatekey.pem -out certrequest.csr', {
			stdio: 'inherit'
		})
	exec('openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem', {
			stdio: 'inherit'
		})
}
