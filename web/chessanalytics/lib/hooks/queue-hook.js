var GenericHook = require('./generic-hook'),
	analyser = require('./../analyser').analyser,
	queue_manager = require('./../queue-manager').queue_manager;


var QueueHook = function(){
	this.ctor();
};

QueueHook.prototype = GenericHook.prototype;

QueueHook.prototype.set_data = function(){
	//console.log("QueueHook.prototype.set_data");
	var self = this;

	queue_manager.in_queue(function(err, count){
		queue_manager.get_next(6, function(err, games){
			self.last_data = { 
				games: games,
				count: count 
			};
			//console.log("queue_manager.get_next");
			self.send(self.last_data);
		});
	});
};

QueueHook.prototype.send_to_client = function(client, data){
	//console.log("QueueHook.prototype.send_to_client");
	//console.log(data);
	if(!data){ data = this.last_data; }
	if(!data){ data = {}; }
	client.emit('queue', data.games, data.count);
};

QueueHook.prototype.listen = function(){
	//console.log("QueueHook.prototype.listen");
	var self = this;

	self.set_data();
//	self.send(self.last_data);
	analyser.emitter.on('analysis_started', function(data){
		//console.log("QueueHook.prototype.analysis_started");
		self.set_data();
		self.send(self.last_data);
	});
};

module.exports = QueueHook;