var models = require('./../chessanalytics/models'),
	winston = require('winston'),
	GameSearcher = require('./../chessanalytics/lib/game-searcher').GameSearcher,
	queue_manager = require('./../chessanalytics/lib/queue-manager').queue_manager,
	analyser = require('./../chessanalytics/lib/analyser').analyser,
	HookManager = require('./../chessanalytics/lib/hook-manager');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var fs = require('fs');

module.exports = router;
var MESSAGES = {};
MESSAGES.analysis_started = 'The analysis has started.  It takes a while - but should show up on your list of games shortly.';
MESSAGES.added_to_queue = 'Thank you, your game has been added to the queue to be analysed.  If it can be analysed (was a valid pgn), then it will show up on your list when it is done.'


router.get('/analyse_api', function(req, res) {
	var order, queue;
	var _private = (req.body.private === 'on') ? true : false;
	
	queue_manager.add_to_queue({
		_private: _private,
		user_id: req.body.user_id,
		pgn: req.body.pgn+'\n'
	});
	
	res.send({ message: MESSAGES.added_to_queue });

});
/* Helper Functions */
var get_private_games = function(req, cb){
	var page = Number(req.query.private_page) || 1;
	var game_searcher = new GameSearcher();
// cb("",[],1,0);
	var user_id = "";
	if (req.session.user) {
		user_id = req.session.user.id;
	} else {

	}
	game_searcher.search({
		page: page,
		sort: ['-created'],
		search: req.query.search,
		_private: true,
		user_id: 1
	}, cb);
};

var get_public_games = function(req, cb){
	var page = Number(req.query.public_page) || 1;
	var game_searcher = new GameSearcher();
	
	game_searcher.search({
		page: page,
		search: req.query.search,
		sort: ['-created'],
		_private: false
	}, cb);
};

var find_or_create_user = function(identifier, profile, cb){
	models.User.findOne({id: identifier}, function(err, user){
		if(err){ winston.warn(JSON.stringify(err, null, '  ')); }

		profile.id = identifier;

		if(!user){
			var user = new models.User();
			user.familyName = profile.familyName;
			user.displayName = profile.displayName;
			user.givenName = profile.givenName;
			user.emails = profile.emails
			user.id = identifier;
			user.save(cb);
		}else{
			cb(err, user);
		}
	});
};

exports.auth = function(identifier, profile, done) {
	find_or_create_user(identifier, profile, function(err, user){
		if(err){ winston.warn(JSON.stringify(err, null, '  ')); }
		done(err, profile);
	});
};
router.get('/auth', exports.auth);

