/**
Queue manager (intended to be a singleton) adds things to the queue and communicates events to the analyser. 

@method start_analyser

@method add_to_queue
@params data - _private, pgn, user_id

@event _error
@event ready
@event done

*/
var util = require('util'),
	nconf = require('nconf'),
	winston = require('winston'),
	emitter = require('events').EventEmitter,

	models = require('./../models'),
	analyser = require('./analyser').analyser;

var QueueManager = module.exports.QueueManager = function(){
	this.emitter = new emitter();
	this.start_analyser();
};

QueueManager.prototype.start_analyser = function(){
	analyser.emitter.emit('ready', {depth: nconf.get('default_depth')});
};

QueueManager.prototype.add_to_queue = function(data,cb){
	console.log('add_to_queue');
	var self = this, order, queue;

	data._private = (data._private) ? true : false;

	if(!data.pgn){
		winston.warn('Trying to add to queue without a PGN');
		self.emitter.emit('_error', {display: 'Trying to add to queue without a PGN.'});
		return;
	}
	if(!data.user_id){
		winston.warn('Trying to add to queue without a User ID');
		self.emitter.emit('_error', {display: 'Trying to add to queue without a User Id.'});
		return;
	}
	function empty(err) {
		if (err) {
			console.log(err);
		}
	}
//	models.Queue.remove({}, empty);
	models.Queue.findOne({})
	.sort('-order')
	.exec(function(err, highest_queue){
		if(!highest_queue){ order = 1; }
		else{ order = highest_queue.order + 1; }
		
		queue = new models.Queue({
			order: order+1,
			private: data._private,
			user_id: data.user_id,
			pgn: data.pgn
		});
		queue.save(function(err){
			if(err){ 
				winston.warn(JSON.stringify(err, null, '  ')); 
				self.emitter.emit('_error', {display: 'Failed to save to queue.'});
				return;
			}
			console.log('queue save done');
			if (cb) {
				cb(err);
			} else {
			}
			self.emitter.emit('done', {queue: queue});
			analyser.emitter.emit('ready', {depth: nconf.get('default_depth')});
		});
	});
};

QueueManager.prototype.get_next_helper = function(i, games, cb, results){
	if(!results){ results=[]; }
	if(i >= games.length){
		cb(null, results);
		return;
	}

	var self = this;
};

QueueManager.prototype.get_next = function(count, cb){
	console.log("QueueManager.prototype.get_next");
	var self = this;

	models.Queue.find()
	.sort('order')
	.limit(count)
	.exec(function(err, games){
//		self.get_next_helper(0, games, cb);
		var headlist = [];
		for (var i = 0; i < games.length; i++) {
			var header = {}
			var game = games[i];
			var lineList = game.pgn.split('\n');
			//extract headers
			for (var j = 0; j < lineList.length; j++) {
				var line = trim(lineList[j]);
				if (line == "") {
					continue;
				}
				if (line.charAt(0) == '[') {
					var key = line.replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1').toLowerCase();
					var value = line.replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
			          if (trim(key).length > 0) {
			        	  header[key] = value;
			          }
				}else{
				}
			}
			headlist.push(header);
		}
		cb(err, headlist);
	});
};

QueueManager.prototype.in_queue = function(cb){
	console.log("QueueManager.prototype.in_queue");
	models.Queue.count(cb);
};

function trim(s){
　　    return s.replace(/(^\s*)|(\s*$)/g, "");
}
var queue_manager = module.exports.queue_manager = new QueueManager();