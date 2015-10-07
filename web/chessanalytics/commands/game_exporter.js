#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
	util = require('util'),
	C = require('./../config'),
	nconf = require('nconf'),
	fs = require('fs'),
	GameSearcher = require('./../lib/game-searcher').GameSearcher;

program
  .version('0.0.1')
  .option('-p, --page [page=1]', 'Page', 1)
  .option('-s, --sort [sort=["-date"]]', 'Sort', '["-date"]')
  .option('-q, --search-query', 'Search', '')
  .option('-o, --output [outputfile]', 'Output', '')
  .parse(process.argv);

var sort = JSON.parse(program.sort);

if(!program.output){
	console.log('Must supply an output file (-o)');
	process.exit(1);
}

if(isNaN(program.page)){
	console.log('Page must be a number (-p)');
	process.exit(1);
}

if(typeof(sort) !== 'object'){
	console.log('Sort must be valid JSON (-s)');
	process.exit(1);
}
if(!program.search){ program.search = ''; }
if(typeof(program.search) !== 'string'){
	console.log('Search must be a string (-q)');
	process.exit(1);
}
//
var game_searcher = new GameSearcher();	
game_searcher.search({
	page: program.page,
	sort: sort,
	search: program.search
}, function(err, games){
	fs.writeFile(program.output, JSON.stringify(games), function(err){
		if(err){
			console.log('Write failed.  Probably an invalid output target.')
			process.exit(1);
		}
		console.log(util.format('Exported to %s', program.output));
		process.exit(0);
	});
});