function addPgnTextToQueue(req, res, data){

	var gametitlemap = {};
	var games = [];
	var lineList;
    var fstream;
	lineList = data.toString().split('\n');
	var title = "";
	var headers = {};
	var currentGame = "";
	var lastispgn=false;
	for (var i = 0; i < lineList.length; i++) {
		if (!lineList[i]) {
			continue;
		}
		var str = trim(lineList[i]);
		if (str == "") {
			continue;
		}
		if (str.indexOf("[") == 0) {
			if (lastispgn) {
				games.push(currentGame);
				gametitlemap[currentGame] = headers;
				title = "";
				headers = {};
				currentGame = "";
				lastispgn=false;
			} else {

			}
			var key = str.replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
			var value = str.replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
	          if (trim(key).length > 0) {
	        	  headers[trim(key).toLowerCase()] = value;
	          }
		} else {
			lastispgn=true;
			if (title == "") {
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
		}
		currentGame+=str + "\n";
	}
	if (lastispgn) {
		games.push(currentGame);
	}
	lineList = games;
	

	// Recursively go through list adding documents.
	// (This will overload the stack when lots of entries
	// are inserted. In practice I make heavy use the NodeJS
	// "async" module to avoid such situations.)
	function empty(err) {
		if (err) {
			console.log(err);
		}
	}
	function queryAllEntries() {

        res.send({result:"ok"});
	}
	function in_array(search,array){
	    for(var i in array){
	        if(array[i]==search){
	            return true;
	        }
	    }
	    return false;
	}

	function trim(s){
	　　    return s.replace(/(^\s*)|(\s*$)/g, "");
	}
	function createDocRecurse(err) {
		if (err) {
			console.log(err);
		}
		if (games.length) {
			var line = games.shift();
			
			queue_manager.add_to_queue({
				_private: false,
				user_id: "1",
				pgn: line
			},createDocRecurse);
			
		} else {
			// After the last entry query to show the result.
			queryAllEntries();
		}
	}
	
	createDocRecurse(null);

}
exports.addPgnTextToQueue = addPgnTextToQueue;

/* Screens */
	/* Game */
exports.game = function(req, res){
	var i, new_turns=[], turn;
	
	models.Game.findById(req.params.id, function(err, game){
		if(err || !game){
			res.render('errors/500', { 
				req: req, 
				failure_text: 'that game cannot be found.' ,
				error_title: 'Game Not Found'
			} );
			return;
		}
// if(game.private && (!req.isAuthenticated() || req.session.passport.user.id
// !== game.user_id)){
// res.redirect('/');
// return;
// }
		if(req.params.format && req.params.format.toLowerCase() === 'json'){
			res.send(game);
			return;
		}

		res.render('gamenew', {
			req: req,
			game: game
		});
	});
};
router.get('/game/:id.:format', exports.game);
router.get('/game/:id', exports.game);
// router.get('/game', exports.game);
	/* Dashboard */
exports.index = function(req, res){ 
	console.log(req.session.user);
	var private_next, private_prev, public_next, public_prev;

	get_public_games(req, function(err, public_games, public_curr, public_max){
		get_private_games(req, function(err, private_games, private_curr, private_max){
			var Format = function (date,fmt) { //author: meizz 
			    var o = {
			        "M+": date.getMonth() + 1, //月份 
			        "d+": date.getDate(), //日 
			        "h+": date.getHours(), //小时 
			        "m+": date.getMinutes(), //分 
			        "s+": date.getSeconds(), //秒 
			        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
			        "S": date.getMilliseconds() //毫秒 
			    };
			    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
			    for (var k in o)
			    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
			    return fmt;
			};
			if (public_games) {
				for (var i = 0; i < public_games.length; i++) {
//					public_games[i].created = public_games[i].created.Format("yyyy-MM-dd HH:mm:ss");  
					public_games[i].date = Format(public_games[i].created,"yyyy-MM-dd hh:mm:ss");  
//					public_games[i].created = 123;
//					console.log(public_games[i].date);
//					console.log(Format(public_games[i].created,"yyyy-MM-dd hh:mm:ss"));
//					public_games[i].created = Format(public_games[i].created,"yyyy-MM-dd hh:mm:ss");
				}
			}
			if (private_games) {
				for (var i = 0; i < private_games.length; i++) {
					private_games[i].created = private_games[i].created.Format("yyyy-MM-dd HH:mm:ss");  
					private_games[i].date = Format(private_games[i].created,"yyyy-MM-dd hh:mm:ss");  
//					console.log(private_games[i].created);
				}
			}
			
			private_next = (private_curr === private_max) ? private_max : Number(private_curr)+1;
			public_next = (public_curr === public_max) ? public_max : Number(public_curr)+1;

			private_prev = (private_curr === 1) ? 1 : Number(private_curr)-1;
			public_prev = (public_curr === 1) ? 1 : Number(public_curr)-1;

			res.render('index', {
				req: req,
				user: req.session.user,
				show: req.query.show,
				search: req.query.search || "",

				private_games: private_games,
				public_games: public_games,
				games: public_games,

				private_next: private_next, 
				private_prev: private_prev,
				public_next: public_next, 
				public_prev: public_prev,

				private_curr: private_curr,
				public_curr: public_curr,

				public_max: public_max,
				private_max: private_max
			});
		});
	});
};
router.get('/index', exports.index);
router.get('/', exports.index);
	/* Login */
exports.login = function(req, res){
	var public_next, public_prev;
	get_public_games(req, function(err, public_games, public_curr, public_max){
		
		public_next = (public_curr === public_max) ? public_max : Number(public_curr)+1;
		public_prev = (public_curr === 1) ? 1 : Number(public_curr)-1;

		res.render('login', {
			req: req,
			show: null,
			search: req.query.search || '',
			public_curr: public_curr,
			public_games: public_games,
			public_max: public_max,
			public_next: public_next,
			public_prev: public_prev
		});
	});
};

router.get('/analyticchess', function(req, res) {
		try {
			models.Game.find({}).exec(function(err, docs) {
				res.set('Content-Type', 'application/json');
				res.status(200);
				res.send({
					result : docs
				});
			});
		} catch (e) {
		}
});

router.get('/logs', function(req, res) {
// __dirname + "../../logs"
	fs.readdir(__dirname + "/../public/logs", function (err, files) { // '/'
																		// denotes
																		// the
																		// root
																		// folder
		  if (err) console.log(err);
			res.render('logs', {
				req: req,
				files: files,
			});
		});
});

router.get('/repos', function(req, res) {
		try {
			models.PgnRepo.find({}).exec(function(err, docs) {
				res.set('Content-Type', 'application/json');
				res.status(200);
				res.send({
					result : docs
				});
			});
		} catch (e) {
		}
});

router.post('/uploadpgns', function(req, res) {
    
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/files/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {

        	fs.readFile(__dirname + '/files/' + filename, function (err, data) {
        		if (!err) {
        			addPgnTextToQueue(req, res, data);
        		}else{
        			res.send({result:err});
        		}
        		});
        });
    });



});

