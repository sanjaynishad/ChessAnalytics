/* Stockfish

This driver requires uci chess engine to be installed and in the path.

Stockfish: http://www.stockfishchess.com/


Example usage:
//create a new stockfish object
var stockfish = new require('./path/to/lib/stockfish').Stockfish();
Where 'stockfish' is the shell command of the uci engine

//listen for when a game has been analysed
stockfish.emitter.once('game_analysed', function(data){

	//spit out the data to your log
	console.log(data.game.turns);

	//shut the connection down
	stockfish.end()
});

//start the analysis
stockfish.analyse_game('1. e2e4 c7c5 2. c2c4 b8c6 3. d2d3 e7e5 4. f1e2 g8f6 5. b1c3 d7d6 6. f2f4 e5f4 7. c1f4 f8e7 8. g1f3 e8g8 9. e1g1 c8g4 10. h2h3 g4h5 11. c3d5 h5f3 12. e2f3 c6d4 13. f4e3 d4f3+ 14. f1f3 f6d5 15. c4d5 e7g5 16. d1d2 g5e3+ 17. d2e3 f7f6 18. f3g3 d8e7 19. a1f1 e7e5 20. b2b3 a7a5 21. f1f5 e5a1+ 22. g1h2 b7b6 23. f5h5 g7g6 24. e3h6 a8a7 25. h6f4 a1a2 26. f4d6 a2b3 27. d3d4 b3b4 28. d4c5 b4c5 29. d6e6+ f8f7 30. e4e5 a7e7 31. e6c6 c5c6 32. d5c6 e7e6 33. e5f6 e6c6 34. h5d5 c6f6 35. g3e3 g8g7 36. d5d8 b6b5 37. e3e8 b5b4 38. g2g4 f6f2+ 39. h2g3 f2f3+ 40. g3h4 a5a4 41. g4g5 f7f4');



Public Attributes:
	stockfish.emitter
		Event Emitter for stockfish events

Triggers:
	'compare'
		When: compare results are ready
		Data: 
			difference: decimal difference between the best move and the actual move
			percent: percent difference between the best move and the actual move
			actual_move: data about the actual move
			bestmove: data about the best move

	'bestmove'
		When: bestmove results are ready
		Data:
			bestmove: data about the best move
			strength: cp of the best move
			info: info returned while retrieving the best move

	'ready'
		When: checkready result is ready
		Data: null

	'game_analysed'
		When: a game has been analysed
		Data: 
			turns: a list of comparison data contracts


Public Methods:
	analyse_game(moves):
		Called with the move format of the game in long algebraic notation
		Example: stockfish.analyse_game('1. e2e4 c7c5 2. c2c4 b8c6')
		Triggers: 'game_analysed'

	compare(position, move): 
		Called with the starting position and the next move
		Example: stockfish.compare('e2e4', 'c7c5')
		Triggers: 'compare'

*/

var spawn = require('child_process').spawn,
	util = require('util'),
	winston = require('winston'),
	emitter = require('events').EventEmitter;

var WHITE = 'white';
var BLACK = 'black';

var COMMANDS = {};
COMMANDS.analyse_on = 'setoption name UCI_AnalyseMode value true\n';
COMMANDS.new_game = 'ucinewgame\n'
COMMANDS.check_ready = 'isready\n';
COMMANDS.start_new = 'position startpos moves %s\n';
COMMANDS.position = 'position moves %s\n';
//COMMANDS.ponder = 'go \n';
//COMMANDS.searchmoves = 'go searchmoves %s\n';
COMMANDS.ponder = 'go depth %s\n';
COMMANDS.searchmoves = 'go depth %s searchmoves %s\n';

var RESPONSES = {};
RESPONSES.ctor = 'Stockfish';
RESPONSES.ready = 'readyok';
RESPONSES.bestmove = 'bestmove';
RESPONSES.info = 'info';

var response_mapping={};
response_mapping[RESPONSES.ctor] = 'ctor';
response_mapping[RESPONSES.ready] = 'ready';
response_mapping[RESPONSES.bestmove] = 'bestmove';
response_mapping[RESPONSES.info] = 'info';

var info_mapping={};
info_mapping.depth = 'depth';
info_mapping.score = 'score';
info_mapping.nodes = 'nodes';
info_mapping.nps = 'nps';
info_mapping.time = 'time';
info_mapping.multipv = 'multipv';
info_mapping.currmovenumber = 'currmovenumber';
info_mapping.currmove = 'currmove';
info_mapping.seldepth = 'seldepth';
info_mapping.cp = 'centipawns';
info_mapping.pv = 'bestline';

var triggers={};
triggers.compare = 'compare';
triggers.bestmove = 'bestmove';
triggers.ready = 'ready';
triggers.game_analysed = 'game_analysed';

var DEFAULT_DEPTH = 15;

