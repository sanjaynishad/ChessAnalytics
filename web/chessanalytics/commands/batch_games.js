#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
	util = require('util'),
	C = require('./../config'),
	nconf = require('nconf'),
	BatchQueuer = require('./../lib/batch-queuer').BatchQueuer,
	queue_manager = require('./../lib/queue-manager').queue_manager,
	_private = false;

program
  .version('0.0.1')
  .option('-f, --folder [folder]', 'Pick the folder to load games in from')
  .option('-u, --user-id [user_id]', 'Enter a user id these games are attributed to')
  .option('-p, --private [private]', 'Enter t if these are private games')
  .parse(process.argv);

if(!program.folder || !program.folder.trim()){
	console.log('Must include a folder');
	process.exit(1);
}

if(!program.userId || !program.userId.trim()){
	console.log('Must include a user id');
	process.exit(1);
}

console.log('You will have to manually stop this script when all the games have been loaded to the queue.');

if(program.private && program.private.toLowerCase() === 't'){
	_private = true;
}

/* Start Batch */
var batch_queuer = new BatchQueuer();

queue_manager.emitter.on('done', function(){
	process.stdout.write('.');
});

/*
queue_manager.emitter.on('_error', function(data){
	console.log(data.display);
});
*/

batch_queuer.emitter.on('_error', function(data){
	console.log(data.display);
	process.exit(1);
});

batch_queuer.emitter.once('all_added_to_manager', function(data){
	console.log('All added to manager.');
});
batch_queuer.queue_folder(program.userId, _private, program.folder);