router.get('/login', exports.login);
router.get('/logout', function(req, res){ req.logOut(); res.redirect('/login'); });

var nconf = require('nconf');
exports.setdepth = function(req, res){
	nconf.set('default_depth',req.params.depth);
	res.send({ message: "ok" });

};
router.get('/setdepth/:depth', exports.setdepth);
exports.loadzip = function(req, res){
	models.Queue.remove({}, function(err){});
	var file_url = 'http://www.pgnmentor.com/players/Carlsen.zip';

	var request = require('request');
	var fs = require('fs');
	var AdmZip = require('adm-zip');
	var http = require('http');
	var url = require('url');

	var options = {
	    host: url.parse(file_url).host,
	    port: 80,
	    path: url.parse(file_url).pathname
	};

	http.get(options, function(res) {
	    var data = [], dataLen = 0; 

	    res.on('data', function(chunk) {

	            data.push(chunk);
	            dataLen += chunk.length;

	        }).on('end', function() {
	            var buf = new Buffer(dataLen);

	            for (var i=0, len = data.length, pos = 0; i < len; i++) { 
	                data[i].copy(buf, pos); 
	                pos += data[i].length; 
	            } 

	            var zip = new AdmZip(buf);
	            var zipEntries = zip.getEntries();

	            for (var i = 0; i < zipEntries.length; i++){
		            addPgnTextToQueue(zip.readAsText(zipEntries[i]), res,data);
	            }
	        });
	});
}
router.get('/loadzip', exports.loadzip);

exports.analyse_game = function(req, res){
	models.Queue.remove({}, function(err){});
// var order, queue;
	var _private = (req.body.private === 'on') ? true : false;
	queue_manager.add_to_queue({
		_private: _private,
		user_id: "1",
		pgn: req.body.pgn
	});
	
	res.send({ message: MESSAGES.added_to_queue });
};
router.post('/analyse-game', exports.analyse_game);

exports.clearq = function(req, res){
	models.Queue.remove({}, function(err){});
	
	res.send({ message: "ok" });
};
router.post('/clearq', exports.clearq);

exports.io_connection = function(client){
	client.on('hook', function(hook) {
		HookManager.io_hook(hook, client);
	});
};

