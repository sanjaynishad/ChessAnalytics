/* PNG Converter

This driver requires pgn-extract to be installed and in the path.

Download PGN Extract from http://www.cs.kent.ac.uk/people/staff/djb/pgn-extract/

Example usage:

1. Convert file example
//create a new converter object
var pgn_converter = new PGNConverter();

//listen for when the conversion has been finished
pgn_converter.emitter.on('converted', function(data){
	console.log(data);
});

//convert a file
pgn_converter.convert_file('lib/game.pgn');


2. Convert string example
var pgn_converter = new PGNConverter();
pgn_converter.emitter.on('converted', function(data){
	console.log(data);
});
pgn_converter.convert('1.e4 c5 2.c4 Nc6 3.d3 e5 4.Be2 Nf6 5.Nc3 d6 6.f4 exf4 7.Bxf4 Be7 8.Nf3 O-O 9.O-O Bg4 10.h3 Bh5 11.Nd5 Bxf3 12.Bxf3 Nd4 13.Be3 Nxf3+ 14.Rxf3 Nxd5 15.cxd5 Bg5 16.Qd2 Bxe3+ 17.Qxe3 f6 18.Rg3 Qe7 19.Rf1 Qe5 20.b3 a521.Rf5 Qa1+ 22.Kh2 b6 23.Rh5 g6 24.Qh6 Ra7 25.Qf4 Qxa2 26.Qxd6 Qxb3 27.d4 Qb4 28.dxc5 Qxc5 29.Qe6+ Rff7 30.e5 Rae7');


Public Attributes:
	pgn_converter.emitter
		Event Emitter for pgn_converter events

Triggers:
	'converted'
		When: the pgn file has been converted
		Data: 
			gamedata: a list of the moves
			metadata: a key value pair of the metadata

	'exit'
		When: the pgn_converter has exited
		Data: null

Public Methods:
	convert_file(file_name):
		Called with a file name
		Example: pgn_converter.convert_file('lib/game.pgn')
		Triggers: 'converted'

	convert(string):
		Called with a text string
		Example: pgn_converter.convert('lib/game.pgn')
		Triggers: 'converted'
*/

var spawn = require('child_process').spawn,
	fs = require('fs'),
	util = require('util'),
	winston = require('winston'),
	emitter = require('events').EventEmitter;

var triggers={};
triggers.exit = 'exit';
triggers.converted = 'converted';

TMP_FILE = "/tmp/tmp_game%s.pgn";
var isWin = /^win/.test(process.platform);
if (isWin) {
	TMP_FILE = 'F:/temp/tmp_game%s.pgn';
}

var PGNConverter = module.exports.PGNConverter = function(){
	this.emitter = new emitter();
	this.metadata = {};
	this.gamedata = [];
};

PGNConverter.prototype.convert_file_helper = function(args){
	var self = this;
	self.spawn = spawn('pgn-extract', args);
	
	self.spawn.on('exit', function (code) {
		winston.info('PGN Converter exited!');
		self.emitter.emit(triggers.exit);
	});
};

PGNConverter.prototype.convert_file = function(pgn_file){
	var self = this;
	self.convert_file_helper(['-Wlalg', '-C', '-N', '-V', pgn_file]);

	self.spawn.stdout.on('data', function(data){
		console.log('convert_file result');
		console.log(data);
		self.parse_response(data.toString().split('\n'));
	});
};

PGNConverter.prototype.strip_file = function(pgn_file){
	console.log('strip_file');
	var self = this;
	self.convert_file_helper(['-C', '-N', '-V', pgn_file]);

	self.spawn.stdout.on('data', function(data){
		winston.info('strip_file get data!');
		self.emitter.emit(triggers.converted, data.toString());
	});
};

PGNConverter.prototype.add_metadata = function(line){
	winston.info('add_metadata');
	winston.info(line);
	var arr = line.slice(1, line.length-1).split(' ');
	this.metadata[arr[0]] = arr.slice(1, arr.length).join(' ').replace(/\"/g,'');;
};

PGNConverter.prototype.add_to_game = function(line){
	winston.info('add_to_game');
	winston.info(line);
	if(line){ this.gamedata = this.gamedata.concat(line.split(' ')); }
};

PGNConverter.prototype.parse_response = function(lines){
	var i;
	for(i=0; i<lines.length; i++){
		if(lines[i][0] === '['){
			this.add_metadata(lines[i]);
		}else{
			this.add_to_game(lines[i]);
		}
	}
	this.emitter.emit(triggers.converted, {gamedata: this.gamedata, metadata: this.metadata});
};

PGNConverter.prototype.convert_helper = function(string){
	var suffix = new Date().getTime();
	var file_name = util.format(TMP_FILE, suffix);

	fs.writeFileSync(file_name, new Buffer(string));
	return file_name;
};
PGNConverter.prototype.convert = function(string){
	file_name = this.convert_helper(string);
	this.convert_file(file_name);
};
PGNConverter.prototype.strip = function(string){
	file_name = this.convert_helper(string);
	this.strip_file(file_name);
};
/*
var pgn_converter = new PGNConverter();
pgn_converter.emitter.on('converted', function(data){
	console.log(data);
});
pgn_converter.convert('1.e4 c5 2.c4 Nc6 3.d3 e5 4.Be2 Nf6 5.Nc3 d6 6.f4 exf4 7.Bxf4 Be7 8.Nf3 O-O 9.O-O Bg4 10.h3 Bh5 11.Nd5 Bxf3 12.Bxf3 Nd4 13.Be3 Nxf3+ 14.Rxf3 Nxd5 15.cxd5 Bg5 16.Qd2 Bxe3+ 17.Qxe3 f6 18.Rg3 Qe7 19.Rf1 Qe5 20.b3 a521.Rf5 Qa1+ 22.Kh2 b6 23.Rh5 g6 24.Qh6 Ra7 25.Qf4 Qxa2 26.Qxd6 Qxb3 27.d4 Qb4 28.dxc5 Qxc5 29.Qe6+ Rff7 30.e5 Rae7');
*/
/*
var pgn_converter = new PGNConverter();
pgn_converter.convert_file('lib/tehrani_bm_vs_theramparts_2012_08_02.pgn');
pgn_converter.emitter.on('converted', function(data){
	console.log(data);
});
*/