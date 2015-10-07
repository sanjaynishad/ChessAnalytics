var analyser = require('./chessanalytics/locallib/analyser').analyser;
var fs = require('fs');
var file = process.argv[2];
console.log(file);

fs.readFile(file, function(err, data) {
	if (!err) {
		addPgnTextToQueue(null, null, data);
	} else {
		console.log(err);
	}
});



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

		if (res) {
	        res.send({result:"ok"});
		}else{
			console.log("finished");
		}
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
	function createDocRecurse(result) {
		if (result) {
			console.log(result.url);
//			if (result.indexOf('}')<0) {
//
//				console.log(eval("(" + result + "})").url);
//			}else{
//				console.log(eval("(" + result + ")").url);
//			}
		}
		if (games.length) {
			var line = games.shift();
			analyser.analyse_new({
				private: false,
				fen: "",
				pgn: line
			}, createDocRecurse);
//			queue_manager.add_to_queue({
//				_private: false,
//				user_id: "1",
//				pgn: line
//			},createDocRecurse);
			
		} else {
			// After the last entry query to show the result.
			queryAllEntries();
		}
	}
	
	createDocRecurse(null);

}