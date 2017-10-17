#!/usr/bin/env node

const program = require('commander');
const pub = require('../lib/pub');
const agent = require('../lib/agent');
const pkg = require('../package.json');

program
	.command('pub')
	.description('build and publish the project')
	.action(pub)

program
	.command('pro')
	.description('static resources are from local, data from online')
	.action(agent)


program
	.command('pre')
	.description('static resources are from local, data from online')
	.action(agent)

program.parse(process.argv);