var KingdomPGN;

(function () {
    var board;
    var pgnIndex = 0;
    var orientation = 'w';
    var moveListElement = G.cde('div', {c: 'moveList'});
    var interval;
    var uciList = [];
    var isReady = false;
    KingdomPGN = {
        ChessBoard: getBoard,
        ShowRatingContainer: null,
        HideRatingContainer: null,
        PGN: '',
        SAN: [],
        FEN: [],
        Play: play,
        Stop: stop,
        PlayInterval: 2000,
        Next: next,
        Reset: reset,
        RotateBoard: rotate,
        SetPgn: setpgn,
        GetMoveList: getmoveList,
        GetUci: function () {
            return uciList;
        },
        IsReady: function () {
            return isReady;
        }
    };

    function getmoveList(id) {
        document.getElementById(id).appendChild(moveListElement);
        $(document).on('click', '.moveList table td', function () {
            if (!$(this).attr('id')) {
                return;
            }
            var moveId = parseInt($(this).attr('id'));
            if (moveId === 0) {
                board.set_board();
                pgnIndex = 0;
                next();
                return;
            }
            if (pgnIndex > moveId) {
                board.set_board(KingdomPGN.FEN[moveId - 1]);
                pgnIndex = moveId;
                next();
                return;
            }
            var temp = window.setInterval(function () {
                if (pgnIndex <= moveId) {
                    next();
                } else {
                    clearInterval(temp);
                }
            }, 0);
        });
    }

    function makeMoveList() {
        var tbl = G.cde('table', {c: ''});
        var i = pgnIndex = 0;
        var temp = window.setInterval(function () {
            if (next()) {
                var tr = G.cde('tr');
                var tdNum = G.cde('td');
                tdNum.innerHTML = i / 2 + 1;
                tr.appendChild(tdNum);
                var td;
                if (i === KingdomPGN.SAN.length - 1) {
                    td = G.cde('td', {id: i, c: 'active-move'});
                } else {
                    td = G.cde('td', {id: i});
                }
                td.innerHTML = KingdomPGN.SAN[i];
                tr.appendChild(td);
                if (i + 1 === KingdomPGN.SAN.length - 1) {
                    td = G.cde('td', {id: i + 1, c: 'active-move'});
                } else {
                    td = G.cde('td', {id: i + 1});
                }
                if (KingdomPGN.SAN[i + 1]) {
                    td.innerHTML = KingdomPGN.SAN[i + 1];
                    tr.appendChild(td);
                }
                if (i % 2 === 0)
                    tbl.appendChild(tr);
                i++;
            } else {
                clearInterval(temp);
                $('#canvas').css('left', $('.chess_board').offset().left);
                $('.moveList table tr td#' + pgnIndex++).addClass('active-move');
            }
        }, 1);
        moveListElement.appendChild(tbl);
    }

    function setpgn(str) {
        if (!str) {
            return;
        }
        pgnparser(str);
        moveListElement.innerHTML = '';
        str = KingdomPGN.PGN = str.trim();
        str = str.substring(str.lastIndexOf(']') + 1, str.length - 3);
        str = str.replace(/\d+\./g, '');
        str = str.trim().split(new RegExp(/\s+/));
        KingdomPGN.SAN = str;
        makeMoveList();
		board.reset();
    }

    function rotate() {
        if (orientation === 'w') {
            board.change_orientation('black');
            orientation = 'b';
        } else {
            board.change_orientation('white');
            orientation = 'w';
        }

    }

    function reset() {
        stop();
        board.reset();
        pgnIndex = 0;
        $('.moveList table tr td.active-move').removeClass('active-move');
    }

    function next() {
        if (KingdomPGN.SAN.length < 1 || pgnIndex >= KingdomPGN.SAN.length) {
            return false;
        }

        board.fen = KingdomPGN.FEN[pgnIndex];
        board.move(uciList[pgnIndex]);
        board.onmove();


        $('.moveList table tr td.active-move').removeClass('active-move');
        $('.moveList table tr td#' + pgnIndex++).addClass('active-move');
        if ($(".active-move").offset()) {
//            $('.moveList').animate({
//                scrollTop: $("#" + pgnIndex).offset().top},
//            'slow');
//            $('.moveList').scrollTop($(".active-move").offset().top);
            $('.active-move')[0].scrollIntoView();
            console.log($(".active-move").offset().top, $('.moveList').scrollTop());
        }
        return true;
    }

    function play() {
        if (KingdomPGN.SAN.length < 1) {
            return;
        }
        if (pgnIndex >= KingdomPGN.SAN.length) {
            pgnIndex = 0;
            board.reset();
        }

        interval = window.setInterval(function () {
            if (!next()) {
                clearInterval(interval);
            }
        }, KingdomPGN.PlayInterval);
    }

    function stop() {
        window.clearInterval(interval);
    }

    function getBoard(id, ratingContainer) {
        "use strict";

        var board_el = G.cde("div");
        board = BOARD(board_el);
        var moves_white;
        var moves_black;
        var zobrist_keys = [];
        var stalemate_by_rules;
        var evaler;
        var rating_slider;
        var rating_el = G.cde("div", {c: "ratingContainer"});
        var starting_new_game;
        var retry_move_timer;
        var pieces_moved;
        var startpos;
        var debugging = false;
        var legal_move_engine;
        var cur_pos_cmd;
        var eval_depth = 8;
        var rating_font_style = "Impact,monospace,mono,sans-serif";
        var font_fit = FONT_FIT({fontFamily: rating_font_style});
        var moves_manager;
        var showing_loading;

        function error(str) {
            str = str || "Unknown error";

            alert("An error occured.\n" + str);
            throw new Error(str);
        }

        function load_engine() {
            var worker = new Worker("javascripts/stockfish6.js"),
                    engine = {started: Date.now()},
            que = [];

            function get_first_word(line) {
                var space_index = line.indexOf(" ");

                /// If there are no spaces, send the whole line.
                if (space_index === -1) {
                    return line;
                }
                return line.substr(0, space_index);
            }

            function determine_que_num(line, que) {
                var cmd_type,
                        first_word = get_first_word(line),
                        cmd_first_word,
                        i,
                        len;

                if (first_word === "uciok" || first_word === "option") {
                    cmd_type = "uci";
                } else if (first_word === "readyok") {
                    cmd_type = "isready";
                } else if (first_word === "bestmove" || first_word === "info") {
                    cmd_type = "go";
                } else {
                    /// eval and d are more difficult.
                    cmd_type = "other";
                }

                len = que.length;

                for (i = 0; i < len; i += 1) {
                    cmd_first_word = get_first_word(que[i].cmd);
                    if (cmd_first_word === cmd_type || (cmd_type === "other" && (cmd_first_word === "d" || cmd_first_word === "eval"))) {
                        return i;
                    }
                }

                /// Not sure; just go with the first one.
                return 0;
            }

            worker.onmessage = function (e) {
                var line = e.data,
                        done,
                        que_num = 0,
                        my_que;

                /// Stream everything to this, even invalid lines.
                if (engine.stream) {
                    engine.stream(line);
                }

                /// Ignore invalid setoption commands since valid ones do not repond.
                if (line.substr(0, 14) === "No such option") {
                    return;
                }

                que_num = determine_que_num(line, que);

                my_que = que[que_num];

                if (!my_que) {
                    return;
                }

                if (my_que.stream) {
                    my_que.stream(line);
                }

                if (typeof my_que.message === "undefined") {
                    my_que.message = "";
                } else if (my_que.message !== "") {
                    my_que.message += "\n";
                }

                my_que.message += line;

                /// Try to determine if the stream is done.
                if (line === "uciok") {
                    /// uci
                    done = true;
                    engine.loaded = true;
                } else if (line === "readyok") {
                    /// isready
                    done = true;
                    engine.ready = true;
                } else if (line.substr(0, 8) === "bestmove") {
                    /// go [...]
                    done = true;
                    /// All "go" needs is the last line (use stream to get more)
                    my_que.message = line;
                } else if (my_que.cmd === "d" && line.substr(0, 15) === "Legal uci moves") {
                    done = true;
                } else if (my_que.cmd === "eval" && /Total Evaluation[\s\S]+\n$/.test(my_que.message)) {
                    done = true;
                } else if (line.substr(0, 15) === "Unknown command") {
                    done = true;
                }
                ///NOTE: Stockfish.js does not support the "debug" or "register" commands.
                ///TODO: Add support for "perft", "bench", and "key" commands.
                ///TODO: Get welcome message so that it does not get caught with other messages.
                ///TODO: Prevent (or handle) multiple messages from different commands
                ///      E.g., "go depth 20" followed later by "uci"

                if (done) {
                    if (my_que.cb && !my_que.discard) {
                        my_que.cb(my_que.message);
                    }

                    /// Remove this from the que.
                    G.array_remove(que, que_num);
                }
            };

            engine.send = function send(cmd, cb, stream) {
                cmd = String(cmd).trim();

                /// Can't quit. This is a browser.
                ///TODO: Destroy the engine.
                if (cmd === "quit") {
                    return;
                }

                if (debugging) {
                    console.log(cmd);
                }

                /// Only add a que for commands that always print.
                ///NOTE: setoption may or may not print a statement.
                if (cmd !== "ucinewgame" && cmd !== "flip" && cmd !== "stop" && cmd !== "ponderhit" && cmd.substr(0, 8) !== "position" && cmd.substr(0, 9) !== "setoption") {
                    que[que.length] = {
                        cmd: cmd,
                        cb: cb,
                        stream: stream
                    };
                }
                worker.postMessage(cmd);
            };

            engine.stop_moves = function stop_moves() {
                var i,
                        len = que.length;

                for (i = 0; i < len; i += 1) {
                    if (debugging) {
                        console.log(i, get_first_word(que[i].cmd));
                    }
                    /// We found a move that has not been stopped yet.
                    if (get_first_word(que[i].cmd) === "go" && !que[i].discard) {
                        engine.send("stop");
                        que[i].discard = true;
                    }
                }
            };

            engine.get_cue_len = function get_cue_len() {
                return que.length;
            };

            return engine;
        }

        function calculate_board_size(w, h) {
            var snap;

            w = w || document.getElementById(id).offsetWidth;
            h = w || document.getElementById(id).offsetHeight;

            if (w > h) {
                w = h;
            } else {
                h = w;
            }

            w = Math.round(w * .9);

            snap = w % board.board_details.files;

            w -= snap;

            return w - 4;
        }

        function resize_board() {
            var size = calculate_board_size();

            board.size_board(size, size);

            $('.piece').width(size / 8);
            $('.piece').height(size / 8);
            $('.hoverSquare').height(size / 8);

            var offset = $('.chess_board').offset();
            $('#canvas').offset(offset);
            $('#canvas').width($('.chess_board').width());
            $('#canvas').height($('.chess_board').height());
        }

        function onresize() {
            resize_board();
            rating_slider.resize();
        }

        function get_legal_moves(pos, cb) {
            if (pos) {
                legal_move_engine.send(pos);
            }

            legal_move_engine.send("d", function ond(str) {
                var san = str.match(/Legal moves\:(.*)/),
                        uci = str.match(/Legal uci moves\:(.*)/),
                        key = str.match(/Key\: (\S+)/),
                        fen = str.match(/Fen\: (\S+) (\S+) (\S+) (\S+) (\S+) (\S+)/),
                        checkers = str.match(/Checkers\:(.*)/),
                        res;

                if (!san || !uci || !checkers || !key) {
                    error("Invalid d response: \n" + str);
                }

                res = {
                    san: san[1].trim().split(" "),
                    uci: uci[1].trim().split(" "),
                    key: key[1],
                    checkers: checkers[1].trim().split(" ")
                };

                if (fen) {
                    res.fen = {
                        placement: fen[1],
                        turn: fen[2],
                        castling_ability: fen[3],
                        en_passant: fen[4],
                        half_move_clock: fen[5],
                        full_move_counter: fen[6]
                    };

                }

                if (res.san.length === 1 && res.san[0] === "") {
                    res.san = [];
                }
                if (res.uci.length === 1 && res.uci[0] === "") {
                    res.uci = [];
                }
                if (res.checkers.length === 1 && res.checkers[0] === "") {
                    res.checkers = [];
                }

                cb(res);
            });
        }

        function is_insufficient_material(color) {
            var i,
                    piece_counts = {
                        knights: 0,
                        bishops: 0,
                        light_bishops: 0
                    },
            piece_type;

            /// Check insufficient material
            /// 1. Only Kings
            /// 2. Kings and one knight
            /// 3. Kings and any number of bishops on either or one side all of which are on the same color
            ///NOTE: Could examine the fen position too, but it would take a little more work to determine bishop color.
            if (board.pieces) {
                for (i = board.pieces.length - 1; i >= 0; i -= 1) {
                    /// Make sure the piece is on the board and it is one that we are counting.
                    if (!board.pieces[i].captured && (!color || board.pieces[i].color === color)) {
                        piece_type = board.pieces[i].type;
                        if (piece_type === "p" || piece_type === "r" || piece_type === "q") {
                            piece_counts.others = 1;
                            break;
                            /// We found a mating piece. Stop now.
                        } else if (piece_type === "n") {
                            piece_counts.knights += 1;
                            if (piece_counts.knights > 1) {
                                break;
                            }
                        } else if (piece_type === "b") {
                            piece_counts.bishops += 1;
                            if ((board.pieces[i].rank + board.pieces[i].file) % 2) {
                                piece_counts.light_bishops += 1;
                            }
                        }
                    }
                }
                return !piece_counts.others && ((!piece_counts.knights && !piece_counts.bishops) || ((piece_counts.knights === 1 && !piece_counts.bishops) || (!piece_counts.knights && (piece_counts.light_bishops === 0 || (piece_counts.bishops === piece_counts.light_bishops)))));
            }
        }

        function is_stalemate_by_rule(fen, key) {
            var i,
                    count = 1;

            /// Check 50 move rule
            if (fen.half_move_clock > 99) {
                return "50";
            }

            /// Check three-fold repition
            if (!key) {
                key = zobrist_keys[zobrist_keys.length - 1];
                ///NOTE: The last move and this one cannot be the same since a different player has moved.
                i = zobrist_keys.length - 2;
            } else {
                i = zobrist_keys.length - 1;
            }
            ///TODO: Delete keys after a capture, pawn movement, or castling abilities change.
            for (; i >= 0; i -= 1) {
                if (key === zobrist_keys[i]) {
                    count += 1;
                    if (count === 3) {
                        return "3";
                    }
                }
            }

            if (is_insufficient_material()) {
                return "material";
            }
        }

        function pause_game() {
            board.wait();
            G.events.trigger("gamePaused");
        }

        function set_legal_moves(cb) {
            get_legal_moves(cur_pos_cmd, function onget(moves) {
                var message_el;
                zobrist_keys.push(moves.key);
                stalemate_by_rules = is_stalemate_by_rule(moves.fen);

                /// Is the game still on?
                ///TODO: Only AI should automatically claim 50 move rule. (And probably not the lower levels).
                if (moves.uci.length && !stalemate_by_rules) {
                    board.set_legal_moves(moves);
                    if (cb) {
                        cb();
                    }
                } else {
                    board.set_legal_moves(moves);
                    if (board.get_mode() === "play") {
                        /// Was it checkmate?
                        if (moves.checkers.length && !stalemate_by_rules) {
                            message_el = G.cde("div", [
                                (board.turn === "b" ? "White" : "Black") + " wins!",
                                G.cde("br"),
                                (board.turn === "b" ? "Black" : "White") + " is checkmated!"
                            ]);
                        }
//                        else {
//                            if (stalemate_by_rules) {
//                                if (stalemate_by_rules === "50") {
//                                    message_el = G.cde("div", {t: "Stalemate: 50 move rule"});
//                                } else if (stalemate_by_rules === "3") {
//                                    message_el = G.cde("div", {t: "Stalemate: Three-fold repetition"});
//                                } else if (stalemate_by_rules === "material") {
//                                    message_el = G.cde("div", {t: "Stalemate: Insufficient material"});
//                                }
//                            } else {
//                                message_el = G.cde("div", {t: "Stalemate!"});
//                            }
//                        }
//                        if (message_el) {
//                            board.create_modular_window({
//                                content: message_el,
//                                cancelable: true,
//                                open: true
//                            });
////                        }
//                        pause_game();
                    }
                }
            });
        }

        function prep_eval(pos, ply) {
            game_history[ply].pos = pos;

            setTimeout(eval_stack, 0);
        }

        function eval_stack() {
            var i;

            for (i = game_history.length - 1; i >= 0; i -= 1) {
                if (!game_history[i].evaled) {
                    return eval_pos(i);
                }
            }
        }

        G.events.attach("evaled", eval_stack);

        function eval_pos(ply) {
            /// If we are in the middle of an eval, stop it and do the latest one.
            if (evaler.busy) {
                if (evaler.cur_ply === ply) {
                    return;
                }
                evaler.stop = true;
                return evaler.send("stop");
            }

            evaler.stop = false;
            evaler.busy = true;
            evaler.cur_ply = ply;

            evaler.send(game_history[ply].pos);

            evaler.send("go depth " + eval_depth, function ongo(str) {
                var matches = str.match(/^bestmove\s(\S+)(?:\sponder\s(\S+))?/);

                if (game_history[ply] && !evaler.stop) {
                    if (matches) {
                        game_history[ply].eval_best_move = matches[1];
                        game_history[ply].eval_ponder = matches[2];
                    }

                    game_history[ply].evaled = true;
                }
                evaler.busy = false;
                G.events.trigger("evaled", {ply: ply});
            }, function stream(str) {
                var matches = str.match(/depth (\d+) .*score (cp|mate) ([-\d]+) .*pv (.+)/),
                        score,
                        type,
                        depth,
                        pv,
                        data;

                /// Are we still supposed to be evaling?
                ///NOTE: When a new game starts, the game_history array will be empty.
                if (game_history[ply]) {
                    if (matches) {
                        depth = Number(matches[1]);
                        type = matches[2];
                        score = Number(matches[3]);
                        pv = matches[4].split(" ");

                        /// Convert the relative score to an absolute score.
                        if (game_history[ply].turn === "b") {
                            score *= -1;
                        }

                        game_history[ply].eval_score = score;
                        game_history[ply].eval_type = type;
                        game_history[ply].eval_depth = depth;
                        game_history[ply].eval_pv = pv;

                        data = {score: score, type: type, depth: depth, pv: pv};
                    } else {
                        if (/score mate 0\b/.test(str)) {
                            game_history[ply].eval_score = 0;
                            game_history[ply].eval_type = "mate";
                            game_history[ply].eval_depth = 0;
                            data = {score: 0, type: "mate", depth: 0};
                        }
                    }
                }

                if (data) {
                    data.ply = ply;
                    data.turn = game_history[ply].turn;
                    G.events.trigger("eval", data);
                }
            });
        }

        function set_cur_pos_cmd(fen) {
            var cmd = "position fen " + board.fen;
//                    ply = 0;

            if (board.moves && board.moves.length) {
//                ply = board.moves.length;
                cmd += " moves " + board.moves.join(" ");
            }

            cur_pos_cmd = cmd;
            get_legal_move_engine();
            isReady = true;
//            console.log(cmd);
        }
        function tell_engine_to_move() {
            ///NOTE: Without time, it thinks really fast. So, we give it a something to make it move reasonably quickly.
            ///      This time is also tweaked based on the level.
//            var default_time = 1200 * 60, /// 1 minute
//                    wtime,
//                    btime,
//                    depth,
//                    player = board.players[board.turn];

            if (board.get_mode() !== "play") {
                return;
            }


//
//            function tweak_default_time(player) {
//                var level;
//
//                if (player.type === "ai") {
//                    level = player.engine.level;
//                } else {
//                    level = 20;
//                }
//                console.log('level', level)
//                return default_time + (default_time * (level / 20));
//            }
////
//            if (player.type === "ai") {
//                /// Pause the game if the computer is not ready.
//                ///TODO: Unpause when changed to human.
//                if (!player.engine.loaded || !player.engine.ready) {
//                    return retry_move_timer = setInterval(function onretry() {
//                        if (player.engine.loaded && player.engine.ready) {
//                            hide_loading();
//                            clearInterval(retry_move_timer);
//                            tell_engine_to_move();
//                        }
//                    }, 100);
//                }
//
//                if (board.players.w.has_time) {
//                    wtime = board.players.w.time;
//                } else {
//                    wtime = tweak_default_time(board.players.w);
//
//                }
//                if (board.players.b.has_time) {
//                    btime = board.players.b.time;
//                } else {
//                    btime = tweak_default_time(board.players.b);
//                }
//
//                if (use_depth(player)) {
//                    depth = player.engine.depth;
//                }
//
//                player.engine.send(cur_pos_cmd);
//                player.engine.send("go " + (typeof depth !== "undefined" ? "depth " + depth : "") + " wtime " + wtime + " btime " + btime, onengine_move, onthinking);
//                return true;
//            }
        }

        function on_human_move() {
            set_cur_pos_cmd();

            ///NOTE: We need to get legal moves (even for AI) because we need to know if a move is castling or not.
            set_legal_moves(tell_engine_to_move);

//            G.events.trigger("move", {uci: uciList[pgnIndex], san: KingdomPGN.SAN[pgnIndex]});
        }

        function all_ready(cb) {
            function ready_black() {
                if (board.players.b.type === "ai") {
                    board.players.b.engine.send("isready", cb);
                } else {
                    cb();
                }
            }

            evaler.send("isready", function evaler_ready() {
                if (board.players.w.type === "ai") {
                    board.players.w.engine.send("isready", ready_black);
                } else {
                    ready_black();
                }
            });
        }

        function all_flushed(cb) {
            function wait() {
                setTimeout(function retry() {
                    all_flushed(cb);
                }, 1);
            }

            if (evaler.get_cue_len()) {
                return wait();
            }

            if (legal_move_engine && legal_move_engine.get_cue_len()) {
                return wait();
            }

            if (board.players.w.type === "ai" && board.players.w.engine.get_cue_len()) {
                return wait();
            }

            if (board.players.b.type === "ai" && board.players.b.engine.get_cue_len()) {
                return wait();
            }

            all_ready(cb);
        }

        function stop_game() {
            /// Prevent possible future moves.
            clearInterval(retry_move_timer);
        }

//        function init_setup() {
////            pause_game();
////            new_game_el.textContent = "Start Game";
////            setup_game_el.disabled = true;
////            hide_loading(true);
////            board.enable_setup();
////            G.events.trigger("initSetup");
//        }

        function check_startpos(cb) {
            /// The default position is always right.
            if (startpos === "startpos") {
                return setTimeout(function () {
                    cb(true);
                }, 0);
            }

            check_fen(startpos, cb);
        }

        function check_fen(fen, cb) {
            var temp_pos;

            function return_val(is_valid) {
                setTimeout(function () {
                    cb(is_valid);
                }, 0);
            }

            /// A simple check to see if the FEN makes sense.
            if (!/^\s*fen\s+[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*/i.test(fen)) {
                return return_val(false);
            }

            /// Set it to an invalid one first, so that when we set it to a valid one, it should change; otherwise it will remain invalid.
            ///NOTE: Stockfish just completely ignores invalid FEN's. It also allows for lots of omissions.
            legal_move_engine.send("position fen 8/8/8/8/8/8/8/8 b - - 0 1");
            get_legal_moves("position " + fen, function onget(data) {
                var wkings = 0,
                        bkings = 0;

                if (!data.uci.length) {
                    /// The starting side needs a valid move.
                    return return_val(false);
                }

                /// Count kings.
                data.fen.placement.replace(/k/gi, function counter(char) {
                    if (char === "k") {
                        bkings += 1;
                    } else {
                        wkings += 1;
                    }
                });

                if (bkings !== 1 || wkings !== 1) {
                    /// Both sides need exactly one king.
                    return return_val(false);
                }

                get_legal_moves("position fen " + data.fen.placement + " " + (data.fen.turn === "w" ? "b" : "w"), function onget(data) {
                    /// There must not be anyone already checking the opponent's king.
                    return return_val(!data.checkers.length);
                });
            });
        }

        function get_legal_move_engine() {
            if (!legal_move_engine) {
                if (board.players.b.engine) {
                    legal_move_engine = board.players.b.engine;
                } else if (board.players.w.engine) {
                    legal_move_engine = board.players.w.engine;
                } else {
                    board.players.b.engine = load_engine();
                    legal_move_engine = board.players.b.engine;
                }
            }
        }

        function start_new_game() {
            moves_white = [];
            moves_black = [];

            var dont_reset = board.get_mode() === "setup",
                    stop_new_game;

//            new_game_el.textContent = "New Game";
//            setup_game_el.disabled = false;

            if (starting_new_game) {
                return;
            }

            starting_new_game = true;

            /// Stop loading a new game if the user clicks on setup.
//            G.events.attach("initSetup", function () {
//                stop_new_game = true;
//            }, true);

            stop_game();

//            game_history = [];

            evaler.send("stop");
            evaler.send("ucinewgame");

//            if (board.players.w.type === "ai") {
//                board.players.w.engine.send("ucinewgame");
//            }
//            if (board.players.b.type === "ai") {
//                board.players.b.engine.send("ucinewgame");
//            }

            get_legal_move_engine();

            all_flushed(function start_game() {
                if (stop_new_game) {
                    return starting_new_game = false;
                }

                if (dont_reset) {
                    ///TEMP: There needs to be a way to set turn, castling, and moves (maybe also a PGN and FEN importer).
                    startpos = board.get_fen() + " w - - 0 1";
                    board.turn = "w";
                    board.set_board(startpos);
                    startpos = "fen " + startpos;
                    ///TODO: Get move count.
                    /*
                     if (move_count > 0) {
                     board.messy = true;
                     }
                     */
                } else {
                    board.set_board();
                    startpos = "startpos";
                }

                check_startpos(function oncheck(is_valid) {
                    if (stop_new_game) {
                        return starting_new_game = false;
                    }

                    if (!is_valid) {
                        starting_new_game = false;
                        pause_game();
                        hide_loading(true);
                        alert("Position is invalid");
                        return;
                    }

                    zobrist_keys = [];
                    stalemate_by_rules = null;
                    pieces_moved = false;

                    set_cur_pos_cmd();

                    //engine.send("position fen 6R1/1pp5/5k2/p1b4r/P1P2p2/1P5r/4R2P/7K w - - 0 39");
                    //board.moves = "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d4 e5d4 e1g1 f6e4 f1e1 d7d5 c4d5 d8d5 b1c3 d5c4 c3e4 c8e6 b2b3 c4d5 c1g5 f8b4 c2c3 f7f5 e4d6 b4d6 c3c4 d5c5 d1e2 e8g8 e2e6 g8h8 a1d1 f5f4 e1e4 c5a5 e4e2 a5f5 e6f5 f8f5 g5h4 a8f8 d1d3 h7h6 f3d4 c6d4 d3d4 g7g5 h4g5 h6g5 g1f1 g5g4 f2f3 g4f3 g2f3 h8g7 a2a4 f8h8 f1g2 g7f6 g2h1 h8h3 d4d3 d6c5 e2b2 f5g5 b2b1 a7a5 b1f1 c5e3 f1e1 h3f3 d3d8 g5h5 d8g8 f3h3 e1e2 e3c5".split(" ");
                    set_legal_moves(function onset() {
                        if (stop_new_game) {
                            return starting_new_game = false;
                        }


//                        game_history = [{turn: board.turn, pos: "position " + startpos}];

//                        prep_eval(game_history[0].pos, 0);

//                    clock_manager.reset_clocks();
                        starting_new_game = false;
                        hide_loading();
                        tell_engine_to_move();
                        G.events.trigger("newGameBegins");
                    });
                });
            });
        }

        //setInterval(start_new_game, 30000);

//    function change_selected(el, value) {
//        var i;
//
//        for (i = el.options.length - 1; i >= 0; i -= 1) {
//            if (el.options[i].value === value) {
//                el.selectedIndex = i;
//                break;
//            }
//        }
//    }
//
//    function get_other_player(player) {
//        return board.players[player.color === "w" ? "b" : "w"];
//    }
//
//    function make_type_change(player) {
//        function set_type(type) {
//            var other_player,
//                    this_engine,
//                    tmp_engine;
//
//            if (type === "human" || type === "ai") {
//                change_selected(player.els.type, type);
//
//                if (type !== player.type) {
//                    player.type = type;
//                    if (player.type === "ai") {
//                        if (!player.engine) {
//                            other_player = get_other_player(player);
//                            if (other_player.type === "human" && other_player.engine) {
//                                player.engine = other_player.engine;
//                                delete other_player.engine;
//                            } else {
//                                player.engine = load_engine();
//                                /// Keep the correct engine, even if it gets switched.
//                                this_engine = player.engine;
//                                ///NOTE: This shows that it's loaded so that we know that it can move.
//                                player.engine.send("uci", function onload() {
//                                    /// Make sure it's all ready too.
//                                    ///NOTE: We need to link directly to the engine because it could get switched while loading.
//                                    this_engine.send("isready");
//                                });
//                            }
//                        }
//
//                        /// Set the AI level if not already.
//                        player.set_level(player.level);
//
//                        if (board.get_mode() === "play") {
//                            set_cur_pos_cmd();
//                            tell_engine_to_move();
//                        }
//                        player.els.level.style.display = "inline";
//                    } else { /// Human
//                        if (player.engine) {
//                            player.engine.stop_moves();
//                        }
//                        player.els.level.style.display = "none";
//                        other_player = get_other_player(player);
//                        /// Do we have an engine we don't need now and the other player needs one?
//                        if (player.engine && other_player.type === "ai" && !other_player.engine.ready && player.engine.started < other_player.engine.started) {
//                            /// Switch engines.
//                            tmp_engine = player.engine;
//                            player.engine = other_player.engine;
//                            other_player.engine = tmp_engine;
//
//                            /// Reset levels.
//                            player.set_level(player.level);
//                            other_player.set_level(other_player.level);
//                        }
//                    }
//                }
//            }
//        }
//
//        function onchange() {
//            set_type(this.value);
//        }
//
//        player.set_type = set_type;
//
//        return onchange;
//    }
//
//    function make_set_level(player) {
//        function set_level(level) {
//            var depth,
//                    err_prob,
//                    max_err;
//
//            if (level < 0) {
//                level = 0;
//            }
//            if (level > 20) {
//                level = 20;
//            }
//
//            /// Nothing to change.
//            if (level === player.engine.level) {
//                return false;
//            }
//
//            /// Change thinking depth allowance.
//            if (level < 2) {
//                depth = "1";
//            } else if (level < 4) {
//                depth = "2";
//            } else if (level < 6) {
//                depth = "3";
//            } else if (level < 8) {
//                depth = "4";
//            }
//
//            player.engine.level = level;
//            player.engine.depth = depth;
//
//            change_selected(player.els.level, level);
//
//            if (player.engine) {
//                player.engine.send("setoption name Skill Level value " + level);
//
//                ///NOTE: Stockfish level 20 does not make errors (intentially), so these numbers have no effect on level 20.
//                /// Level 0 starts at 1
//                err_prob = Math.round((level * 6.35) + 1);
//                /// Level 0 starts at 5
//                max_err = Math.round((level * -0.25) + 5);
//
//                player.engine.err_prob = err_prob;
//                player.engine.max_err = max_err;
//
//                player.engine.send("setoption name Skill Level Maximum Error value " + max_err);
//                player.engine.send("setoption name Skill Level Probability value " + err_prob);
//
//                ///NOTE: Could clear the hash to make the player more like it's brand new.
//                /// player.engine.send("setoption name Clear Hash");
//            }
//        }
//
//        function onchange() {
//            set_level(parseFloat(this.value));
//        }
//
//        player.set_level = set_level;
//
//        return onchange;
//    }

//    function time_from_str(str) {
//        var split,
//                mil = 0,
//                sec = 0,
//                min = 0,
//                hour = 0,
//                day = 0;
//
//        if (typeof str === "number") {
//            return str;
//        } else if (typeof str === "string") {
//            split = str.split(":");
//
//            if (split.length === 1) {
//                sec = split[0];
//            } else if (split.length === 2) {
//                min = split[0];
//                sec = split[1];
//            } else if (split.length === 3) {
//                hour = split[0];
//                min = split[1];
//                sec = split[2];
//            } else if (split.length > 3) {
//                day = split[0];
//                hour = split[1];
//                min = split[2];
//                sec = split[3];
//            }
//            split = sec.split(".");
//            if (split.length === 2) {
//                sec = split[0];
//                mil = split[1];
//                if (mil.length === 1) {
//                    mil *= 100;
//                } else if (mil.length === 2) {
//                    mil *= 10;
//                } else {
//                    /// It can't be greater than 999 (i.e., longer than 3 digits).
//                    mil = mil.substr(0, 3);
//                }
//            } else {
//                sec = String(Math.round(sec));
//            }
//
//            return Number(mil) + (sec * 1000) + (min * 1000 * 60) + (hour * 1000 * 60 * 60) + (day * 1000 * 60 * 60 * 24);
//        }
//    }

//    function make_set_time_type(player) {
//        function set_time_type(type) {
//            if (type !== "none" && type !== "sd") {
//                type = "none";
//            }
//
//            change_selected(player.els.time_type, type);
//
//            if (player.time_type !== type) {
//                player.time_type = type;
//
//                if (type === "sd") {
//                    player.els.sd_container.style.display = "block";
//                    player.set_sd_time();
//                } else {
//                    player.els.sd_container.style.display = "none";
//                    player.time = "";
//                    player.start_time = "";
//                    clock_manager.clear(player.color);
//                }
//                /// This is faster than comparing a string.
//                player.has_time = type !== "none";
//            }
//
//            /// The moves box may need to be resized too.
//            if (moves_manager) {
//                moves_manager.resize();
//            }
//        }
//
//        function onchange() {
//            set_time_type(this.value);
//        }
//
//        player.set_time_type = set_time_type;
//
//        return onchange;
//    }

//    function make_set_sd_time(player) {
//        function set_sd_time(time) {
//            clock_manager.set_time(player.color, "sd", {time: time});
//        }
//
//        function onchange() {
//            set_sd_time(this.value);
//        }
//
//        player.set_sd_time = set_sd_time;
//
//        return onchange;
//    }
//
//    function add_player_els(el, player) {
//        var level_el = G.cde("select", null, {all_on_changes: make_set_level(player), c: "form-control"}, [
//            G.cde("option", {t: 0, value: 0, selected: player.level === 0}),
//            G.cde("option", {t: 1, value: 1, selected: player.level === 1}),
//            G.cde("option", {t: 2, value: 2, selected: player.level === 2}),
//            G.cde("option", {t: 3, value: 3, selected: player.level === 3}),
//            G.cde("option", {t: 4, value: 4, selected: player.level === 4}),
//            G.cde("option", {t: 5, value: 5, selected: player.level === 5}),
//            G.cde("option", {t: 6, value: 6, selected: player.level === 6}),
//            G.cde("option", {t: 7, value: 7, selected: player.level === 7}),
//            G.cde("option", {t: 8, value: 8, selected: player.level === 8}),
//            G.cde("option", {t: 9, value: 9, selected: player.level === 9}),
//            G.cde("option", {t: 10, value: 10, selected: player.level === 10}),
//            G.cde("option", {t: 11, value: 11, selected: player.level === 11}),
//            G.cde("option", {t: 12, value: 12, selected: player.level === 12}),
//            G.cde("option", {t: 13, value: 13, selected: player.level === 13}),
//            G.cde("option", {t: 14, value: 14, selected: player.level === 14}),
//            G.cde("option", {t: 15, value: 15, selected: player.level === 15}),
//            G.cde("option", {t: 16, value: 16, selected: player.level === 16}),
//            G.cde("option", {t: 17, value: 17, selected: player.level === 17}),
//            G.cde("option", {t: 18, value: 18, selected: player.level === 18}),
//            G.cde("option", {t: 19, value: 19, selected: player.level === 19}),
//            G.cde("option", {t: 20, value: 20, selected: player.level === 20}),
//        ]);
//
//        var type_el = G.cde("select", null, {all_on_changes: make_type_change(player), c: "form-control"}, [
//            G.cde("option", {t: "Human", value: "human", selected: player.type === "human"}),
//            G.cde("option", {t: "Computer", value: "ai", selected: player.type === "ai"}),
//        ]);
//
//        ///
//        /// Time
//        ///
//        var time_container = G.cde("div");
//        var sd_container = G.cde("div");
//
//        if (!player.time) {
//            player.time = {};
//        }
//
//        var time_type_el = G.cde("select", null, {all_on_changes: make_set_time_type(player), c: "form-control"}, [
//            G.cde("option", {t: "none", value: "none", selected: player.time.type === "none"}),
//            G.cde("option", {t: "Sudden Death", value: "sd", selected: player.time.type === "sd"}),
//        ]);
//
//        var sd_el = G.cde("input", {
//            c: "fixinput form-control",
//            type: "text",
//            value: player.time.sd || default_sd_time
//        }, {all_on_changes: make_set_sd_time(player)});
//
//        sd_container.appendChild(G.cde("", [
//            "Time: ",
//            sd_el,
//        ]));
//
//        time_container.appendChild(G.cde("", [
//            "Time type: ",
//            time_type_el,
//            sd_container,
//        ]));
//
//        ///
//        /// Add elements
//        ///
//
//        el.appendChild(type_el);
//        el.appendChild(level_el);
//        el.appendChild(time_container);
//
//        player.els = {
//            type: type_el,
//            level: level_el,
//            time_container: time_container,
//            time_type: time_type_el,
//            sd_container: sd_container,
//            sd: sd_el,
//        };
//    }

        function create_players() {
            board.players.w.level = 20;
            board.players.b.level = 20;

//        add_player_els(player1_el, board.players.w);
//        add_player_els(player2_el, board.players.b);
//
//        layout.rows[1].cells[0].appendChild(player1_el);
//        layout.rows[1].cells[2].appendChild(player2_el);

//        board.players.w.set_type("human");
//        board.players.b.set_type("ai");

            board.players['w'].type = "human";
            board.players['b'].type = "human";

//        board.players.w.set_time_type("none");
//        board.players.b.set_time_type("none");
        }

//        function create_center() {
//            new_game_el = G.cde("button", {t: "New Game"}, {click: start_new_game});
//            setup_game_el = G.cde("button", {t: "Setup Game"}, {click: init_setup});
//
//            center_el.appendChild(G.cde("documentFragment", [
//                //new_game_el,
//                //setup_game_el,
//            ]));
//        }

//    function make_clocks() {
//        var last_time,
//                tick_timer,
//                clock_els = {
//                    w: G.cde("div", {c: "clock clock_white clock_left"}),
//                    b: G.cde("div", {c: "clock clock_black clock_right"}),
//                },
//                clock_manager = {},
//                timer_on;
//
//        function tick(color) {
//            var now = Date.now(),
//                    diff,
//                    player = board.players[color || board.turn],
//                    legal_moves,
//                    message;
//
//            diff = now - last_time;
//            last_time = now;
//
//            if (player.has_time) {
//                player.time -= diff;
//                update_clock(player.color);
//                /// Has someone's time run out?
//                if (player.time < 0) {
//                    legal_moves = board.get_legal_moves();
//                    /// Also, make sure that the system has time to check to see if the game has already ended (either by checkmake or stalemate) by checking for legal moves.
//                    if (legal_moves && legal_moves.uci && legal_moves.uci.length && board.get_mode() === "play") {
//                        /// Stop player from moving.
//                        stop_game();
//                        /// Disable board play.
//                        pause_game();
//
//                        /// If the player with time is almost beaten (or the game is almost a stalemate) call it a stalemate.
//                        if (is_insufficient_material(player.color === "w" ? "b" : "w")) {
//                            message = "Stalemate: Player with time has insufficient material";
//                        } else {
//                            message = (player.color === "w" ? "White" : "Black") + " loses on time.";
//                        }
//                        board.create_modular_window({
//                            content: G.cde("div", {t: message}),
//                            cancelable: true,
//                            open: true,
//                        });
//                    }
//                }
//            }
//        }
//
//        function start_timer() {
//            var speed = 34;
//
//            if (G.mobile) {
//                speed = 234;
//            }
//
//            /// Don't start the timer if the game has not yet begun.
//            if (board.messy && !timer_on) {
//                last_time = Date.now();
//                tick_timer = setInterval(tick, speed);
//                timer_on = true;
//            }
//        }
//
//        function stop_timer() {
//            clearInterval(tick_timer);
//            timer_on = false;
//        }
//
//        function format_time(time, allow_neg) {
//            var sign = "",
//                    res,
//                    sec,
//                    min,
//                    hour,
//                    day;
//
//            time = parseFloat(time);
//
//            if (time < 0) {
//                if (allow_neg) {
//                    sign = "-";
//                    time = Math.abs(time);
//                } else {
//                    time = 0;
//                }
//            }
//
//            if (time < 10000) { /// Less than 10 sec
//                res = (time / 1000).toFixed(3); /// Show decimal
//            } else if (time < 60000) { /// Less than 1 minute
//                /// Always floor since we don't want to round to 60.
//                res = "0:" + Math.floor(time / 1000);
//            } else if (time < 3600000) { /// Less than 1 hour
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                min = Math.floor(time / 60000);
//                if (sec < 10) {
//                    sec = "0" + sec;
//                }
//                res = min + ":" + sec;
//            } else if (time < 86400000) { /// Less than 1 day
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                hour = Math.floor(time / 60000);
//                min = Math.floor(hour % 60);
//                hour = (hour - min) / 60;
//
//                if (sec < 10) {
//                    sec = "0" + sec;
//                }
//                if (min < 10) {
//                    min = "0" + min;
//                }
//
//                res = hour + ":" + min + ":" + sec;
//
//            } else { /// Days
//                ///NOTE: NaN is always falsey, so it will come here. We check this here so that we don't need to waste time checking eariler.
//                if (isNaN(time)) {
//                    return "Error";
//                }
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                hour = Math.floor(time / 60000);
//                min = Math.floor(hour % 60);
//                hour = (hour - min) / 60;
//                day = Math.floor(hour / 24);
//                hour = hour % 24;
//
//                if (sec < 10) {
//                    sec = "0" + sec;
//                }
//                if (min < 10) {
//                    min = "0" + min;
//                }
//                if (hour < 10) {
//                    hour = "0" + hour;
//                }
//
//                res = day + ":" + hour + ":" + min + ":" + sec;
//            }
//
//            return sign + res;
//        }
//
//        function update_clock(color) {
//            clock_els[color].textContent = format_time(board.players[color].time);
//        }
//
//        function reset_clock(color) {
//            var player = board.players[color];
//            delete player.last_move_time;
//            if (player.has_time) {
//                player.time = player.start_time;
//                player.move_start_time = player.start_time;
//                clock_manager.update_clock(player.color)
//            }
//        }
//
//        function set_start_time(player, time) {
//            player.start_time = time;
//            player.move_start_time = time;
//        }
//
//        function set_sd_time(color, time) {
//            var time_val,
//                    using_el,
//                    player = board.players[color];
//
//            if (typeof time === "undefined") {
//                time = player.els.sd.value;
//                using_el = true;
//            }
//
//            time_val = time_from_str(time);
//
//            if (!time_val && using_el) {
//                player.els.sd.value = default_sd_time;
//                time_val = time_from_str(default_sd_time);
//            }
//
//            if (time_val && time_val !== player.start_time) {
//                player.time = time_val;
//                set_start_time(player, time_val);
//                update_clock(color);
//            }
//        }
//
//        function set_time(color, type, options) {
//            options = options || {};
//
//            if (type === "sd") {
//                set_sd_time(color, options.time);
//            } else if (type === "none") {
//
//            }
//        }
//
//        clock_manager.reset_clocks = function () {
//            reset_clock("w");
//            reset_clock("b");
//        };
//
//        G.events.attach("board_turn_switch", function onswitch(e) {
//            var player;
//            if (timer_on) {
//                tick(e.last_turn);
//                player = board.players[e.last_turn];
//                player.last_move_time = player.move_start_time - player.time;
//                player.move_start_time = player.time;
//            }
//        });
//
//        layout.rows[1].cells[0].appendChild(clock_els.w);
//        layout.rows[1].cells[2].appendChild(clock_els.b);
//
//        G.events.attach("gameUnpaused", start_timer);
//        G.events.attach("firstMove", start_timer);
//        G.events.attach("gamePaused", stop_timer);
//
//        clock_manager.clock_els = clock_els;
//
//        clock_manager.update_clock = update_clock;
//
//        clock_manager.clear = function clear(color) {
//            if (clock_els[color]) {
//                clock_els[color].textContent = "--";
//                delete board.players[color].move_start_time;
//            }
//        };
//
//        clock_manager.start_timer = start_timer;
//        clock_manager.stop_timer = stop_timer;
//
//        clock_manager.set_time = set_time;
//
//        return clock_manager;
//    }
//    ;

        function make_rating_slider() {
//            var rating_container = G.cde("div", {c: "ratingContainer"});
            var slider_el = G.cde("div", {c: "ratingSlider"});
            var canvas = G.cde("canvas", {c: "ratingCanvas"});
            var obj = {max: 1000, min: -1000, value: 0};
            var ctx = canvas.getContext("2d");

            function calculate_slope() {
                /// m = change in y-value (y2 - y1)
                ///     change in x-value (x2 - x1)
                obj.m = (100 - 0) / (obj.min - obj.max);
            }

            function draw_marks() {
                var height = canvas.height,
                        width = canvas.width,
                        qrt_width,
                        pos,
                        median,
                        line_y,
                        font_size,
                        text;

                median = height / 2;
                /// Draw median.
                ctx.beginPath();
                ctx.lineWidth = height / 150;
                ctx.strokeStyle = "rgba(200,0,0,.9)";
                ctx.moveTo(0, median);
                ctx.lineTo(width, median);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = height / 500;
                ctx.fillStyle = ctx.strokeStyle = "rgba(128,128,128,.6)";
                ctx.textAlign = "center";
                qrt_width = width / 4;

                for (pos = ((obj.min + 1) - (obj.min + 1) % 100); pos < obj.max; pos += 100) {
                    if (pos !== 0) {
                        text = String(pos / 100);
                        font_size = font_fit.fit(text, {w: width / 2, h: width / 2});
                        ctx.font = font_size + "px " + rating_font_style;
                        line_y = median - ((pos / obj.max) * median);
                        ctx.moveTo(0, line_y);
                        ctx.lineTo(qrt_width, line_y);
                        ctx.moveTo(width - qrt_width, line_y);
                        ctx.lineTo(width, line_y);
                        ctx.fillText(text, width / 2 - 1, line_y + qrt_width / 2);
                    }
                }

                ctx.stroke();
            }

            calculate_slope();

            obj.resize = function () {
                rating_el.style.width = (board.el.clientWidth / 14) + "px";
                rating_el.style.height = board.board_details.width + "px";
                canvas.width = rating_el.clientWidth;
                canvas.height = rating_el.clientHeight;
                draw_marks();
            };

            obj.set_eval = function (value) {
                obj.value = Number(value);
                slider_el.style.height = ((obj.m * obj.value) + 50) + "%";
            };

            /// Set default.
            obj.set_eval(obj.value);

            rating_el.appendChild(canvas);

            rating_el.appendChild(slider_el);
            rating_el.style.float = 'left';
//            layout.center_cells[0].appendChild(container);

            if (ratingContainer) {
                showRating();
            } else {
                hideRating();
            }

            function showRating() {
                rating_el.style.display = "";
            }

            function hideRating() {
                rating_el.style.display = "none";
            }

            KingdomPGN.HideRatingContainer = hideRating;
            KingdomPGN.ShowRatingContainer = showRating;


            G.events.attach("eval", function oneval(e) {
                if (debugging) {
                    console.log(e);
                }

                /// Is this eval for the current position?
                if (e.ply === game_history.length - 1) {
                    if (e.type === "cp") {
                        obj.set_eval(e.score);
                    } else if (e.type === "mate") {
                        if (e.score === 0) {
                            obj.set_eval(e.turn === "w" ? -obj.max : obj.max);
                        } else {
                            obj.set_eval(e.score > 0 ? obj.max : -obj.max);
                        }
                    }
                }

                moves_manager.update_eval(e.ply, e.score, e.type, e.turn);
            });

            return obj;
        }
        ;

//    function clean_san(san) {
//        /// \u2011 is a non-breaking hyphen (useful for O-O-O).
//        return san.replace(/-/g, "\u2011");
//    }

        function make_moves_el() {
            var moves_el = G.cde("div", {c: "movesTable"}),
//                container_el = G.cde("div", {c: "movesTableContainer"}),
                    rows,
                    plys,
                    cur_row;
//                offset_height;

//        function format_move_time(time) {
//            var res,
//                    sec,
//                    min,
//                    hour,
//                    day;
//
//            time = parseFloat(time);
//
//            if (time < 0) {
//                time = 0;
//            }
//
//            if (time < 100) { /// Less than 1 sec
//                res = time + "ms";
//            } else if (time < 1000) { /// Less than 1 sec
//                res = ((Math.round(time / 100)) / 10) + "s";
//            } else if (time < 60000) { /// Less than 1 minute
//                res = Math.round(time / 1000) + "s";
//            } else if (time < 3600000) { /// Less than 1 hour
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                min = Math.floor(time / 60000);
//                res = min + "m" + sec + "s";
//            } else if (time < 86400000) { /// Less than 1 day
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                hour = Math.floor(time / 60000);
//                min = Math.floor(hour % 60);
//                hour = (hour - min) / 60;
//
//                res = hour + "h" + min + "m" + sec + "s";
//
//            } else { /// Days
//                ///NOTE: NaN is always falsey, so it will come here. We check this here so that we don't need to waste time checking eariler.
//                if (isNaN(time)) {
//                    return "Error";
//                }
//                /// Always floor since we don't want to round to 60.
//                sec = Math.floor((time % 60000) / 1000);
//                hour = Math.floor(time / 60000);
//                min = Math.floor(hour % 60);
//                hour = (hour - min) / 60;
//                day = Math.floor(hour / 24);
//                hour = hour % 24;
//
//                res = day + "d" + hour + "h" + min + "m" + sec + "s";
//            }
//
//            return res;
//        }

//        function add_move(color, san, time) {
//            // PGN part of the task
//            if (color == "w") {
//                moves_white.push(san);
//            } else {
//                moves_black.push(san);
//            }
//
//            var png_string = "";
//            if (moves_white.length == moves_black.length) {
//                for (var i = 0; i < moves_white.length; i++) {
//                    png_string += i + 1 + ". " + moves_white[i] + " " + moves_black[i] + " ";
//                }
//            }
//
//            // movenscore part of the task
//            var movenscore = '{"movenscore":{';
//            for (var i = 1; i < game_history.length - 1; i++) {
//                // ASK ABOUT THIS move+i, because it rewrites the data in JSON
//                var move_json = '"move' + i + '":{';
//                move_json += '"color":"' + game_history[i].color + '",';
//                move_json += '"eval_best_move":"' + game_history[i].eval_best_move + '",';
//                move_json += '"eval_score":"' + game_history[i].eval_score + '",';
//                move_json += '"move":"' + game_history[i].move + '"}';
//                if (game_history.length > 3 && game_history.length - 2 > i)
//                    movenscore += move_json + ',';
//                else {
//                    movenscore += move_json;
//                }
//            }
//            movenscore += "} }";
//            console.log(movenscore);
//            console.log(JSON.parse(movenscore));
//
//
//            //var movenscore = {};
//            //for (var i = 1; i < game_history.length - 1; i++) {
//            //    var move_json = {};
//            //    move_json.push({
//            //        color: game_history[i].color,
//            //        eval_best_move: game_history[i].eval_best_move,
//            //        eval_score: game_history[i].eval_score,
//            //        move: game_history[i].move
//            //    });
//            //    movenscore.push({move: move_json});
//            //}
//            //console.log(movenscore);
//            //alert(png_string);
//
//            var move_data = {
//                san: san,
//                color: color,
//                time: time,
//                san_el: G.cde("div", {
//                    c: "moveCell moveSAN move" + color + " moveRow" + (cur_row % 2 ? "Even" : "Odd"),
//                    t: clean_san(san)
//                }),
//                eval_el: G.cde("div", {
//                    c: "moveCell moveEval move" + color + " moveRow" + (cur_row % 2 ? "Even" : "Odd"),
//                    t: "\u00a0"
//                }), /// \u00a0 is &nbsp;
//                time_el: G.cde("div", {
//                    c: "moveCell moveTime move" + color + " moveRow" + (cur_row % 2 ? "Even" : "Odd"),
//                    t: typeof time === "number" ? format_move_time(time) : "\u00a0"
//                }),
//            },
//                    need_to_add_placeholders,
//                    scroll_pos;
//
//            /// Placeholders are necessary to keep the table columns the proper width. It's only needed to fill out the first row.
//            function add_placeholding_els() {
//                var placeholders = [],
//                        i,
//                        len = 3;
//
//                for (i = 0; i < len; i += 1) {
//                    ///NOTE: We make it moveSAN to make the ellipse bold.
//                    ///NOTE: Don't add ellipse on checkmate (unless we're adding the placeholder earlier (i.e., we're black)).
//                    placeholders[i] = G.cde("div", {
//                        c: "moveCell moveSAN move" + (color === "w" ? "b" : "w") + " moveRow" + (cur_row % 2 ? "Even" : "Odd"),
//                        t: i === 0 && (color === "b" || san.slice(-1) !== "#") ? "\u2026" : "\u00a0"
//                    }); /// \u2026 is ellipse; \u00a0 is non-breaking space.
//                    rows[cur_row].row_el.appendChild(placeholders[i]);
//                }
//
//                rows[cur_row].placeholders = placeholders;
//            }
//
//            if (!rows[cur_row]) {
//                rows[cur_row] = {
//                    w: {},
//                    b: {},
//                    row_el: G.cde("div", {c: "moveRow"})
//                };
//                rows[cur_row].row_el.appendChild(G.cde("div", {
//                    c: "moveNumCell moveRow" + (cur_row % 2 ? "Even" : "Odd"),
//                    t: (cur_row + 1)
//                }));
//                moves_el.appendChild(rows[cur_row].row_el);
//                need_to_add_placeholders = plys.length === 0;
//            } else if (rows[cur_row].placeholders) {
//                rows[cur_row].placeholders.forEach(function (el) {
//                    if (el && el.parentNode) {
//                        el.parentNode.removeChild(el);
//                    }
//                });
//                delete rows[cur_row].placeholders;
//            }
//
//            if (need_to_add_placeholders && color === "b") {
//                add_placeholding_els();
//                need_to_add_placeholders = false;
//            }
//
//            rows[cur_row].row_el.appendChild(move_data.san_el);
//            rows[cur_row].row_el.appendChild(move_data.eval_el);
//            rows[cur_row].row_el.appendChild(move_data.time_el);
//
//            if (color === "w") {
//                add_placeholding_els();
//            }
//
//            rows[cur_row][color] = move_data;
//            plys.push(move_data);
//
//            if (color === "b") {
//                cur_row += 1;
//            }
//
//            scroll_pos = container_el.scrollHeight - offset_height;
//
//            /// Scroll to the bottom to reveal new move (if necessary).
//            if (scroll_pos) {
//                container_el.scrollTop = scroll_pos;
//            }
//        }

            function update_eval(ply, score, type, turn) {
                var move_data = plys[ply - 1],
                        display_score;

                if (type === "cp") {
                    display_score = (score / 100).toFixed(2);
                } else if (score === 0) {
                    if (turn === "w") {
                        display_score = "0-1";
                    } else {
                        display_score = "1-0";
                    }
                } else {
                    display_score = "#" + score;
                }

                if (move_data) {
                    move_data.eval_el.textContent = display_score;
                }
            }

            function reset_moves() {
                moves_el.innerHTML = "";
                cur_row = 0;
                rows = [];
                plys = [];
            }

//        function resize() {
////            var this_box = container_el.getBoundingClientRect(),
////                    cell_box,
////                    old_display = container_el.style.display;
////
////            ///NOTE: We need to hide this for a moment to see what the height of the cell should be.
////            container_el.style.display = "none";
////            cell_box = layout.rows[1].cells[2].getBoundingClientRect();
////            container_el.style.display = old_display;
////
////            container_el.style.height = (cell_box.height - this_box.top) + "px";
////
////            offset_height = container_el.offsetHeight;
//        }

            moves_manager = {
//            add_move: add_move,
                update_eval: update_eval
//            resize: resize,
            };

//        layout.rows[1].cells[0].appendChild(container_el);
//        container_el.appendChild(moves_el);

            G.events.attach("newGameBegins", reset_moves);

            reset_moves();
        }

        function hide_loading(do_not_start) {
            if (typeof board.close_modular_window === "function") {
                board.close_modular_window();
            }
            showing_loading = false;

            if (!do_not_start) {
                board.play();
                G.events.trigger("gameUnpaused");
            }
        }

        function show_loading() {
            if (typeof board.close_modular_window === "function") {
                board.close_modular_window();
            }
            if (!showing_loading) {
                showing_loading = true;
                pause_game();
            }
        }

//        function create_table() {
//            var table_info = [3, 3, 3];
//
//            layout.table = G.cde("div");
//            layout.rows = [];
//
//            table_info.forEach(function oneach(count, row) {
//                var i;
//
//                layout.rows[row] = {
//                    cells: [],
//                };
//                for (i = 0; i < count; i += 1) {
//                    var className;
//                    if (i === 1) {
//                        className = "col-md-6";
//                    } else {
//                        className = "col-md-3";
//                    }
//                    layout.rows[row].cells[i] = G.cde("div", {c: className});
//                }
//                layout.rows[row].el = G.cde("div", {c: "row"}, layout.rows[row].cells);
//                layout.table.appendChild(layout.rows[row].el);
//            });
//            layout.rows[1].cells[1].id = "chess-board";
//
//            layout.center_cells = [
//                G.cde("div", {c: "td center_td"}),
//                G.cde("div", {c: "td center_td"}),
//            ];
//            layout.center_cells[0].align = "right";
//            layout.center_cells[1].align = "left";
//            layout.center_row = G.cde("div", {c: "tr center_tr"}, layout.center_cells);
//            layout.center_table = G.cde("div", {c: "table center_table"}, [layout.center_row]);
//            layout.rows[1].cells[1].appendChild(layout.center_table);
//        }

        function init() {
            if (typeof Worker === "undefined") {
                return alert("Sorry, Kingdom does not support this browser.");
            }

//            create_table();
            document.getElementById(id).appendChild(rating_el);
            document.getElementById(id).appendChild(board_el);


//document.getElementById('board').appendChild(layout.table);
//            layout.center_cells[1].appendChild(board_el);
//        $(idClass).append(board_el);

//        clock_manager = make_clocks();

            rating_slider = make_rating_slider();

            window.addEventListener("resize", onresize);

            show_loading();

            create_players();

//            create_center();

            make_moves_el();

            onresize();

            board.onmove = on_human_move;
            board.reset = start_new_game;

            evaler = load_engine();

            evaler.send("uci", function onuci(str) {
                evaler.send("isready", function onready() {
                    if (board.get_mode() === "wait") {
                        start_new_game(board.fen);
                    }
                });
            });
        }


        window.addEventListener("keydown", function catch_key(e) {
            if (e.keyCode === 113) { /// F2
                start_new_game();
            }
        });

        G.events.attach("move", function onmove(e) {
            var ply = game_history.length,
                    color;

            if (!pieces_moved) {
                G.events.trigger("firstMove");
                pieces_moved = true;
            }

            /// player.last_move_time
            ///NOTE: board.turn has already switched.
            color = board.turn === "b" ? "w" : "b";
            game_history[ply] = {move: e.uci, ponder: e.ponder, turn: board.turn, pos: cur_pos_cmd, color: color};

            if (board.players[color].has_time) {
                game_history[ply].move_time = board.players[color].last_move_time;
            }
            prep_eval(cur_pos_cmd, ply);
//        moves_manager.add_move(color, e.san, game_history[ply].move_time);
            var offset = $('.chess_board').offset();
            $('#canvas').offset(offset);
        });
        init();
        return board;
    }
    ;

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


        (function (options) {
            function mask(str) {
                return str.replace(/\\/g, '\\');
            }

            /* convert a move from Standard Algebraic Notation (SAN) to 0x88
             * coordinates
             */
            function move_from_san(move) {
                /* strip off any move decorations: e.g Nf3+?! */
                var moveReplaced = move.replace(/[+#?!=]/, '');
                var moves = generate_moves();
                for (var i = 0, len = moves.length; i < len; i++) {
                    if (moveReplaced ==
                            move_to_san(moves[i]).replace(/[+#?!=]/, '')) {
                        var uci = algebraic(moves[i].from) + algebraic(moves[i].to);
                        uciList.push(uci);
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
                    return;
                } else {
                    make_move(move);
                    KingdomPGN.FEN.push(generate_fen());
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
                    return;
                } else {
                    make_move(move);
                    KingdomPGN.FEN.push(generate_fen());
                }
            }
            return uci_list;
        }());


    }
    ;
}());