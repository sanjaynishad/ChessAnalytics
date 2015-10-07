/* Batch Queuer

Batch Queuer is a tool to take a folder full of pgns and push each into the queue and then delete them.

Example usage:

var batch_queuer = new require('./../lib/batch-queuer').BatchQueuer();
batch_queuer.queue_folder(user_id, './path/to/pgnfolder/')


Triggers:
	_error
		When: an error occurs
		Data: 
			display
			trace
	all_added_to_manager
		When: all the files in the folder being queued have finished
		Data: null

Public Attributes:
	batch_queuer.emitter
		Event Emitter for batch queuer events

Public Methods:
	queue_folder(user_id, folder):
		Called with the absolute path to the folder
		Example: batch_queuer.queue_folder(user_id, './path/to/pgnfolder/')
		Triggers: 'all_added_to_manager'
*/


var util = require('util'),
	winston = require('winston'),
	emitter = require('events').EventEmitter,
	fs = require('fs'),

	queue_manager = require('./queue-manager').queue_manager,
	models = require('./../models'),
	PGNConverter = require('./pgn-converter').PGNConverter;

var BatchQueuer = module.exports.BatchQueuer = function(){
	this.emitter = new emitter();
};

BatchQueuer.prototype.queue_file_helper = function(i, files, path, user_id, _private){
	var self = this;
	
	if(i >= files.length){
		this.emitter.emit('all_added_to_manager');
		return;
	}

	if(files[i].slice(-4) === '.pgn'){
		fs.readFile(util.format('%s/%s', path, files[i]), function(err, buffer){

			queue_manager.emitter.once('done', function(){
				self.queue_file_helper(i+1, files, path, user_id, _private);
			});

			queue_manager.add_to_queue({
				_private: _private,
				user_id: user_id,
				pgn: buffer.toString()
			});

		});
	}else{
		self.queue_file_helper(i+1, files, path, user_id, _private);
	}
};

BatchQueuer.prototype.queue_folder = function(user_id, _private, path){
	var self = this;

	fs.readdir(path, function(err, files){
		if(err){
			self.emitter.emit('_error', {display: 'Failed to read the folder.'});
			return;
		}
		self.queue_file_helper(0, files, path, user_id, _private);
	});
};