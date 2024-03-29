/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['game-searcher.js']) {
  _$jscoverage['game-searcher.js'] = [];
  _$jscoverage['game-searcher.js'][22] = 0;
  _$jscoverage['game-searcher.js'][27] = 0;
  _$jscoverage['game-searcher.js'][29] = 0;
  _$jscoverage['game-searcher.js'][30] = 0;
  _$jscoverage['game-searcher.js'][32] = 0;
  _$jscoverage['game-searcher.js'][33] = 0;
  _$jscoverage['game-searcher.js'][34] = 0;
  _$jscoverage['game-searcher.js'][35] = 0;
  _$jscoverage['game-searcher.js'][37] = 0;
  _$jscoverage['game-searcher.js'][39] = 0;
  _$jscoverage['game-searcher.js'][40] = 0;
  _$jscoverage['game-searcher.js'][51] = 0;
  _$jscoverage['game-searcher.js'][52] = 0;
  _$jscoverage['game-searcher.js'][55] = 0;
  _$jscoverage['game-searcher.js'][57] = 0;
  _$jscoverage['game-searcher.js'][62] = 0;
  _$jscoverage['game-searcher.js'][63] = 0;
  _$jscoverage['game-searcher.js'][64] = 0;
  _$jscoverage['game-searcher.js'][65] = 0;
  _$jscoverage['game-searcher.js'][67] = 0;
}
_$jscoverage['game-searcher.js'][22]++;
var util = require("util"), winston = require("winston"), models = require("./../models"), DEFAULT_LIMIT = 25;
_$jscoverage['game-searcher.js'][27]++;
var GameSearcher = module.exports.GameSearcher = (function () {
});
_$jscoverage['game-searcher.js'][29]++;
GameSearcher.prototype.search = (function (options, cb) {
  _$jscoverage['game-searcher.js'][30]++;
  var self = this, q_options = {}, query, i, skip;
  _$jscoverage['game-searcher.js'][32]++;
  if (options._private) {
    _$jscoverage['game-searcher.js'][32]++;
    q_options["private"] = options._private;
  }
  _$jscoverage['game-searcher.js'][33]++;
  if (options.user_id) {
    _$jscoverage['game-searcher.js'][33]++;
    q_options.user_id = options.user_id;
  }
  _$jscoverage['game-searcher.js'][34]++;
  if (! options.page) {
    _$jscoverage['game-searcher.js'][34]++;
    options.page = 1;
  }
  _$jscoverage['game-searcher.js'][35]++;
  if (! options.limit) {
    _$jscoverage['game-searcher.js'][35]++;
    options.limit = DEFAULT_LIMIT;
  }
  _$jscoverage['game-searcher.js'][37]++;
  var query = models.Game.find(q_options);
  _$jscoverage['game-searcher.js'][39]++;
  if (options.search) {
    _$jscoverage['game-searcher.js'][40]++;
    query.or([{black: new RegExp(util.format(".*%s.*", options.search), "i")}, {white: new RegExp(util.format(".*%s.*", options.search), "i")}, {event: new RegExp(util.format(".*%s.*", options.search), "i")}, {date: new RegExp(util.format(".*%s.*", options.search), "i")}]);
  }
  _$jscoverage['game-searcher.js'][51]++;
  for (i = 0; i < options.sort.length; i++) {
    _$jscoverage['game-searcher.js'][52]++;
    query.sort(options.sort[i]);
}
  _$jscoverage['game-searcher.js'][55]++;
  skip = (Number(options.page) - 1) * Number(options.limit);
  _$jscoverage['game-searcher.js'][57]++;
  query.skip(skip).limit(options.limit).exec((function (err, games) {
  _$jscoverage['game-searcher.js'][62]++;
  query.count((function (err, count) {
  _$jscoverage['game-searcher.js'][63]++;
  if (count === 0) {
    _$jscoverage['game-searcher.js'][64]++;
    cb(err, games, options.page, 0);
    _$jscoverage['game-searcher.js'][65]++;
    return;
  }
  _$jscoverage['game-searcher.js'][67]++;
  cb(err, games, options.page, Math.ceil(count / DEFAULT_LIMIT));
}));
}));
});
_$jscoverage['game-searcher.js'].source = ["/* Game Searcher","","Searches the games!","","Example usage:","","var game_searcher = new require('./../lib/game-searcher').GameSearcher({});","game_searcher.search({","\tpage: 2,","\tsort: ['date', '-site'],","\tsearch: 'carlsen',","\t_private: true,","\tuser_id: 123","});","","Public Methods:","\tsearch(options):","\t\tpage, sort, search","*/","","","var util = require('util'),","\twinston = require('winston'),","\tmodels = require('./../models'),","\tDEFAULT_LIMIT = 25;","","var GameSearcher = module.exports.GameSearcher = function(){};","","GameSearcher.prototype.search = function(options, cb){","\tvar self = this, q_options={}, query, i, skip;","","\tif(options._private){ q_options.private = options._private; }","\tif(options.user_id){ q_options.user_id = options.user_id; }","\tif(!options.page){ options.page = 1; }","\tif(!options.limit){ options.limit = DEFAULT_LIMIT; }","","\tvar query = models.Game.find(q_options);","","\tif(options.search){ ","\t\tquery.or([{","\t\t\tblack: new RegExp(util.format('.*%s.*', options.search), 'i')","\t\t},{","\t\t\twhite: new RegExp(util.format('.*%s.*', options.search), 'i')","\t\t},{","\t\t\tevent: new RegExp(util.format('.*%s.*', options.search), 'i')","\t\t},{","\t\t\tdate: new RegExp(util.format('.*%s.*', options.search), 'i')","\t\t}]);","\t}","","\tfor(i=0; i&lt;options.sort.length; i++){","\t\tquery.sort(options.sort[i]);","\t}","","\tskip = (Number(options.page)-1) * Number(options.limit);","","\tquery","\t.skip(skip)","\t.limit(options.limit)","\t.exec(function(err, games){","","\t\tquery.count(function(err, count){","\t\t\tif(count === 0 ){","\t\t\t\tcb(err, games, options.page, 0);","\t\t\t\treturn;\t","\t\t\t}","\t\t\tcb(err, games, options.page, Math.ceil(count / DEFAULT_LIMIT));","\t\t});","","\t});","};"];