router.post('/deleteGame', function(req, res){

	models.Game.remove({_id:req.body.id}, 	function (err) {
		if (err) {
			console.log(err);
			res.send({ result: err });
		}else{
			res.send({ result: "ok" });
		}
	});
});

router.post('/repolist', function(req, res) {
	var sortBy = {};
	var sortname = "created";
	var sorttype = -1;
	var page = 1;
	var limit = 20;
	var condition = { $or:[]};
	
	if (req.body.sortname && req.body.sortname!="") {
		sortname = req.body.sortname;
	} else {
	}
	if (req.body.sorttype && req.body.sorttype!="") {
		sorttype = req.body.sorttype;
	} else {
	}
	if (req.body.page && req.body.page!="") {
		page = req.body.page;
	} else {
	}
	if (req.body.limit && req.body.limit!="") {
		limit = req.body.limit;
	} else {
	}
	
	if (req.body.title && req.body.title!="") {
		condition.$or.push({'title':{ $regex: '.*'+req.body.title+'.*', $options: 'i' }});
	}
	if (condition.$or.length == 0) {
		condition = {};
	}else if (condition.$or.length == 1) {
		condition = condition.$or[0];
	}
	sortBy[sortname]=sorttype;
	var searchdata = {
		    page: page,
		    limit: limit,
		    sortBy: sortBy,
		    lean: true
		  };
	
		models.PgnRepo.paginate(
				condition,
				  searchdata,
				  function(err, results, pageCount, itemCount){

					  searchdata["pageCount"] = pageCount;
					  searchdata["itemCount"] = itemCount;
					  
	    				res.set('Content-Type', 'application/json');
	    				res.status(200);
	    				res.send({
	    					result : results,
	    					searchdata : searchdata
	    				});
				  }
				);
});
router.post('/savegameresult', function(req, res) {
//	var game = new models.Game(eval("(" + req.body.data + ")"));
	var game = new models.Game(req.body.data);
	game.save(function(err){
		if(err){ winston.warn(JSON.stringify(err, null, '  ')); }
		res.set('Content-Type', 'application/json');
		res.status(200);
		res.send({
//			result : game,
			url : req.headers.host+"/game/"+game._id
		});
	});
});
router.post('/gameresultlist', function(req, res) {
	var sortBy = {};
	var sortname = "created";
	var sorttype = -1;
	var page = 1;
	var limit = 20;
	var condition = { $or:[]};
	

	if (req.body.sortname && req.body.sortname!="") {
		sortname = req.body.sortname;
	} else {
	}
	if (req.body.sorttype && req.body.sorttype!="") {
		sorttype = req.body.sorttype;
	} else {
	}
	if (req.body.page && req.body.page!="") {
		page = req.body.page;
	} else {
	}
	if (req.body.limit && req.body.limit!="") {
		limit = req.body.limit;
	} else {
	}
	
	if (req.body.white && req.body.white!="") {
		condition.$or.push({'white':{ $regex: '.*'+req.body.white+'.*', $options: 'i' }});
	}
	if (req.body.black && req.body.black!="") {
		condition.$or.push({'black':{ $regex: '.*'+req.body.black+'.*', $options: 'i' }});
	}
	if (condition.$or.length == 0) {
		condition = {};
	}else if (condition.$or.length == 1) {
		condition = condition.$or[0];
	}
	sortBy[sortname]=sorttype;
	var searchdata = {
		    page: page,
		    limit: limit,
		    sortBy: sortBy,
		    lean: true
		  };
	
	models.Game.paginate(
				condition,
				  searchdata,
				  function(err, results, pageCount, itemCount){

					  searchdata["pageCount"] = pageCount;
					  searchdata["itemCount"] = itemCount;
					  
	    				res.set('Content-Type', 'application/json');
	    				res.status(200);
	    				res.send({
	    					result : results,
	    					searchdata : searchdata
	    				});
				  }
				);
});