var Stockfish = module.exports.Stockfish = function(depth){
	var self = this, i, split_data;

	if(!depth){ self.depth = DEFAULT_DEPTH; }
	else{ self.depth = depth; }

	self.emitter = new emitter();
	self.spawn = spawn('stockfish',[]);

	self.spawn.stdout.on('data', function(data){
		
		self.emitter.emit('data', data.toString());
		 console.log(data.toString());
		split_data = data.toString().split('\n');
		for(i=0; i<split_data.length; i++){
			self.parse_response(split_data[i].split(' '));
		}
	});
	self.spawn.stderr.on('data', function(data){
		winston.warn(data.toString());
	});
	self.spawn.on('exit', function (code) {
		winston.info('Stockfish exited!');
	});
};

Stockfish.prototype.ctor = function(){
	this.spawn.stdin.write(COMMANDS.analyse_on);
	this.spawn.stdin.write(COMMANDS.new_game);
	this.spawn.stdin.write(COMMANDS.check_ready);
};

Stockfish.prototype.parse_response = function(response){
	var command = response.splice(0,1)[0];
	if(response_mapping[command]){
		this[response_mapping[command]](response);
	}
};

Stockfish.prototype.parse_info = function(i, response, kv, key){
	if(info_mapping[response[i]]){
		key = info_mapping[response[i]];
	}
	else if(response[i] && key){
		if(!kv[key]){ kv[key] = []; }
		kv[key].push(response[i]);
	}

	if(i >= response.length){
		return kv;
	}else{
		return this.parse_info(i+1, response, kv, key);
	}
};

Stockfish.prototype.info = function(response){
//	console.log("info");
	var kv;
	this.stored_info = this.parse_info(0, response, {});
	console.log(this.stored_info); 
};

Stockfish.prototype.ready = function(){
	this.emitter.emit(triggers.ready);
};

Stockfish.prototype.bestmove = function(response){
	try{
		this.strength = this.stored_info.centipawns[this.stored_info.centipawns.length-1];
	}catch(err){
		this.strength = 0;
	}
	
	console.log(this.strength); 
	
	this.emitter.emit(triggers.bestmove, { bestmove: response, strength: this.strength, info: this.stored_info });
};

Stockfish.prototype.determine_color_move = function(position){
	if(!position){ return WHITE; }
	if(position.split(' ').length % 2 === 0) { return WHITE; }
	return BLACK;
};

Stockfish.prototype.get_move_data = function(position_cmd, move_cmd, cb){
	var self = this;

	winston.debug(position_cmd);
	winston.debug(move_cmd);
	console.log("get_move_data");
//	console.log(position_cmd);
//	console.log(move_cmd);

	self.emitter.once(triggers.bestmove, cb);

	self.spawn.stdin.write(position_cmd);
	self.spawn.stdin.write(move_cmd);
};

Stockfish.prototype.compare = function(position, move){
	var self = this, actual_move, bestmove_data, difference, color, move_not_found=false;
	color = self.determine_color_move(position);
	
	//self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.searchmoves, move)
	self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.searchmoves, self.depth, move)
	, function(actual_move_data){
		if(actual_move_data.bestmove[0] === '(none)'&&actual_move_data.bestmove[0] === '(none)\r'){
			actual_move_data.bestmove[0] = move;
			actual_move_data.strength = '?';
			move_not_found = true;
		}
		
		//self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.ponder)
		self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.ponder, self.depth)
		, function(bestmove_data){

			if(move === bestmove_data.bestmove[0]){
				difference = 0;
			}else{
				difference = Number(bestmove_data.strength) - Number(actual_move_data.strength);
			}

			if(actual_move_data.strength === '?'){
				percent = '?';
			}else if(Number(bestmove_data.strength) === 0){
				percent = 0;
			}else{
				percent = difference / Number(bestmove_data.strength);
			}
			self.emitter.emit(triggers.compare, { difference: difference, percent: percent, actual_move: actual_move_data, bestmove: bestmove_data});

		});

	});
};

Stockfish.prototype.analyse_turn = function(i, moves){
	var self = this;

	if(i >= moves.length+1){
		self.emitter.emit(triggers.game_analysed, { game: self.game } );
	}else{
		self.compare(moves.slice(0, i).join(' '), moves.slice(i, i+1).join(' '))
		self.emitter.once(triggers.compare, function(data){
			self.game.turns.push(data);
			self.analyse_turn(i+1, moves);
		});
	}
};

Stockfish.prototype.parse_moves = function(moves){
	var i, ret=[];
	for(i=0; i<moves.length; i++){
		if(moves[i][moves[i].length-1] !== '.' && moves[i][1] !== '-' && moves[i][3] !== '-'){
			if(moves[i][moves[i].length-1] === '+' || moves[i][moves[i].length-1] === '#'){
				moves[i] = moves[i].slice(0, moves[i].length-1);
			}
			ret.push(moves[i]);
		}
	}
	return ret;
};

Stockfish.prototype.analyse_game = function(game){
	var moves = this.parse_moves(game.split(' '));
	this.game = { turns: []};
	this.analyse_turn(0, moves);
};

Stockfish.prototype.position = function(position){
	this.spawn.stdin.write(util.format(COMMANDS.position, position));
	this.spawn.stdin.write(util.format(COMMANDS.ponder, self.depth));
};

Stockfish.prototype.end = function(){
	/* Feel like I shouldn't be using kill... */
	this.spawn.kill();
};