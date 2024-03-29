
var util = require('util'),
	winston = require('winston'),
	models = require('./../models'),
	emitter = require('events').EventEmitter;

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


var Stockfish = module.exports.Stockfish = function(){
	this.emitter = new emitter();
	this.game = { turns: []};
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
//			console.log(this.stored_info); 
		}
	}

	var actual_move_data = { bestmove: [""], strength: '?', info: [] };
	var bestmove_data = { bestmove: response, strength: this.strength, info: this.stored_info };
	if(actual_move_data.bestmove[0] === bestmove_data.bestmove[0]){
		difference = 0;
	}else{
		difference = "?";
	}

	if(actual_move_data.strength === '?'){
		percent = '?';
	}else if(Number(bestmove_data.strength) === 0){
		percent = 0;
	}else{
		percent = difference / Number(bestmove_data.strength);
	}

	this.game.turns.push({ difference: difference, percent: percent, actual_move: actual_move_data, bestmove: bestmove_data});
};

//Stockfish.prototype.analyse_turn = function(i, moves){
//	var self = this;
//
//	if(i >= moves.length+1){
//		self.emitter.emit(triggers.game_analysed, { game: self.game } );
//	}else{
//		self.compare(moves.slice(0, i).join(' '), moves.slice(i, i+1).join(' '))
//		self.emitter.once(triggers.compare, function(data){
//			self.game.turns.push(data);
//			self.analyse_turn(i+1, moves);
//		});
//	}
//};

Stockfish.prototype.finish = function(cb){
//	console.log('finish analyze the log');
	var pgn = this.getPgnFromLan();
//	console.log(pgn);
	var pgn_data = {metadata:[]};
	
	var game = new models.Game(),
		_private = false,
		new_turns=[],
		k, i, turn;

//	for(k in pgn_data.metadata){
//		if(k.toLowerCase() !== 'whiteelo' && k.toLowerCase() !== 'blackelo'){
//			game[k.toLowerCase()] = pgn_data.metadata[k];
//		}
//	}
	
	game.user_id = "1";
	game.private = _private;

//	game.whiteelo = (!isNaN(Number(pgn_data.metadata.WhiteElo))) ?  Number(pgn_data.metadata.WhiteElo) : null;
//	game.blackelo = (!isNaN(Number(pgn_data.metadata.BlackElo))) ?  Number(pgn_data.metadata.BlackElo) : null;

	var ms = this.pos.split(" ");
	if (this.game.turns.length>ms.length) {
		this.game.turns.splice(ms.length , this.game.turns.length - ms.length);
	}
//	console.log(this.game.turns.length);
//	console.log(ms.length);
	for (var i = 0; i < this.game.turns.length; i++) {
		var difference;
		var percent;
		var actual_move_data = this.game.turns[i].actual_move;
		actual_move_data.bestmove = [trim(ms[i])];
		var bestmove_data = this.game.turns[i].bestmove;
//		console.log(actual_move_data.bestmove[0]);
//		console.log(bestmove_data.bestmove[0]);
		if(actual_move_data.bestmove[0] === bestmove_data.bestmove[0]){
//			console.log("yes");
			difference = 0;
			percent = '0';
		}else{
			difference = "?";
			percent = '?';
		}

		this.game.turns[i].difference = difference;
		this.game.turns[i].percent = percent;
	}
	

//	this.game.turns.push({ difference: difference, percent: percent, actual_move: actual_move_data, bestmove: bestmove_data});
	
	
	var analysis_data = {game:this.game};
//	console.log(analysis_data);
	for(i=0; i<analysis_data.game.turns.length; i++){
		turn = analysis_data.game.turns[i];
		if(i % 2 === 0){
			new_turns.push({
				turn: Math.ceil((i+1) / 2),
				white: turn,
				black: null
			});
		}else{
			new_turns[new_turns.length-1].black = turn;
		}
	}
	analysis_data.game.turns = new_turns;
	game.analysis =  analysis_data;
	game.pgn = pgn;

	game.save(function(err){
		if(err){ winston.warn(JSON.stringify(err, null, '  ')); }

		if(cb){ cb(err, game); }
	});
};

