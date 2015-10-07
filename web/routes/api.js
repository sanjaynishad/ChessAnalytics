var express = require('express');
var mysql = require('mysql');
var nconf = require('nconf');
var router = express.Router();
//var connection = mysql.createConnection({
//	host : nconf.get("database_host"),
//	user : nconf.get("database_username"),
//	password : nconf.get("database_password"),
//	database : nconf.get("database_name")
//});
//
//connection.connect();
//
//router
//		.get(
//				'/addToQueue',
//				function(req, res) {
//
//					console.log('addToQueue');
//
//					// var sql = "INSERT INTO `stockfish_log` (`time`, `worker`,
//					// `message`) VALUES (s%, 's%', 's%')";
//					// sql = util.format('INSERT INTO `stockfish_queue` SET ?',
//					// {title: 'test'}, Clock.microseconds(),
//					// worker.getId(),message);
//					connection.query('INSERT INTO `stockfish_queue` SET ?', {
//						queued_at : new Date().getTime(),
//						input_fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
//						input_depth : 15,
//						input_level : 15,
//						input_mode : 'regular-chess'
//					}, function(err, result) {
//						// connected! (unless `err` is set)
//						if (err) {
//							console.log("error");
//							console.log(err);
//							res.send({error:err});
//						} else {
//							console.log(result);
//							res.send({id:result.insertId});
//						}
//					});
//
//				});
//
//router
//		.post(
//				'/addToQueue',
//				function(req, res) {
//
//					console.log('addToQueue');
//
//					// var sql = "INSERT INTO `stockfish_log` (`time`, `worker`,
//					// `message`) VALUES (s%, 's%', 's%')";
//					// sql = util.format('INSERT INTO `stockfish_queue` SET ?',
//					// {title: 'test'}, Clock.microseconds(),
//					// worker.getId(),message);
//					connection.query('INSERT INTO `stockfish_queue` SET ?', {
//						queued_at : new Date().getTime(),
//						input_fen : req.body.input_fen,
//						input_depth : req.body.input_depth,
//						input_level : req.body.input_level,
//						input_mode : req.body.input_mode
//					}, function(err, result) {
//						// connected! (unless `err` is set)
//						if (err) {
//							console.log(err);
//							res.send({error:err});
//						} else {
//							res.send({id:result.insertId});
//						}
//					});
//
//				});
//router
//		.get(
//				'/getResult',
//				function(req, res) {
//
//					console.log('getResult');
//					
//					var sql    = 'SELECT * FROM `stockfish_queue` WHERE `token` = '+req.query.id+' AND (`status` = \'processed\' OR `status` = \'error\') LIMIT 1';
//					connection.query(sql, function(err, results) {
//					  // ...
//						if (err) {
//							console.log(err);
//							res.send({result:{}});
//						} else {
//							if (results&&results.length>0) {
//								connection.query('INSERT INTO `stockfish_history` SET ?', {
//									status : results[0]['status'],
//									input_fen : results[0].input_fen,
//									input_depth : results[0].input_depth,
//									input_level : results[0].input_level,
//									input_mode : results[0].input_mode,
//									
//									output_worker : results[0].output_worker,
//									output_move : results[0].output_move,
//									output_raw : results[0].output_raw,
//									queued_at : results[0].queued_at,
//									
//									started_at : results[0].started_at,
//									solved_at : results[0].solved_at,
//									received_at : results[0].received_at
//									
//								}, function(err, result) {
//									// connected! (unless `err` is set)
//									connection.query('DELETE FROM `stockfish_queue` WHERE `token` = '+req.query.id+' LIMIT 1', function (err, result1) {
//
////										  console.log('deleted ' + result.affectedRows + ' rows');
//											if (err) {
//												res.send({result:{}});
//											} else {
//												res.send({result:results});
//											}
//										});
//								});
//							} else {
//								res.send({result:{}});
//							}
//						}
//					});
//
//				});
//router
//.get(
//		'/getQueues',
//		function(req, res) {
//
//			console.log('getQueues');
//			
//			var sql    = 'SELECT * FROM `'+req.query.table+'`';
//			connection.query(sql, function(err, results) {
//			  // ...
//				if (err) {
//					console.log(err);
//					res.send({error:err});
//				} else {
//
//					res.send({result:results});
//				}
//			});
//
//		});

module.exports = router;
//java -jar /srv/nodeapp/chessanalytics/StockFishWorker/StockFish.jar /srv/nodeapp/chessanalytics/StockFishWorker/stockfish.config