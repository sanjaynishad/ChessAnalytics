var C = require('./../config'),
	nconf = require('nconf'),
	mongoose = require('mongoose'),
	util = require('util'),
	Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

//mongoose.connect(util.format('mongodb://%s:%s/%s', nconf.get('mongo_host'), nconf.get('mongo_port'), nconf.get('mongo_db')));

var Game = new Schema({
	user_id: String,
	date: String,
	site: String,
	event: String,
	round: String,
	white: String,
	black: String,
	result: String,
	whiteelo: String,
	blackelo: String,
	timecontrol: String,
	termination: String,
	pgn: String,
	private: { type: Boolean, default: false },
	analysis: {},
    created: { type: Date, default: Date.now }
});
module.exports.Game = mongoose.model('Game1', Game);
Game.plugin(mongoosePaginate);

var User = new Schema({
	id: String,
	familyName: String,
	givenName: String,
	displayName: String,
	emails: []
});
module.exports.User = mongoose.model('User1', User);

var Queue = new Schema({
	order: Number,
	private: { type: Boolean, default: false },
	user_id: String,
	pgn: String,
    created: { type: Date, default: Date.now }
});
module.exports.Queue = mongoose.model('Queue', Queue);
Queue.plugin(mongoosePaginate);

var PgnRepo = new Schema({
	title: String,
	pgn: String,
    created: { type: Date, default: Date.now }
});
module.exports.PgnRepo = mongoose.model('PgnRepo', PgnRepo);
PgnRepo.plugin(mongoosePaginate);