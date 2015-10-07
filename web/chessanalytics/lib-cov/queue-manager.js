/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['queue-manager.js']) {
  _$jscoverage['queue-manager.js'] = [];
  _$jscoverage['queue-manager.js'][14] = 0;
  _$jscoverage['queue-manager.js'][23] = 0;
  _$jscoverage['queue-manager.js'][24] = 0;
  _$jscoverage['queue-manager.js'][25] = 0;
  _$jscoverage['queue-manager.js'][28] = 0;
  _$jscoverage['queue-manager.js'][29] = 0;
  _$jscoverage['queue-manager.js'][32] = 0;
  _$jscoverage['queue-manager.js'][33] = 0;
  _$jscoverage['queue-manager.js'][35] = 0;
  _$jscoverage['queue-manager.js'][37] = 0;
  _$jscoverage['queue-manager.js'][38] = 0;
  _$jscoverage['queue-manager.js'][39] = 0;
  _$jscoverage['queue-manager.js'][40] = 0;
  _$jscoverage['queue-manager.js'][42] = 0;
  _$jscoverage['queue-manager.js'][43] = 0;
  _$jscoverage['queue-manager.js'][44] = 0;
  _$jscoverage['queue-manager.js'][45] = 0;
  _$jscoverage['queue-manager.js'][48] = 0;
  _$jscoverage['queue-manager.js'][51] = 0;
  _$jscoverage['queue-manager.js'][52] = 0;
  _$jscoverage['queue-manager.js'][54] = 0;
  _$jscoverage['queue-manager.js'][60] = 0;
  _$jscoverage['queue-manager.js'][61] = 0;
  _$jscoverage['queue-manager.js'][62] = 0;
  _$jscoverage['queue-manager.js'][63] = 0;
  _$jscoverage['queue-manager.js'][64] = 0;
  _$jscoverage['queue-manager.js'][66] = 0;
  _$jscoverage['queue-manager.js'][67] = 0;
  _$jscoverage['queue-manager.js'][72] = 0;
  _$jscoverage['queue-manager.js'][73] = 0;
  _$jscoverage['queue-manager.js'][74] = 0;
  _$jscoverage['queue-manager.js'][75] = 0;
  _$jscoverage['queue-manager.js'][76] = 0;
  _$jscoverage['queue-manager.js'][79] = 0;
  _$jscoverage['queue-manager.js'][82] = 0;
  _$jscoverage['queue-manager.js'][83] = 0;
  _$jscoverage['queue-manager.js'][84] = 0;
  _$jscoverage['queue-manager.js'][86] = 0;
  _$jscoverage['queue-manager.js'][89] = 0;
  _$jscoverage['queue-manager.js'][90] = 0;
  _$jscoverage['queue-manager.js'][92] = 0;
  _$jscoverage['queue-manager.js'][96] = 0;
  _$jscoverage['queue-manager.js'][100] = 0;
  _$jscoverage['queue-manager.js'][101] = 0;
  _$jscoverage['queue-manager.js'][104] = 0;
}
_$jscoverage['queue-manager.js'][14]++;
var util = require("util"), nconf = require("nconf"), winston = require("winston"), emitter = require("events").EventEmitter, models = require("./../models"), analyser = require("./analyser").analyser, PGNConverter = require("./pgn-converter").PGNConverter;
_$jscoverage['queue-manager.js'][23]++;
var QueueManager = module.exports.QueueManager = (function () {
  _$jscoverage['queue-manager.js'][24]++;
  this.emitter = new emitter();
  _$jscoverage['queue-manager.js'][25]++;
  this.start_analyser();
});
_$jscoverage['queue-manager.js'][28]++;
QueueManager.prototype.start_analyser = (function () {
  _$jscoverage['queue-manager.js'][29]++;
  analyser.emitter.emit("ready", {depth: nconf.get("default_depth")});
});
_$jscoverage['queue-manager.js'][32]++;
QueueManager.prototype.add_to_queue = (function (data) {
  _$jscoverage['queue-manager.js'][33]++;
  var self = this, order, queue;
  _$jscoverage['queue-manager.js'][35]++;
  data._private = data._private? true: false;
  _$jscoverage['queue-manager.js'][37]++;
  if (! data.pgn) {
    _$jscoverage['queue-manager.js'][38]++;
    winston.warn("Trying to add to queue without a PGN");
    _$jscoverage['queue-manager.js'][39]++;
    self.emitter.emit("_error", {display: "Trying to add to queue without a PGN."});
    _$jscoverage['queue-manager.js'][40]++;
    return;
  }
  _$jscoverage['queue-manager.js'][42]++;
  if (! data.user_id) {
    _$jscoverage['queue-manager.js'][43]++;
    winston.warn("Trying to add to queue without a User ID");
    _$jscoverage['queue-manager.js'][44]++;
    self.emitter.emit("_error", {display: "Trying to add to queue without a User Id."});
    _$jscoverage['queue-manager.js'][45]++;
    return;
  }
  _$jscoverage['queue-manager.js'][48]++;
  models.Queue.findOne({}).sort("-order").exec((function (err, highest_queue) {
  _$jscoverage['queue-manager.js'][51]++;
  if (! highest_queue) {
    _$jscoverage['queue-manager.js'][51]++;
    order = 1;
  }
  else {
    _$jscoverage['queue-manager.js'][52]++;
    order = highest_queue.order + 1;
  }
  _$jscoverage['queue-manager.js'][54]++;
  queue = new models.Queue({order: order + 1, private: data._private, user_id: data.user_id, pgn: data.pgn});
  _$jscoverage['queue-manager.js'][60]++;
  queue.save((function (err) {
  _$jscoverage['queue-manager.js'][61]++;
  if (err) {
    _$jscoverage['queue-manager.js'][62]++;
    winston.warn(JSON.stringify(err, null, "  "));
    _$jscoverage['queue-manager.js'][63]++;
    self.emitter.emit("_error", {display: "Failed to save to queue."});
    _$jscoverage['queue-manager.js'][64]++;
    return;
  }
  _$jscoverage['queue-manager.js'][66]++;
  self.emitter.emit("done", {queue: queue});
  _$jscoverage['queue-manager.js'][67]++;
  analyser.emitter.emit("ready", {depth: nconf.get("default_depth")});
}));
}));
});
_$jscoverage['queue-manager.js'][72]++;
QueueManager.prototype.get_next_helper = (function (i, games, cb, results) {
  _$jscoverage['queue-manager.js'][73]++;
  if (! results) {
    _$jscoverage['queue-manager.js'][73]++;
    results = [];
  }
  _$jscoverage['queue-manager.js'][74]++;
  if (i >= games.length) {
    _$jscoverage['queue-manager.js'][75]++;
    cb(null, results);
    _$jscoverage['queue-manager.js'][76]++;
    return;
  }
  _$jscoverage['queue-manager.js'][79]++;
  var self = this, pgn_converter = new PGNConverter();
  _$jscoverage['queue-manager.js'][82]++;
  pgn_converter.emitter.once("converted", (function (pgn_data) {
  _$jscoverage['queue-manager.js'][83]++;
  results.push(pgn_data.metadata);
  _$jscoverage['queue-manager.js'][84]++;
  self.get_next_helper(i + 1, games, cb, results);
}));
  _$jscoverage['queue-manager.js'][86]++;
  pgn_converter.convert(games[i].pgn);
});
_$jscoverage['queue-manager.js'][89]++;
QueueManager.prototype.get_next = (function (count, cb) {
  _$jscoverage['queue-manager.js'][90]++;
  var self = this;
  _$jscoverage['queue-manager.js'][92]++;
  models.Queue.find().sort("order").limit(count).exec((function (err, games) {
  _$jscoverage['queue-manager.js'][96]++;
  self.get_next_helper(0, games, cb);
}));
});
_$jscoverage['queue-manager.js'][100]++;
QueueManager.prototype.in_queue = (function (cb) {
  _$jscoverage['queue-manager.js'][101]++;
  models.Queue.count(cb);
});
_$jscoverage['queue-manager.js'][104]++;
var queue_manager = module.exports.queue_manager = new QueueManager();
_$jscoverage['queue-manager.js'].source = ["/**","Queue manager (intended to be a singleton) adds things to the queue and communicates events to the analyser. ","","@method start_analyser","","@method add_to_queue","@params data - _private, pgn, user_id","","@event _error","@event ready","@event done","","*/","var util = require('util'),","\tnconf = require('nconf'),","\twinston = require('winston'),","\temitter = require('events').EventEmitter,","","\tmodels = require('./../models'),","\tanalyser = require('./analyser').analyser,","\tPGNConverter = require('./pgn-converter').PGNConverter;","","var QueueManager = module.exports.QueueManager = function(){","\tthis.emitter = new emitter();","\tthis.start_analyser();","};","","QueueManager.prototype.start_analyser = function(){","\tanalyser.emitter.emit('ready', {depth: nconf.get('default_depth')});","};","","QueueManager.prototype.add_to_queue = function(data){","\tvar self = this, order, queue;","","\tdata._private = (data._private) ? true : false;","","\tif(!data.pgn){","\t\twinston.warn('Trying to add to queue without a PGN');","\t\tself.emitter.emit('_error', {display: 'Trying to add to queue without a PGN.'});","\t\treturn;","\t}","\tif(!data.user_id){","\t\twinston.warn('Trying to add to queue without a User ID');","\t\tself.emitter.emit('_error', {display: 'Trying to add to queue without a User Id.'});","\t\treturn;","\t}","","\tmodels.Queue.findOne({})","\t.sort('-order')","\t.exec(function(err, highest_queue){","\t\tif(!highest_queue){ order = 1; }","\t\telse{ order = highest_queue.order + 1; }","\t\t","\t\tqueue = new models.Queue({","\t\t\torder: order+1,","\t\t\tprivate: data._private,","\t\t\tuser_id: data.user_id,","\t\t\tpgn: data.pgn","\t\t});","\t\tqueue.save(function(err){","\t\t\tif(err){ ","\t\t\t\twinston.warn(JSON.stringify(err, null, '  ')); ","\t\t\t\tself.emitter.emit('_error', {display: 'Failed to save to queue.'});","\t\t\t\treturn;","\t\t\t}","\t\t\tself.emitter.emit('done', {queue: queue});","\t\t\tanalyser.emitter.emit('ready', {depth: nconf.get('default_depth')});","\t\t});","\t});","};","","QueueManager.prototype.get_next_helper = function(i, games, cb, results){","\tif(!results){ results=[]; }","\tif(i &gt;= games.length){","\t\tcb(null, results);","\t\treturn;","\t}","","\tvar self = this,","\t\tpgn_converter = new PGNConverter();","\t","\tpgn_converter.emitter.once('converted', function(pgn_data){","\t\tresults.push(pgn_data.metadata)\t;","\t\tself.get_next_helper(i+1, games, cb, results);","\t});\t","\tpgn_converter.convert(games[i].pgn);","};","","QueueManager.prototype.get_next = function(count, cb){","\tvar self = this;","","\tmodels.Queue.find()","\t.sort('order')","\t.limit(count)","\t.exec(function(err, games){","\t\tself.get_next_helper(0, games, cb);","\t});","};","","QueueManager.prototype.in_queue = function(cb){","\tmodels.Queue.count(cb);","};","","var queue_manager = module.exports.queue_manager = new QueueManager();"];