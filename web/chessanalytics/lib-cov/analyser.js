/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['analyser.js']) {
  _$jscoverage['analyser.js'] = [];
  _$jscoverage['analyser.js'][27] = 0;
  _$jscoverage['analyser.js'][36] = 0;
  _$jscoverage['analyser.js'][37] = 0;
  _$jscoverage['analyser.js'][38] = 0;
  _$jscoverage['analyser.js'][39] = 0;
  _$jscoverage['analyser.js'][41] = 0;
  _$jscoverage['analyser.js'][42] = 0;
  _$jscoverage['analyser.js'][43] = 0;
  _$jscoverage['analyser.js'][44] = 0;
  _$jscoverage['analyser.js'][47] = 0;
  _$jscoverage['analyser.js'][50] = 0;
  _$jscoverage['analyser.js'][51] = 0;
  _$jscoverage['analyser.js'][52] = 0;
  _$jscoverage['analyser.js'][54] = 0;
  _$jscoverage['analyser.js'][57] = 0;
  _$jscoverage['analyser.js'][58] = 0;
  _$jscoverage['analyser.js'][59] = 0;
  _$jscoverage['analyser.js'][60] = 0;
  _$jscoverage['analyser.js'][62] = 0;
  _$jscoverage['analyser.js'][63] = 0;
  _$jscoverage['analyser.js'][64] = 0;
  _$jscoverage['analyser.js'][65] = 0;
  _$jscoverage['analyser.js'][72] = 0;
  _$jscoverage['analyser.js'][73] = 0;
  _$jscoverage['analyser.js'][78] = 0;
  _$jscoverage['analyser.js'][79] = 0;
  _$jscoverage['analyser.js'][80] = 0;
  _$jscoverage['analyser.js'][84] = 0;
  _$jscoverage['analyser.js'][85] = 0;
  _$jscoverage['analyser.js'][87] = 0;
  _$jscoverage['analyser.js'][88] = 0;
  _$jscoverage['analyser.js'][91] = 0;
  _$jscoverage['analyser.js'][92] = 0;
  _$jscoverage['analyser.js'][93] = 0;
  _$jscoverage['analyser.js'][94] = 0;
  _$jscoverage['analyser.js'][100] = 0;
  _$jscoverage['analyser.js'][103] = 0;
  _$jscoverage['analyser.js'][104] = 0;
  _$jscoverage['analyser.js'][105] = 0;
  _$jscoverage['analyser.js'][107] = 0;
  _$jscoverage['analyser.js'][108] = 0;
  _$jscoverage['analyser.js'][110] = 0;
  _$jscoverage['analyser.js'][114] = 0;
  _$jscoverage['analyser.js'][115] = 0;
  _$jscoverage['analyser.js'][117] = 0;
  _$jscoverage['analyser.js'][121] = 0;
  _$jscoverage['analyser.js'][124] = 0;
  _$jscoverage['analyser.js'][125] = 0;
  _$jscoverage['analyser.js'][127] = 0;
  _$jscoverage['analyser.js'][130] = 0;
  _$jscoverage['analyser.js'][131] = 0;
  _$jscoverage['analyser.js'][134] = 0;
  _$jscoverage['analyser.js'][136] = 0;
  _$jscoverage['analyser.js'][138] = 0;
  _$jscoverage['analyser.js'][141] = 0;
  _$jscoverage['analyser.js'][143] = 0;
  _$jscoverage['analyser.js'][145] = 0;
  _$jscoverage['analyser.js'][148] = 0;
  _$jscoverage['analyser.js'][149] = 0;
  _$jscoverage['analyser.js'][151] = 0;
  _$jscoverage['analyser.js'][152] = 0;
  _$jscoverage['analyser.js'][156] = 0;
  _$jscoverage['analyser.js'][157] = 0;
  _$jscoverage['analyser.js'][160] = 0;
}
_$jscoverage['analyser.js'][27]++;
var util = require("util"), winston = require("winston"), emitter = require("events").EventEmitter, nconf = require("nconf"), models = require("./../models"), Stockfish = require("./stockfish").Stockfish, PGNConverter = require("./pgn-converter").PGNConverter;
_$jscoverage['analyser.js'][36]++;
var Analyser = (function () {
  _$jscoverage['analyser.js'][37]++;
  var self = this;
  _$jscoverage['analyser.js'][38]++;
  self.processing = false;
  _$jscoverage['analyser.js'][39]++;
  self.emitter = new emitter();
  _$jscoverage['analyser.js'][41]++;
  self.emitter.on("ready", (function (data) {
  _$jscoverage['analyser.js'][42]++;
  if (! self.processing) {
    _$jscoverage['analyser.js'][43]++;
    self.depth = data.depth;
    _$jscoverage['analyser.js'][44]++;
    self.run();
  }
}));
  _$jscoverage['analyser.js'][47]++;
  self.run();
});
_$jscoverage['analyser.js'][50]++;
Analyser.prototype.run = (function () {
  _$jscoverage['analyser.js'][51]++;
  var self = this;
  _$jscoverage['analyser.js'][52]++;
  self.processing = true;
  _$jscoverage['analyser.js'][54]++;
  models.Queue.findOne({}).sort("order").exec((function (err, queue) {
  _$jscoverage['analyser.js'][57]++;
  if (! queue) {
    _$jscoverage['analyser.js'][58]++;
    self.processing = false;
  }
  else {
    _$jscoverage['analyser.js'][59]++;
    if (err) {
      _$jscoverage['analyser.js'][60]++;
      winston.crit(JSON.stringify(err, null, "  "));
    }
    else {
      _$jscoverage['analyser.js'][62]++;
      self.analyse(queue, (function () {
  _$jscoverage['analyser.js'][63]++;
  queue.remove((function (err) {
  _$jscoverage['analyser.js'][64]++;
  if (err) {
    _$jscoverage['analyser.js'][64]++;
    winston.crit(JSON.stringify(err, null, "  "));
  }
  else {
    _$jscoverage['analyser.js'][65]++;
    self.run();
  }
}));
}));
    }
  }
}));
});
_$jscoverage['analyser.js'][72]++;
Analyser.prototype.save_game = (function (queue, pgn_data, pgn, analysis_data, cb) {
  _$jscoverage['analyser.js'][73]++;
  var game = new models.Game(), _private = (queue["private"] === true)? true: false, new_turns = [], k, i, turn;
  _$jscoverage['analyser.js'][78]++;
  for (k in pgn_data.metadata) {
    _$jscoverage['analyser.js'][79]++;
    if (k.toLowerCase() !== "whiteelo" && k.toLowerCase() !== "blackelo") {
      _$jscoverage['analyser.js'][80]++;
      game[k.toLowerCase()] = pgn_data.metadata[k];
    }
}
  _$jscoverage['analyser.js'][84]++;
  game.user_id = queue.user_id;
  _$jscoverage['analyser.js'][85]++;
  game["private"] = _private;
  _$jscoverage['analyser.js'][87]++;
  game.whiteelo = (! isNaN(Number(pgn_data.metadata.WhiteElo)))? Number(pgn_data.metadata.WhiteElo): null;
  _$jscoverage['analyser.js'][88]++;
  game.blackelo = (! isNaN(Number(pgn_data.metadata.BlackElo)))? Number(pgn_data.metadata.BlackElo): null;
  _$jscoverage['analyser.js'][91]++;
  for (i = 0; i < analysis_data.game.turns.length; i++) {
    _$jscoverage['analyser.js'][92]++;
    turn = analysis_data.game.turns[i];
    _$jscoverage['analyser.js'][93]++;
    if (i % 2 === 0) {
      _$jscoverage['analyser.js'][94]++;
      new_turns.push({turn: Math.ceil((i + 1) / 2), white: turn, black: null});
    }
    else {
      _$jscoverage['analyser.js'][100]++;
      new_turns[new_turns.length - 1].black = turn;
    }
}
  _$jscoverage['analyser.js'][103]++;
  analysis_data.game.turns = new_turns;
  _$jscoverage['analyser.js'][104]++;
  game.analysis = analysis_data;
  _$jscoverage['analyser.js'][105]++;
  game.pgn = pgn;
  _$jscoverage['analyser.js'][107]++;
  game.save((function (err) {
  _$jscoverage['analyser.js'][108]++;
  if (err) {
    _$jscoverage['analyser.js'][108]++;
    winston.warn(JSON.stringify(err, null, "  "));
  }
  _$jscoverage['analyser.js'][110]++;
  if (cb) {
    _$jscoverage['analyser.js'][110]++;
    cb(err, game);
  }
}));
});
_$jscoverage['analyser.js'][114]++;
Analyser.prototype.get_game_data = (function (queue, cb) {
  _$jscoverage['analyser.js'][115]++;
  if (! this.depth || this.depth > 20) {
    _$jscoverage['analyser.js'][115]++;
    this.depth = nconf.get("default_depth");
  }
  _$jscoverage['analyser.js'][117]++;
  var self = this, pgn_converter = new PGNConverter(), stockfish = new Stockfish(this.depth);
  _$jscoverage['analyser.js'][121]++;
  pgn_converter.emitter.once("converted", (function (pgn_data) {
  _$jscoverage['analyser.js'][124]++;
  self.current_game = pgn_data;
  _$jscoverage['analyser.js'][125]++;
  self.emitter.emit("analysis_started");
  _$jscoverage['analyser.js'][127]++;
  pgn_converter.emitter.once("converted", (function (pgn) {
  _$jscoverage['analyser.js'][130]++;
  stockfish.emitter.on("data", (function (data) {
  _$jscoverage['analyser.js'][131]++;
  self.emitter.emit("data", data);
}));
  _$jscoverage['analyser.js'][134]++;
  stockfish.emitter.once("game_analysed", (function (analysis_data) {
  _$jscoverage['analyser.js'][136]++;
  if (cb) {
    _$jscoverage['analyser.js'][136]++;
    cb(pgn_data, pgn, analysis_data);
  }
  _$jscoverage['analyser.js'][138]++;
  stockfish.end();
}));
  _$jscoverage['analyser.js'][141]++;
  stockfish.analyse_game(pgn_data.gamedata.join(" "));
}));
  _$jscoverage['analyser.js'][143]++;
  pgn_converter.strip(queue.pgn);
}));
  _$jscoverage['analyser.js'][145]++;
  pgn_converter.convert(queue.pgn);
});
_$jscoverage['analyser.js'][148]++;
Analyser.prototype.analyse = (function (queue, cb) {
  _$jscoverage['analyser.js'][149]++;
  var self = this;
  _$jscoverage['analyser.js'][151]++;
  self.get_game_data(queue, (function (pgn_data, pgn, analysis_data) {
  _$jscoverage['analyser.js'][152]++;
  self.save_game(queue, pgn_data, pgn, analysis_data, cb);
}));
});
_$jscoverage['analyser.js'][156]++;
Analyser.prototype.being_analysed = (function () {
  _$jscoverage['analyser.js'][157]++;
  return this.current_game;
});
_$jscoverage['analyser.js'][160]++;
var analyser = module.exports.analyser = new Analyser();
_$jscoverage['analyser.js'].source = ["/* Analyser","","Analyser is a singleton, in charge of managing all analytics run by this module.  ","The only access to this module is (intended to be) by triggering events to it.","","Example usage:","","var analyser = require('./../lib/analyser').analyser;","","// Tell the analyser that there is something in the queue that is ready to be processed ","analyser.emitter.emit('ready');","","","","Public Attributes:","\tanalyser.emitter","\t\tEvent Emitter for analyser events","","Triggers (inputs):","\t'ready'","\t\tWhen: trigger this when a game has been saved to the queue","\t\tData:","\t\t\tdepth: int, &lt;= 20!","*/","","","var util = require('util'),","\twinston = require('winston'),","\temitter = require('events').EventEmitter,","\tnconf = require('nconf'),","","\tmodels = require('./../models'),","\tStockfish = require('./stockfish').Stockfish,","\tPGNConverter = require('./pgn-converter').PGNConverter;","","var Analyser = function(){","\tvar self = this;","\tself.processing = false;","\tself.emitter = new emitter();","\t","\tself.emitter.on('ready', function(data){","\t\tif(!self.processing){","\t\t\tself.depth = data.depth;","\t\t\tself.run();","\t\t}","\t});","\tself.run();","};","","Analyser.prototype.run = function(){","\tvar self = this;","\tself.processing = true;","","\tmodels.Queue.findOne({})","\t.sort('order')","\t.exec(function(err, queue){","\t\tif(!queue){","\t\t\tself.processing = false;","\t\t}else if(err){","\t\t\twinston.crit(JSON.stringify(err, null, '  '));","\t\t}else{","\t\t\tself.analyse(queue, function(){","\t\t\t\tqueue.remove(function(err){","\t\t\t\t\tif(err){ winston.crit(JSON.stringify(err, null, '  ')); }","\t\t\t\t\telse{ self.run(); }","\t\t\t\t});","\t\t\t});","\t\t}","\t});","};","","Analyser.prototype.save_game = function(queue, pgn_data, pgn, analysis_data, cb){","\tvar game = new models.Game(),","\t\t_private = (queue.private === true) ? true : false,","\t\tnew_turns=[],","\t\tk, i, turn;","","\tfor(k in pgn_data.metadata){","\t\tif(k.toLowerCase() !== 'whiteelo' &amp;&amp; k.toLowerCase() !== 'blackelo'){","\t\t\tgame[k.toLowerCase()] = pgn_data.metadata[k];","\t\t}","\t}","\t","\tgame.user_id = queue.user_id;","\tgame.private = _private;","","\tgame.whiteelo = (!isNaN(Number(pgn_data.metadata.WhiteElo))) ?  Number(pgn_data.metadata.WhiteElo) : null;","\tgame.blackelo = (!isNaN(Number(pgn_data.metadata.BlackElo))) ?  Number(pgn_data.metadata.BlackElo) : null;","","","\tfor(i=0; i&lt;analysis_data.game.turns.length; i++){","\t\tturn = analysis_data.game.turns[i];","\t\tif(i % 2 === 0){","\t\t\tnew_turns.push({","\t\t\t\tturn: Math.ceil((i+1) / 2),","\t\t\t\twhite: turn,","\t\t\t\tblack: null","\t\t\t});","\t\t}else{","\t\t\tnew_turns[new_turns.length-1].black = turn;","\t\t}","\t}","\tanalysis_data.game.turns = new_turns;","\tgame.analysis =  analysis_data;","\tgame.pgn = pgn;","","\tgame.save(function(err){","\t\tif(err){ winston.warn(JSON.stringify(err, null, '  ')); }","","\t\tif(cb){ cb(err, game); }","\t});","};","","Analyser.prototype.get_game_data = function(queue, cb){","\tif(!this.depth || this.depth &gt; 20){ this.depth = nconf.get('default_depth'); }","","\tvar self = this,","\t\tpgn_converter = new PGNConverter(),","\t\tstockfish = new Stockfish(this.depth);","","\tpgn_converter.emitter.once('converted', function(pgn_data){","\t\t","\t\t/* Broadcast that the analysis has started */","\t\tself.current_game = pgn_data;","\t\tself.emitter.emit('analysis_started');","","\t\tpgn_converter.emitter.once('converted', function(pgn){","","\t\t\t/* Rebroadcast Stockfish Data */","\t\t\tstockfish.emitter.on('data', function(data){","\t\t\t\tself.emitter.emit('data', data);","\t\t\t});","","\t\t\tstockfish.emitter.once('game_analysed', function(analysis_data){","\t\t\t\t","\t\t\t\tif(cb){ cb(pgn_data, pgn, analysis_data); }","","\t\t\t\tstockfish.end();","\t\t\t});","","\t\t\tstockfish.analyse_game(pgn_data.gamedata.join(' '));","\t\t});","\t\tpgn_converter.strip(queue.pgn);","\t});\t","\tpgn_converter.convert(queue.pgn);","};","","Analyser.prototype.analyse = function(queue, cb){","\tvar self = this;","","\tself.get_game_data(queue, function(pgn_data, pgn, analysis_data){","\t\tself.save_game(queue, pgn_data, pgn, analysis_data, cb);","\t});","};","","Analyser.prototype.being_analysed = function(){","\treturn this.current_game;","};","","var analyser = module.exports.analyser = new Analyser();"];
