/**
 * this file is changed version of stockfish.js
 * this can load js stockfish engine or native stockfish engine
 */
var spawn = require('child_process').spawn,
	util = require('util'),
	winston = require('winston'),
	emitter = require('events').EventEmitter;

var fs = require("fs");
var path = __dirname + "/../../public/logs/"+new Date().getTime()+".txt";

function writeLog(data){
	fs.appendFileSync(path, data+"\n");
}
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
info_mapping.mate = 'mate';
info_mapping.pv = 'bestline';

var triggers={};
triggers.compare = 'compare';
triggers.bestmove = 'bestmove';
triggers.ready = 'ready';
triggers.game_analysed = 'game_analysed';

var DEFAULT_DEPTH = 15;


"use strict";

var debugging = false;

function spawn_worker(path)
{
    var engine,
        worker = {},
        options = [];
    
    function echo(data)
    {
        var str;
        if (worker.onmessage) {
            str = data.toString();
            /// Trim off new lines.
            if (str.slice(-1) === "\n") {
                str = str.slice(0, -1);
            }
            worker.onmessage(str);
        } else {
            setTimeout(function wait()
            {
                onstd(data);
            }, 50);
        }
    }
    
    if (path.slice(-3).toLowerCase() === ".js") {
        options.push(path);
        path = process.execPath;
    }
    engine = require("child_process").spawn(path/* + " " + options[0]*/, options, {stdio: "pipe"});
    
//    engine.stdout.on("data", echo);
    
    ///NOTE: The "bench" command sends the final result in stderr.
//    engine.stderr.on("data", echo);
    
    engine.on("error", function (err)
    {
        throw err;
    });
    
    worker.postMessage = function onin(str)
    {
        engine.stdin.write(str + "\n");
    };
    
    worker.engine = engine;
    
    return engine;
}

function new_worker(path)
{
    /// Is this Node.js?
    if (Object.prototype.toString.call(global.process) === "[object process]") {
        return spawn_worker(require("path").join(__dirname, "jsengine", "stockfish.js"));
    }
    
    path = path || "stockfish.js";
    
    if (typeof Worker === "function") {
        return new Worker(path);
    }
}


var Stockfish = module.exports.Stockfish = function(depth){
	var self = this, i, split_data;

	if(!depth){ self.depth = DEFAULT_DEPTH; }
	else{ self.depth = depth; }
	
//	depth = "infinite";

	self.emitter = new emitter();
	self.spawn = spawn('stockfish',[]);
//	self.spawn = new_worker();
	
//	self.spawn = require("child_process").spawn("./jsengine/stockfish.js", [], {stdio: "pipe"});

	self.spawn.stdout.on('data', function(data){
		
		self.emitter.emit('data', data.toString());
		writeLog(data.toString());
		split_data = data.toString().split('\n');
		for(i=0; i<split_data.length; i++){
			self.parse_response(split_data[i].replace("lowerbound ","").replace("upperbound ","").split(' '));
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
	if (response && response.length > 0 && response[0] == "nodes") {
		return;
	}
	var kv;
	this.stored_info = this.parse_info(0, response, {});
};

Stockfish.prototype.ready = function(){
	this.emitter.emit(triggers.ready);
};

Stockfish.prototype.bestmove = function(response){
	try{
		this.strength = this.stored_info.centipawns[this.stored_info.centipawns.length-1];
	}catch(err){
		this.strength = 0;
		try{
			this.strength = this.stored_info.mate[this.stored_info.mate.length-1];
		}catch(err){
			this.strength = 0;
		}
	}

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
//	writeLog("get_move_data");
	writeLog(position_cmd);
	writeLog(move_cmd);

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
		writeLog("actual_move_data");
		writeLog(JSON.stringify(actual_move_data));
		
		//self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.ponder)
		self.get_move_data(util.format(COMMANDS.start_new, position), util.format(COMMANDS.ponder, self.depth)
		, function(bestmove_data){

			writeLog("bestmove_data");
			writeLog(JSON.stringify(bestmove_data));
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
//			writeLog(data);
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

function trim(s){
　　    return s.replace(/(^\s*)|(\s*$)/g, "");
}
Stockfish.prototype.analyse_game = function(game,gamedata){
//	path = __dirname + "/logs/"+new Date().getTime()+".txt";
	var title = "";
	if (gamedata) {
		var headers = gamedata.metadata;
		if (!headers['event']) {
			headers['event'] = "";
		}
		if (!headers['white']) {
			headers['white'] = "";
		}
		if (!headers['black']) {
			headers['black'] = "";
		}
		title = headers['event']+" "+headers['white']+" "+headers['black'];
	}
	path = __dirname + "/../../public/logs/"+title+"_"+new Date().getTime()+".txt";
	if (gamedata) {
		writeLog(gamedata.rawdata);
	}
	var moves = this.parse_moves(trim(game).split(' '));
	if (moves.length > 0) {
		//do not search for the last move
		moves.splice(moves.length - 1 , 1);
	}
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