Stockfish.prototype.getPgnFromLan = function(){
    var pgn = "";
	var  moves;
//    console.log(this.pos);
  moves = pgnparser(this.pos);
    if (!moves||!moves.length) {
	}else{
//        console.log(moves);
	    for (var i = 0; i < moves.length; i++) {
	    	var move = moves[i];
//	    	pgn+= " " +move.move.san;

			if (i % 2 == 0) {
				pgn += (i/2 + 1) + ". " + move.move.san + " ";
			} else {
				pgn += move.move.san + " ";
			}
		}
	}
	return pgn;
};
Stockfish.prototype.position = function(pos){
	this.pos = pos;
};

function trim(s){
　　    return s.replace(/(^\s*)|(\s*$)/g, "");
}


//the following code is copied from kingdom-pgn.js with small changes
function pgnparser(pgn) {

  var BLACK = 'b';
  var WHITE = 'w';
  var EMPTY = -1;
  var PAWN = 'p';
  var KNIGHT = 'n';
  var BISHOP = 'b';
  var ROOK = 'r';
  var QUEEN = 'q';
  var KING = 'k';

  var SYMBOLS = 'pnbrqkPNBRQK';

  var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

  var PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15]
  };

  var PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1]
  };

  var ATTACKS = [
      20, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 20, 0,
      0, 20, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 20, 0, 0,
      0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0, 20, 0, 0, 0,
      0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 0,
      0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 20, 2, 24, 2, 20, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 2, 53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
      24, 24, 24, 24, 24, 24, 56, 0, 56, 24, 24, 24, 24, 24, 24, 0,
      0, 0, 0, 0, 0, 2, 53, 56, 53, 2, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 20, 2, 24, 2, 20, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0,
      0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 0,
      0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0, 20, 0, 0, 0,
      0, 20, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 20, 0, 0,
      20, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 20
  ];

  var RAYS = [
      17, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 15, 0,
      0, 17, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 15, 0, 0,
      0, 0, 17, 0, 0, 0, 0, 16, 0, 0, 0, 0, 15, 0, 0, 0,
      0, 0, 0, 17, 0, 0, 0, 16, 0, 0, 0, 15, 0, 0, 0, 0,
      0, 0, 0, 0, 17, 0, 0, 16, 0, 0, 15, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 17, 0, 16, 0, 15, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 17, 16, 15, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 0, -1, -1, -1, -1, -1, -1, -1, 0,
      0, 0, 0, 0, 0, 0, -15, -16, -17, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, -15, 0, -16, 0, -17, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, -15, 0, 0, -16, 0, 0, -17, 0, 0, 0, 0, 0,
      0, 0, 0, -15, 0, 0, 0, -16, 0, 0, 0, -17, 0, 0, 0, 0,
      0, 0, -15, 0, 0, 0, 0, -16, 0, 0, 0, 0, -17, 0, 0, 0,
      0, -15, 0, 0, 0, 0, 0, -16, 0, 0, 0, 0, 0, -17, 0, 0,
      -15, 0, 0, 0, 0, 0, 0, -16, 0, 0, 0, 0, 0, 0, -17
  ];

  var SHIFTS = {p: 0, n: 1, b: 2, r: 3, q: 4, k: 5};

  var BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64
  };

  var RANK_1 = 7;
  var RANK_2 = 6;
  var RANK_3 = 5;
  var RANK_4 = 4;
  var RANK_5 = 3;
  var RANK_6 = 2;
  var RANK_7 = 1;
  var RANK_8 = 0;

  var SQUARES = {
      a8: 0, b8: 1, c8: 2, d8: 3, e8: 4, f8: 5, g8: 6, h8: 7,
      a7: 16, b7: 17, c7: 18, d7: 19, e7: 20, f7: 21, g7: 22, h7: 23,
      a6: 32, b6: 33, c6: 34, d6: 35, e6: 36, f6: 37, g6: 38, h6: 39,
      a5: 48, b5: 49, c5: 50, d5: 51, e5: 52, f5: 53, g5: 54, h5: 55,
      a4: 64, b4: 65, c4: 66, d4: 67, e4: 68, f4: 69, g4: 70, h4: 71,
      a3: 80, b3: 81, c3: 82, d3: 83, e3: 84, f3: 85, g3: 86, h3: 87,
      a2: 96, b2: 97, c2: 98, d2: 99, e2: 100, f2: 101, g2: 102, h2: 103,
      a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
  };

  var ROOKS = {
      w: [{square: SQUARES.a1, flag: BITS.QSIDE_CASTLE},
          {square: SQUARES.h1, flag: BITS.KSIDE_CASTLE}],
      b: [{square: SQUARES.a8, flag: BITS.QSIDE_CASTLE},
          {square: SQUARES.h8, flag: BITS.KSIDE_CASTLE}]
  };

  var board = new Array(128);
  var kings = {w: EMPTY, b: EMPTY};
  var turn = WHITE;
  var castling = {w: 0, b: 0};
  var ep_square = EMPTY;
  var half_moves = 0;
  var move_number = 1;
  var history = [];
  var header = {};
  var uci_list = [];


  if (typeof fen === 'undefined') {
      load(DEFAULT_POSITION);
  } else {
      load(fen);
  }

  function clear() {
      board = new Array(128);
      kings = {w: EMPTY, b: EMPTY};
      turn = WHITE;
      castling = {w: 0, b: 0};
      ep_square = EMPTY;
      half_moves = 0;
      move_number = 1;
      history = [];
      header = {};
      update_setup(generate_fen());
  }

  function reset() {
      load(DEFAULT_POSITION);
  }

  function load(fen) {
      var tokens = fen.split(/\s+/);
      var position = tokens[0];
      var square = 0;

      if (!validate_fen(fen).valid) {
          return false;
      }

      clear();

      for (var i = 0; i < position.length; i++) {
          var piece = position.charAt(i);

          if (piece === '/') {
              square += 8;
          } else if (is_digit(piece)) {
              square += parseInt(piece, 10);
          } else {
              var color = (piece < 'a') ? WHITE : BLACK;
              put({type: piece.toLowerCase(), color: color}, algebraic(square));
              square++;
          }
      }

      turn = tokens[1];

      if (tokens[2].indexOf('K') > -1) {
          castling.w |= BITS.KSIDE_CASTLE;
      }
      if (tokens[2].indexOf('Q') > -1) {
          castling.w |= BITS.QSIDE_CASTLE;
      }
      if (tokens[2].indexOf('k') > -1) {
          castling.b |= BITS.KSIDE_CASTLE;
      }
      if (tokens[2].indexOf('q') > -1) {
          castling.b |= BITS.QSIDE_CASTLE;
      }

      ep_square = (tokens[3] === '-') ? EMPTY : SQUARES[tokens[3]];
      half_moves = parseInt(tokens[4], 10);
      move_number = parseInt(tokens[5], 10);

      update_setup(generate_fen());

      return true;
  }

  function validate_fen(fen) {
      var errors = {
          0: 'No errors.',
          1: 'FEN string must contain six space-delimited fields.',
          2: '6th field (move number) must be a positive integer.',
          3: '5th field (half move counter) must be a non-negative integer.',
          4: '4th field (en-passant square) is invalid.',
          5: '3rd field (castling availability) is invalid.',
          6: '2nd field (side to move) is invalid.',
          7: '1st field (piece positions) does not contain 8 \'/\'-delimited rows.',
          8: '1st field (piece positions) is invalid [consecutive numbers].',
          9: '1st field (piece positions) is invalid [invalid piece].',
          10: '1st field (piece positions) is invalid [row too large].',
      };

      /* 1st criterion: 6 space-seperated fields? */
      var tokens = fen.split(/\s+/);
      if (tokens.length !== 6) {
          return {valid: false, error_number: 1, error: errors[1]};
      }

      /* 2nd criterion: move number field is a integer value > 0? */
      if (isNaN(tokens[5]) || (parseInt(tokens[5], 10) <= 0)) {
          return {valid: false, error_number: 2, error: errors[2]};
      }

      /* 3rd criterion: half move counter is an integer >= 0? */
      if (isNaN(tokens[4]) || (parseInt(tokens[4], 10) < 0)) {
          return {valid: false, error_number: 3, error: errors[3]};
      }

      /* 4th criterion: 4th field is a valid e.p.-string? */
      if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
          return {valid: false, error_number: 4, error: errors[4]};
      }

      /* 5th criterion: 3th field is a valid castle-string? */
      if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
          return {valid: false, error_number: 5, error: errors[5]};
      }

      /* 6th criterion: 2nd field is "w" (white) or "b" (black)? */
      if (!/^(w|b)$/.test(tokens[1])) {
          return {valid: false, error_number: 6, error: errors[6]};
      }

      /* 7th criterion: 1st field contains 8 rows? */
      var rows = tokens[0].split('/');
      if (rows.length !== 8) {
          return {valid: false, error_number: 7, error: errors[7]};
      }

      /* 8th criterion: every row is valid? */
      for (var i = 0; i < rows.length; i++) {
          /* check for right sum of fields AND not two numbers in succession */
          var sum_fields = 0;
          var previous_was_number = false;

          for (var k = 0; k < rows[i].length; k++) {
              if (!isNaN(rows[i][k])) {
                  if (previous_was_number) {
                      return {valid: false, error_number: 8, error: errors[8]};
                  }
                  sum_fields += parseInt(rows[i][k], 10);
                  previous_was_number = true;
              } else {
                  if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
                      return {valid: false, error_number: 9, error: errors[9]};
                  }
                  sum_fields += 1;
                  previous_was_number = false;
              }
          }
          if (sum_fields !== 8) {
              return {valid: false, error_number: 10, error: errors[10]};
          }
      }

      /* everything's okay! */
      return {valid: true, error_number: 0, error: errors[0]};
  }

  function generate_fen() {
      var empty = 0;
      var fen = '';

      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          if (board[i] == null) {
              empty++;
          } else {
              if (empty > 0) {
                  fen += empty;
                  empty = 0;
              }
              var color = board[i].color;
              var piece = board[i].type;

              fen += (color === WHITE) ?
                      piece.toUpperCase() : piece.toLowerCase();
          }

          if ((i + 1) & 0x88) {
              if (empty > 0) {
                  fen += empty;
              }

              if (i !== SQUARES.h1) {
                  fen += '/';
              }

              empty = 0;
              i += 8;
          }
      }

      var cflags = '';
      if (castling[WHITE] & BITS.KSIDE_CASTLE) {
          cflags += 'K';
      }
      if (castling[WHITE] & BITS.QSIDE_CASTLE) {
          cflags += 'Q';
      }
      if (castling[BLACK] & BITS.KSIDE_CASTLE) {
          cflags += 'k';
      }
      if (castling[BLACK] & BITS.QSIDE_CASTLE) {
          cflags += 'q';
      }

      /* do we have an empty castling flag? */
      cflags = cflags || '-';
      var epflags = (ep_square === EMPTY) ? '-' : algebraic(ep_square);

      return [fen, turn, cflags, epflags, half_moves, move_number].join(' ');
  }

  function set_header(args) {
      for (var i = 0; i < args.length; i += 2) {
          if (typeof args[i] === 'string' &&
                  typeof args[i + 1] === 'string') {
              header[args[i]] = args[i + 1];
          }
      }
      return header;
  }

  function update_setup(fen) {
      if (history.length > 0)
          return;

      if (fen !== DEFAULT_POSITION) {
          header['SetUp'] = '1';
          header['FEN'] = fen;
      } else {
          delete header['SetUp'];
          delete header['FEN'];
      }
  }

  function put(piece, square) {
      /* check for valid piece object */
      if (!('type' in piece && 'color' in piece)) {
          return false;
      }

      /* check for piece */
      if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
          return false;
      }

      /* check for valid square */
      if (!(square in SQUARES)) {
          return false;
      }

      var sq = SQUARES[square];

      /* don't let the user place more than one king */
      if (piece.type == KING &&
              !(kings[piece.color] == EMPTY || kings[piece.color] == sq)) {
          return false;
      }

      board[sq] = {type: piece.type, color: piece.color};
      if (piece.type === KING) {
          kings[piece.color] = sq;
      }

      update_setup(generate_fen());

      return true;
  }

  function build_move(board, from, to, flags, promotion) {
      var move = {
          color: turn,
          from: from,
          to: to,
          flags: flags,
          piece: board[from].type
      };

      if (promotion) {
          move.flags |= BITS.PROMOTION;
          move.promotion = promotion;
      }

      if (board[to]) {
          move.captured = board[to].type;
      } else if (flags & BITS.EP_CAPTURE) {
          move.captured = PAWN;
      }
      return move;
  }

  function generate_moves(options) {
      function add_move(board, moves, from, to, flags) {
          /* if pawn promotion */
          if (board[from].type === PAWN &&
                  (rank(to) === RANK_8 || rank(to) === RANK_1)) {
              var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
              for (var i = 0, len = pieces.length; i < len; i++) {
                  moves.push(build_move(board, from, to, flags, pieces[i]));
              }
          } else {
              moves.push(build_move(board, from, to, flags));
          }
      }

      var moves = [];
      var us = turn;
      var them = swap_color(us);
      var second_rank = {b: RANK_7, w: RANK_2};

      var first_sq = SQUARES.a8;
      var last_sq = SQUARES.h1;
      var single_square = false;

      /* do we want legal moves? */
      var legal = (typeof options !== 'undefined' && 'legal' in options) ?
              options.legal : true;

      /* are we generating moves for a single square? */
      if (typeof options !== 'undefined' && 'square' in options) {
          if (options.square in SQUARES) {
              first_sq = last_sq = SQUARES[options.square];
              single_square = true;
          } else {
              /* invalid square */
              return [];
          }
      }

      for (var i = first_sq; i <= last_sq; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) {
              i += 7;
              continue;
          }

          var piece = board[i];
          if (piece == null || piece.color !== us) {
              continue;
          }

          if (piece.type === PAWN) {
              /* single square, non-capturing */
              var square = i + PAWN_OFFSETS[us][0];
              if (board[square] == null) {
                  add_move(board, moves, i, square, BITS.NORMAL);

                  /* double square */
                  var square = i + PAWN_OFFSETS[us][1];
                  if (second_rank[us] === rank(i) && board[square] == null) {
                      add_move(board, moves, i, square, BITS.BIG_PAWN);
                  }
              }

              /* pawn captures */
              for (j = 2; j < 4; j++) {
                  var square = i + PAWN_OFFSETS[us][j];
                  if (square & 0x88)
                      continue;

                  if (board[square] != null &&
                          board[square].color === them) {
                      add_move(board, moves, i, square, BITS.CAPTURE);
                  } else if (square === ep_square) {
                      add_move(board, moves, i, ep_square, BITS.EP_CAPTURE);
                  }
              }
          } else {
              for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
                  var offset = PIECE_OFFSETS[piece.type][j];
                  var square = i;

                  while (true) {
                      square += offset;
                      if (square & 0x88)
                          break;

                      if (board[square] == null) {
                          add_move(board, moves, i, square, BITS.NORMAL);
                      } else {
                          if (board[square].color === us)
                              break;
                          add_move(board, moves, i, square, BITS.CAPTURE);
                          break;
                      }

                      /* break, if knight or king */
                      if (piece.type === 'n' || piece.type === 'k')
                          break;
                  }
              }
          }
      }

      if ((!single_square) || last_sq === kings[us]) {
          /* king-side castling */
          if (castling[us] & BITS.KSIDE_CASTLE) {
              var castling_from = kings[us];
              var castling_to = castling_from + 2;

              if (board[castling_from + 1] == null &&
                      board[castling_to] == null &&
                      !attacked(them, kings[us]) &&
                      !attacked(them, castling_from + 1) &&
                      !attacked(them, castling_to)) {
                  add_move(board, moves, kings[us], castling_to,
                          BITS.KSIDE_CASTLE);
              }
          }

          /* queen-side castling */
          if (castling[us] & BITS.QSIDE_CASTLE) {
              var castling_from = kings[us];
              var castling_to = castling_from - 2;

              if (board[castling_from - 1] == null &&
                      board[castling_from - 2] == null &&
                      board[castling_from - 3] == null &&
                      !attacked(them, kings[us]) &&
                      !attacked(them, castling_from - 1) &&
                      !attacked(them, castling_to)) {
                  add_move(board, moves, kings[us], castling_to,
                          BITS.QSIDE_CASTLE);
              }
          }
      }

      if (!legal) {
          return moves;
      }

      var legal_moves = [];
      for (var i = 0, len = moves.length; i < len; i++) {
          make_move(moves[i]);
          if (!king_attacked(us)) {
              legal_moves.push(moves[i]);
          }
          undo_move();
      }

      return legal_moves;
  }

  function move_to_san(move) {
      var output = '';

      if (move.flags & BITS.KSIDE_CASTLE) {
          output = 'O-O';
      } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = 'O-O-O';
      } else {
          var disambiguator = get_disambiguator(move);

          if (move.piece !== PAWN) {
              output += move.piece.toUpperCase() + disambiguator;
          }

          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
              if (move.piece === PAWN) {
                  output += algebraic(move.from)[0];
              }
              output += 'x';
          }

          output += algebraic(move.to);

          if (move.flags & BITS.PROMOTION) {
              output += '=' + move.promotion.toUpperCase();
          }
      }

      make_move(move);
      if (in_check()) {
          if (in_checkmate()) {
              output += '#';
          } else {
              output += '+';
          }
      }
      undo_move();

      return output;
  }

  function attacked(color, square) {
      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) {
              i += 7;
              continue;
          }

          /* if empty square or wrong color */
          if (board[i] == null || board[i].color !== color)
              continue;

          var piece = board[i];
          var difference = i - square;
          var index = difference + 119;

          if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
              if (piece.type === PAWN) {
                  if (difference > 0) {
                      if (piece.color === WHITE)
                          return true;
                  } else {
                      if (piece.color === BLACK)
                          return true;
                  }
                  continue;
              }

              /* if the piece is a knight or a king */
              if (piece.type === 'n' || piece.type === 'k')
                  return true;

              var offset = RAYS[index];
              var j = i + offset;

              var blocked = false;
              while (j !== square) {
                  if (board[j] != null) {
                      blocked = true;
                      break;
                  }
                  j += offset;
              }

              if (!blocked)
                  return true;
          }
      }

      return false;
  }

  function king_attacked(color) {
      return attacked(swap_color(color), kings[color]);
  }

  function in_check() {
      return king_attacked(turn);
  }

  function in_checkmate() {
      return in_check() && generate_moves().length === 0;
  }

  function push(move) {
      history.push({
          move: move,
          kings: {b: kings.b, w: kings.w},
          turn: turn,
          castling: {b: castling.b, w: castling.w},
          ep_square: ep_square,
          half_moves: half_moves,
          move_number: move_number
      });
  }

  function make_move(move) {
      var us = turn;
      var them = swap_color(us);
      push(move);

      board[move.to] = board[move.from];
      board[move.from] = null;

      /* if ep capture, remove the captured pawn */
      if (move.flags & BITS.EP_CAPTURE) {
          if (turn === BLACK) {
              board[move.to - 16] = null;
          } else {
              board[move.to + 16] = null;
          }
      }

      /* if pawn promotion, replace with new piece */
      if (move.flags & BITS.PROMOTION) {
          board[move.to] = {type: move.promotion, color: us};
      }

      /* if we moved the king */
      if (board[move.to].type === KING) {
          kings[board[move.to].color] = move.to;

          /* if we castled, move the rook next to the king */
          if (move.flags & BITS.KSIDE_CASTLE) {
              var castling_to = move.to - 1;
              var castling_from = move.to + 1;
              board[castling_to] = board[castling_from];
              board[castling_from] = null;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
              var castling_to = move.to + 1;
              var castling_from = move.to - 2;
              board[castling_to] = board[castling_from];
              board[castling_from] = null;
          }

          /* turn off castling */
          castling[us] = '';
      }

      /* turn off castling if we move a rook */
      if (castling[us]) {
          for (var i = 0, len = ROOKS[us].length; i < len; i++) {
              if (move.from === ROOKS[us][i].square &&
                      castling[us] & ROOKS[us][i].flag) {
                  castling[us] ^= ROOKS[us][i].flag;
                  break;
              }
          }
      }

      /* turn off castling if we capture a rook */
      if (castling[them]) {
          for (var i = 0, len = ROOKS[them].length; i < len; i++) {
              if (move.to === ROOKS[them][i].square &&
                      castling[them] & ROOKS[them][i].flag) {
                  castling[them] ^= ROOKS[them][i].flag;
                  break;
              }
          }
      }

      /* if big pawn move, update the en passant square */
      if (move.flags & BITS.BIG_PAWN) {
          if (turn === 'b') {
              ep_square = move.to - 16;
          } else {
              ep_square = move.to + 16;
          }
      } else {
          ep_square = EMPTY;
      }

      /* reset the 50 move counter if a pawn is moved or a piece is captured */
      if (move.piece === PAWN) {
          half_moves = 0;
      } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          half_moves = 0;
      } else {
          half_moves++;
      }

      if (turn === BLACK) {
          move_number++;
      }
      turn = swap_color(turn);
  }

  function undo_move() {
      var old = history.pop();
      if (old === null) {
          return null;
      }

      var move = old.move;
      kings = old.kings;
      turn = old.turn;
      castling = old.castling;
      ep_square = old.ep_square;
      half_moves = old.half_moves;
      move_number = old.move_number;

      var us = turn;
      var them = swap_color(turn);

      board[move.from] = board[move.to];
      board[move.from].type = move.piece;  // to undo any promotions
      board[move.to] = null;

      if (move.flags & BITS.CAPTURE) {
          board[move.to] = {type: move.captured, color: them};
      } else if (move.flags & BITS.EP_CAPTURE) {
          var index;
          if (us === BLACK) {
              index = move.to - 16;
          } else {
              index = move.to + 16;
          }
          board[index] = {type: PAWN, color: them};
      }


      if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          var castling_to, castling_from;
          if (move.flags & BITS.KSIDE_CASTLE) {
              castling_to = move.to + 1;
              castling_from = move.to - 1;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
              castling_to = move.to - 2;
              castling_from = move.to + 1;
          }

          board[castling_to] = board[castling_from];
          board[castling_from] = null;
      }

      return move;
  }

  function get_disambiguator(move) {
      var moves = generate_moves();

      var from = move.from;
      var to = move.to;
      var piece = move.piece;

      var ambiguities = 0;
      var same_rank = 0;
      var same_file = 0;

      for (var i = 0, len = moves.length; i < len; i++) {
          var ambig_from = moves[i].from;
          var ambig_to = moves[i].to;
          var ambig_piece = moves[i].piece;

          /* if a move of the same piece type ends on the same to square, we'll
           * need to add a disambiguator to the algebraic notation
           */
          if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
              ambiguities++;

              if (rank(from) === rank(ambig_from)) {
                  same_rank++;
              }

              if (file(from) === file(ambig_from)) {
                  same_file++;
              }
          }
      }

      if (ambiguities > 0) {
          /* if there exists a similar moving piece on the same rank and file as
           * the move in question, use the square as the disambiguator
           */
          if (same_rank > 0 && same_file > 0) {
              return algebraic(from);
          }
          /* if the moving piece rests on the same file, use the rank symbol as the
           * disambiguator
           */
          else if (same_file > 0) {
              return algebraic(from).charAt(1);
          }
          /* else use the file symbol */
          else {
              return algebraic(from).charAt(0);
          }
      }

      return '';
  }

  function rank(i) {
      return i >> 4;
  }

  function file(i) {
      return i & 15;
  }

  function algebraic(i) {
      var f = file(i), r = rank(i);
      return 'abcdefgh'.substring(f, f + 1) + '87654321'.substring(r, r + 1);
  }

  function swap_color(c) {
      return c === WHITE ? BLACK : WHITE;
  }

  function is_digit(c) {
      return '0123456789'.indexOf(c) !== -1;
  }

  function clone(obj) {
      var dupe = (obj instanceof Array) ? [] : {};

      for (var property in obj) {
          if (typeof property === 'object') {
              dupe[property] = clone(obj[property]);
          } else {
              dupe[property] = obj[property];
          }
      }

      return dupe;
  }

  function trim(str) {
      return str.replace(/^\s+|\s+$/g, '');
  }

  function perft(depth) {
      var moves = generate_moves({legal: false});
      var nodes = 0;
      var color = turn;

      for (var i = 0, len = moves.length; i < len; i++) {
          make_move(moves[i]);
          if (!king_attacked(color)) {
              if (depth - 1 > 0) {
                  var child_nodes = perft(depth - 1);
                  nodes += child_nodes;
              } else {
                  nodes++;
              }
          }
          undo_move();
      }

      return nodes;
  }


  return (function (options) {
      function mask(str) {
          return str.replace(/\\/g, '\\');
      }

      /* convert a move from Standard Algebraic Notation (SAN) to 0x88
       * coordinates
       */
      function move_from_san(move) {
          /* strip off any move decorations: e.g Nf3+?! */
//          KingdomPGN.SAN.push(move);
//          KingdomPGN.temp.push(move);
          var moveReplaced = move;
          var moves = generate_moves();
          for (var i = 0, len = moves.length; i < len; i++) {
              var uci = algebraic(moves[i].from) + algebraic(moves[i].to);
              if (moveReplaced == uci) {
            	  moves[i].san = move_to_san(moves[i]);
//                  uciList.push(uci);
                  return moves[i];
              }
          }
          return null;
      }

      function get_move_obj(move) {
          return move_from_san(trim(move));
      }

      function has_keys(object) {
          var has_keys = false;
          for (var key in object) {
              has_keys = true;
          }
          return has_keys;
      }

      function parse_pgn_header(header, options) {
          var newline_char = (typeof options === 'object' &&
                  typeof options.newline_char === 'string') ?
                  options.newline_char : '\r?\n';
          var header_obj = {};
          var headers = header.split(new RegExp(mask(newline_char)));
          var key = '';
          var value = '';

          for (var i = 0; i < headers.length; i++) {
              key = headers[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
              value = headers[i].replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
              if (trim(key).length > 0) {
                  header_obj[key] = value;
              }
          }

          return header_obj;
      }

      var newline_char = (typeof options === 'object' &&
              typeof options.newline_char === 'string') ?
              options.newline_char : '\r?\n';
      var regex = new RegExp('^(\\[(.|' + mask(newline_char) + ')*\\])' +
              '(' + mask(newline_char) + ')*' +
              '1.(' + mask(newline_char) + '|.)*$', 'g');

      /* get header part of the PGN file */
      var header_string = pgn.replace(regex, '$1');

      /* no info part given, begins with moves */
      if (header_string[0] !== '[') {
          header_string = '';
      }

      reset();

      /* parse PGN header */
      var headers = parse_pgn_header(header_string, options);
      for (var key in headers) {
          set_header([key, headers[key]]);
      }

      /* load the starting position indicated by [Setup '1'] and
       * [FEN position] */
      if (headers['SetUp'] === '1') {
          if (!(('FEN' in headers) && load(headers['FEN']))) {
              return;
          }
      }

      /* delete header to get the moves */
      var ms = pgn.replace(header_string, '').replace(new RegExp(mask(newline_char), 'g'), ' ');

      /* delete comments */
      ms = ms.replace(/(\{[^}]+\})+?/g, '');

      /* delete move numbers */
      ms = ms.replace(/\d+\./g, '');

      /* delete ... indicating black to move */
      ms = ms.replace(/\.\.\./g, '');

      /* trim and get array of moves */
      var moves = trim(ms).split(new RegExp(/\s+/));

      /* delete empty entries */
      moves = moves.join(',').replace(/,,+/g, ',').split(',');
      var move = '';

      for (var half_move = 0; half_move < moves.length - 1; half_move++) {
          move = get_move_obj(moves[half_move]);

          /* move not possible! (don't clear the board to examine to show the
           * latest valid position)
           */
          if (move == null) {
              return history;
          } else {
              make_move(move);
//              KingdomPGN.FEN.push(generate_fen());
          }
      }

      /* examine last move */
      move = moves[moves.length - 1];
      if (POSSIBLE_RESULTS.indexOf(move) > -1) {
          if (has_keys(header) && typeof header.Result === 'undefined') {
              set_header(['Result', move]);
          }
      }
      else {
          move = get_move_obj(move);
          if (move == null) {
              return history;
          } else {
              make_move(move);
//              KingdomPGN.FEN.push(generate_fen());
          }
      }
//      console.log(history);
      return history;
  }());


}