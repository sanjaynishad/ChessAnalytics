var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var router = express.Router();
var fs = require('fs');
var stockfishparse = require('./../chessanalytics/lib/stockfishparse').Stockfish;

router.get('/', function(req, res) {

	res.render('parsearena', {
		req: req,
	});
});

router.post('/', function(req, res, next) {
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/files/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {

        	fs.readFile(__dirname + '/files/' + filename, function (err, data) {
        		if (!err) {
        			var stockfish = new stockfishparse();
        			var lineList;
        		    var fstream;
        			lineList = data.toString().split('\n');
        			for (var i = 0; i < lineList.length; i++) {
						var line = trim(lineList[i]);
						if (line.indexOf("<--1:")>=0) {
							line = trim(line.substring(line.indexOf("<--1:") + 5));
							if (line.indexOf("info ")==0 || line.indexOf("bestmove ")==0) {
								stockfish.parse_response(line.replace("lowerbound ","").replace("upperbound ","").split(' '));
							}
						}else if(line.indexOf("-->1:")>=0) {
							line = line.substring(line.indexOf("-->1:") + 5);
							if (line.indexOf("position startpos moves ")>=0) {
								line = line.replace("position startpos moves ","");
								stockfish.position(trim(line));
								continue;
							}
						}
						
					}
        			stockfish.finish(function(err, game){
            			res.send({result:game});
        			});
        		}else{
        			res.send({result:err});
        		}
        		});
        });
    });
});

function trim(s){
　　    return s.replace(/(^\s*)|(\s*$)/g, "");
}
module.exports = router;
