var board;
(function ()
{

    "use strict";

	var debug=false;

    var evaler;
    var startpos;
    var debugging = false;
    var legal_move_engine;
    var eval_depth = 8;

    function error(str)
    {
        str = str || "Unknown error";

        alert("An error occured.\n" + str);
        throw new Error(str);
    }

    function load_engine()
    {
        var worker = new Worker("/javascripts/stockfish6.js"),
            engine = {started: Date.now()},
            que = [];

        function get_first_word(line)
        {
            var space_index = line.indexOf(" ");

            /// If there are no spaces, send the whole line.
            if (space_index === -1) {
                return line;
            }
            return line.substr(0, space_index);
        }

        function determine_que_num(line, que)
        {
            var cmd_type,
                first_word = get_first_word(line),
                cmd_first_word,
                i,
                len;

            if (first_word === "uciok" || first_word === "option") {
                cmd_type = "uci"
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

        worker.onmessage = function (e)
        {
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

        engine.send = function send(cmd, cb, stream)
        {
            cmd = String(cmd).trim();
            console.log(cmd);
            console.log(cb);
            console.log(stream);

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
            if (cmd !== "ucinewgame" && cmd !== "flip" && cmd !== "stop" && cmd !== "ponderhit" && cmd.substr(0, 8) !== "position"  && cmd.substr(0, 9) !== "setoption") {
                que[que.length] = {
                    cmd: cmd,
                    cb: cb,
                    stream: stream
                };
            }
            worker.postMessage(cmd);
        };

        engine.stop_moves = function stop_moves()
        {
            var i,
                len = que.length;

            for (i = 0; i < len; i += 1) {
                if (debugging) {
                    console.log(i, get_first_word(que[i].cmd))
                }
                /// We found a move that has not been stopped yet.
                if (get_first_word(que[i].cmd) === "go" && !que[i].discard) {
                    engine.send("stop");
                    que[i].discard = true;
                }
            }
        }

        engine.get_cue_len = function get_cue_len()
        {
            return que.length;
        }

        return engine;
    }


    function init()
    {

        evaler = load_engine();

        evaler.send("uci", function onuci(str)
        {
            evaler.send("isready", function onready()
            {
                if (board.get_mode() === "wait") {
                    start_new_game(board.fen);
                }
            });
        });
    }

    init();
}());
