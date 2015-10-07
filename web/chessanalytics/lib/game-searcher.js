/* Game Searcher

Searches the games!

Example usage:

var game_searcher = new require('./../lib/game-searcher').GameSearcher({});
game_searcher.search({
	page: 2,
	sort: ['date', '-site'],
	search: 'carlsen',
	_private: true,
	user_id: 123
});

Public Methods:
	search(options):
		page, sort, search
*/


var util = require('util'),
	winston = require('winston'),
	models = require('./../models'),
	DEFAULT_LIMIT = 25;

var GameSearcher = module.exports.GameSearcher = function(){};

GameSearcher.prototype.search = function(options, cb){
	var self = this, q_options={}, query, i, skip;
	
	if(!options._private){ q_options.private = false; }
	else{ q_options.private = true; }

	if(options.user_id){ q_options.user_id = options.user_id; }
	if(!options.page){ options.page = 1; }
	if(!options.limit){ options.limit = DEFAULT_LIMIT; }

	var query = models.Game.find(q_options);

	if(options.search){ 
		query.or([{
			black: new RegExp(util.format('.*%s.*', options.search), 'i')
		},{
			white: new RegExp(util.format('.*%s.*', options.search), 'i')
		},{
			event: new RegExp(util.format('.*%s.*', options.search), 'i')
		},{
			date: new RegExp(util.format('.*%s.*', options.search), 'i')
		}]);
	}

	for(i=0; i<options.sort.length; i++){
		query.sort(options.sort[i]);
	}

	skip = (Number(options.page)-1) * Number(options.limit);

	query
	.skip(skip)
	.limit(options.limit)
	.exec(function(err, games){

		query.count(function(err, count){
			if(count === 0 ){
				cb(err, games, options.page, 0);
				return;	
			}
			cb(err, games, options.page, Math.ceil(count / DEFAULT_LIMIT));
		});

	});
};