/* exported BOARD */

function removeClass(el, className) {
    return el.replace(className, "");
}

var BOARD = function board_init(el, options) {
    "use strict";
    var board,
            board_details = {
                ranks: 8,
                files: 8,
            },
            squares,
            hover_squares,
            pos,
            colors = ["blue", "red", "green", "yellow", "teal", "orange", "purple", "pink"],
            ///NOTE: These should match the CSS.
            rgba = ["rgba(0, 0, 240, .6)", "rgba(240, 0, 0, .6)", "rgba(0, 240, 0, .6)", "rgba(240, 240, 0, .6)", "rgba(0, 240, 240, .6)", "rgba(240, 120, 0, .6)", "rgba(120, 0, 120, .6)", "rgba(240, 0, 240, .6)"],
            cur_color = 0,
            capturing_clicks,
            legal_moves,
            arrow_manager,
            dragging_arrow = {},
            mode = "setup",
            orientation = "white";
    function num_to_alpha(num) {
        return "abcdefgh"[num];
    }

    function error(str) {
        str = str || "Unknown error";
        alert("An error occured.\n" + str);
        throw new Error(str);
    }

    function check_el(el) {
        if (typeof el === "string") {
            return document.getElementById(el);
        }
        return el;
    }

    function get_init_pos() {
///NOTE: I made this a function so that we could pass other arguments, like chess varients.
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        //return "6R1/1pp5/5k2/p1b4r/P1P2p2/1P5r/4R2P/7K w - - 0 39";
    }

    function remove_square_focus(x, y) {
        if (squares[y][x].focus_color) {
            squares[y][x].className = removeClass(squares[y][x].className, "focus_square_" + squares[y][x].focus_color);
            squares[y][x].className = removeClass(squares[y][x].className, "focusSquare");
            delete squares[y][x].focus_color;
        }
    }

    function focus_square(x, y, color) {
        remove_square_focus(x, y);
        if (color && colors.indexOf(color) > -1) {
            squares[y][x].focus_color = color;
            squares[y][x].className += " focus_square_" + color;
            squares[y][x].className += " focusSquare";
        }
    }

    function clear_focuses() {
        delete board.clicked_piece;
        squares.forEach(function oneach(file, y) {
            file.forEach(function oneach(sq, x) {
                remove_square_focus(x, y);
            });
        });
    }

    function remove_highlight(x, y) {
        if (hover_squares[y][x].highlight_color) {
            hover_squares[y][x].className = removeClass(hover_squares[y][x].className, hover_squares[y][x].highlight_color);
            delete hover_squares[y][x].highlight_color;
        }
    }

    function highlight_square(x, y, color) {
        remove_highlight(x, y);
        if (color && colors.indexOf(color) > -1) {
            hover_squares[y][x].highlight_color = color;
            hover_squares[y][x].className += " " + color;
        }
    }

    function clear_highlights() {
        hover_squares.forEach(function oneach(file, y) {
            file.forEach(function oneach(sq, x) {
                remove_highlight(x, y);
            });
        });
    }

    /**
     * Ctrl click to set/remove colors.
     * Ctrl Left/Right to change colors.
     * Ctrl Non-left click to (only/always) remove colors.
     * Ctrl Space to clear board of highlights.
     */
    function hover_square_click_maker(x, y) {
        return function (e) {
            var new_color,
                    square;
            if (e.ctrlKey) {
                if (!dragging_arrow.drew_arrow) {
/// Highlight the sqaure.
                    new_color = colors[cur_color];
                    if (is_left_click(e)) {
                        if (hover_squares[y][x].highlight_color === new_color) {
                            remove_highlight(x, y);
                        } else {
                            highlight_square(x, y, new_color);
                        }
                    } else {
                        remove_highlight(x, y);
                        e.preventDefault();
                    }
                }
            } else if (board.clicked_piece) {
///TODO: Make sure the move is valid.
/// Move to the square.
                square = {rank: y, file: x};
                make_move(board.clicked_piece.piece, square, get_move(board.clicked_piece.piece, square), is_promoting(board.clicked_piece.piece, square));
            }
        };
    }

    function arrow_start_maker(rank, file) {
        return function (e) {
            if (e.ctrlKey) {
                dragging_arrow.drew_arrow = false;
                dragging_arrow.start_square = {rank: rank, file: file};
            }
        };
    }

    function arrow_move_maker(rank, file) {
        function finish_arrow() {
            delete dragging_arrow.start_square;
            delete dragging_arrow.cur_square;
            delete dragging_arrow.number;
        }

        return function (e) {
            if (dragging_arrow.start_square) {
                if (G.normalize_mouse_buttons(e) === 1) {
                    if (!dragging_arrow.cur_square || rank !== dragging_arrow.cur_square.rank || file !== dragging_arrow.cur_square.file) {
                        if (typeof dragging_arrow.number === "number") {
                            arrow_manager.delete_arrow(dragging_arrow.number);
                            delete dragging_arrow.cur_square;
                        }
                        if (dragging_arrow.start_square.rank !== rank || dragging_arrow.start_square.file !== file) {
                            dragging_arrow.number = arrow_manager.draw(dragging_arrow.start_square.rank, dragging_arrow.start_square.file, rank, file, rgba[cur_color])
                            dragging_arrow.cur_square = {rank: rank, file: file};
                            dragging_arrow.drew_arrow = true;
                        }
                    }
                    if (e.type === "mouseup") {
                        finish_arrow();
                    }
                } else {
                    finish_arrow();
                }
            }
        };
    }

    function make_hover_square(x, y) {
        var el = document.createElement("div");
        el.style.height = board_details.height / 8 + "px";

        el.className += " hoverSquare";
        el.className += " rank" + y;
        el.className += " file" + x;
        el.addEventListener("click", hover_square_click_maker(x, y));
        el.addEventListener("mousedown", arrow_start_maker(y, x));
        el.addEventListener("mousemove", arrow_move_maker(y, x));
        el.addEventListener("mouseup", arrow_move_maker(y, x));
        return el;
    }


    function get_rank_file_from_str(str) {
        return {rank: str[1] - 1, file: str.charCodeAt(0) - 97};
    }

    function remove_dot(x, y) {
        if (hover_squares[y][x].dot_color) {
            hover_squares[y][x].className = removeClass(hover_squares[y][x].className, "dot_square_" + hover_squares[y][x].dot_color);
            hover_squares[y][x].className = removeClass(hover_squares[y][x].className, "dotSquare");
            delete hover_squares[y][x].dot_color;
        }
    }

    function clear_dots() {
        hover_squares.forEach(function oneach(file, y) {
            file.forEach(function oneach(sq, x) {
                remove_dot(x, y);
            });
        });
    }

    function add_dot(x, y, color) {
        remove_dot(x, y);
        if (color && colors.indexOf(color) > -1) {
            hover_squares[y][x].dot_color = color;
            hover_squares[y][x].className += " dot_square_" + color;
            hover_squares[y][x].className += " dotSquare";
        }
    }

    function add_clickabe_square(move_data) {
        if (board.clicked_piece) {
            if (!board.clicked_piece.clickable_squares) {
                board.clicked_piece.clickable_squares = [];
            }
            board.clicked_piece.clickable_squares.push(move_data);
        }
    }

    function get_piece_start_square(piece) {
        return get_file_letter(piece.file) + (piece.rank + 1);
    }

    function show_legal_moves(piece) {
        var start_sq = get_piece_start_square(piece);
        if (legal_moves && legal_moves.uci) {
            legal_moves.uci.forEach(function oneach(move, i) {
                var move_data,
                        color;
                if (move.indexOf(start_sq) === 0) {
                    move_data = get_rank_file_from_str(move.substr(2));
                    ///NOTE: We can't use get_piece_from_rank_file(move_data.rank, move_data.file) because it won't find en passant.
                    if (legal_moves.san[i].indexOf("x") === -1) {
                        color = "green";
                    } else {
                        color = "red";
                    }
                    add_dot(move_data.file, move_data.rank, color);
                    add_clickabe_square(move_data);
                }
            });
        }
    }

    function make_square(x, y) {
        var el = document.createElement("div");
        el.className += " square";
        el.className += " rank" + y;
        el.className += " file" + x;
        if ((x + y) % 2) {
            el.className += " light";
        } else {
            el.className += " dark";
        }

        return el;
    }

    function make_rank(num) {
        var el = document.createElement("div");
        el.className += " rank";
        el.className += " rank" + num;
        return el;
    }

    function size_board(w, h) {
        board_details.width = parseFloat(w);
        board_details.height = parseFloat(h);
        board.el.style.width = board_details.width + "px";
        board.el.style.height = board_details.height + "px";
        G.events.trigger("board_resize", {w: w, h: h});
    }

    function make_board_num(num) {
        var el = document.createElement("div");
        el.className += " notation";
        el.className += " num";
        el.textContent = num + 1;
        return el;
    }

    function get_file_letter(num) {
        return String.fromCharCode(97 + num);
    }

    function make_board_letter(num) {
        var el = document.createElement("div");
        el.className += " notation";
        el.className += " letter";
        el.textContent = get_file_letter(num);
        return el;
    }

    function switch_turn() {
        var last_turn = board.turn;
        if (board.turn === "w") {
            board.turn = "b";
        } else {
            board.turn = "w";
        }
        G.events.trigger("board_turn_switch", {turn: board.turn, last_turn: last_turn});
    }

    function create_board(el, dim) {
        var x,
                y,
                cur_rank;
        if (el) {
            board.el = check_el(el);
        }

        board.el.innerHTML = "";
        /// Prevent I beam cursor.
        board.el.addEventListener("mousedown", function onboard_mouse_down(e) {
            e.preventDefault();
        });
        if (dim) {
            size_board(dim.w, dim.h);
        } else {
            size_board(600, 600);
        }

        squares = [];
        hover_squares = [];
        for (y = board_details.ranks - 1; y >= 0; y -= 1) {
            squares[y] = [];
            hover_squares[y] = [];
            for (x = 0; x < board_details.files; x += 1) {
                squares[y][x] = make_square(x, y);
                hover_squares[y][x] = make_hover_square(x, y);
                if (x === 0) {
                    cur_rank = make_rank(y);
                    board.el.appendChild(cur_rank);
                    squares[y][x].appendChild(make_board_num(y));
                }
                if (y === 0) {
                    squares[y][x].appendChild(make_board_letter(x));
                }
                squares[y][x].appendChild(hover_squares[y][x]);
                cur_rank.appendChild(squares[y][x]);
            }
        }

        board.el.className += " chess_board";
        return board;
    }

    function load_pieces_from_start(fen) {
        var fen_pieces = fen.match(/^\S+/),
                rank = 7,
                file = 0,
                id = 0,
                piece_count = 0,
                create_pieces;
        if (fen !== board.fen) {
            create_pieces = true;
            if (board.pieces) {
                board.pieces.forEach(function oneach(piece) {
                    if (piece.el && piece.el.parentNode) {
                        piece.el.parentNode.removeChild(piece.el);
                    }

                });
            }
            board.pieces = [];
        }
        board.fen = fen;
        if (!fen_pieces) {
            error("Bad position: " + pos);
        }

        fen_pieces[0].split("").forEach(function oneach(letter) {
            var piece;
            if (letter === "/") {
                rank -= 1;
                file = 0;
            } else if (/\d/.test(letter)) {
                file += parseInt(letter, 10);
            } else { /// It's a piece.
                if (create_pieces) {
                    piece = {};
                    /// Is it white?
                    if (/[A-Z]/.test(letter)) {
                        piece.color = "w";
                    } else {
                        piece.color = "b";
                    }
                    piece.id = id;
                    board.pieces[piece_count] = piece;
                }

/// We do, however, always need to set the starting rank and file.
                board.pieces[piece_count].rank = rank;
                board.pieces[piece_count].file = file;
                /// We also need to set the type, in case it was a pawn that promoted.
                board.pieces[piece_count].type = letter.toLowerCase();
                file += 1;
                id += 1;
                piece_count += 1;
            }
        });
    }

    function is_piece_moveable(piece) {
        return board.get_mode() === "setup" || (board.get_mode() === "play" && board.turn === piece.color && board.players[board.turn].type === "human");
    }

    function is_left_click(e) {
        return (e.which || (e || window.event).button) === 1;
    }

    function fix_touch_event(e) {
        if (e.changedTouches && e.changedTouches[0]) {
            e.clientX = e.changedTouches[0].pageX;
            e.clientY = e.changedTouches[0].pageY;
        }
    }

    function focus_piece_for_moving(piece) {
        board.clicked_piece = {piece: piece};
        focus_square(piece.file, piece.rank, "green");
        show_legal_moves(piece);
    }

    function add_piece_events(piece) {
        function onpiece_mouse_down(e) {
///TODO: Test and make sure it works on touch devices.
            if ((e.type === "touchstart" || is_left_click(e)) && is_piece_moveable(piece)) {
                fix_touch_event(e);
                board.dragging = {};
                board.dragging.piece = piece;
                board.dragging.origin = {x: e.clientX, y: e.clientY};
                board.dragging.box = piece.el.getBoundingClientRect();
                board.el.className += " dragging";
                board.dragging.piece.el.className += " dragging";
            }
            if (e.preventDefault) {
/// Prevent the cursor from becoming an I beam.
                e.preventDefault();
            }

            if (board.get_mode() === "play") {
                if (board.clicked_piece && board.clicked_piece.piece) {
                    remove_square_focus(board.clicked_piece.piece.file, board.clicked_piece.piece.rank);
                    clear_dots();
                    /// If the king was previously selected, we want to refocus it.
                    if (board.checked_king) {
                        focus_square(board.checked_king.file, board.checked_king.rank, "red");
                    }
                }

                if (is_piece_moveable(piece)) {
                    focus_piece_for_moving(piece);
                }
            }
        }

        piece.el.addEventListener("mousedown", onpiece_mouse_down);
        piece.el.addEventListener("touchstart", onpiece_mouse_down);
    }

    function prefix_css(el, prop, value) {
        el.style[prop] = value;
        el.style["Webkit" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["O" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["MS" + prop[0].toUpperCase() + prop.substr(1)] = value;
        el.style["Moz" + prop[0].toUpperCase() + prop.substr(1)] = value;
    }

    function onmousemove(e) {
/// If the user held the ctrl button and then clicked off of the browser, it will still be marked as capturing. We remove that here.
        if (capturing_clicks && !e.ctrlKey) {
            stop_capturing_clicks();
        }
        if (board.dragging && board.dragging.piece) {
            fix_touch_event(e);
            var rotate = "";
            if (orientation === "black") {
                rotate = "rotate(180deg)";
                prefix_css(board.dragging.piece.el, "transform", "translate(" + -(e.clientX - board.dragging.origin.x) + "px," + -(e.clientY - board.dragging.origin.y) + "px) " + rotate);
            } else {
                prefix_css(board.dragging.piece.el, "transform", "translate(" + (e.clientX - board.dragging.origin.x) + "px," + (e.clientY - board.dragging.origin.y) + "px) ");
            }
        }
    }

    function get_dragging_hovering_square(e) {
        fix_touch_event(e);
        var el,
                match,
                square = {},
                rank_m,
                file_m,
                /// Use the position of the middle of the piece being dragged, not necessarily the mouse cursor.
                x = e.clientX + ((board.dragging.box.left + Math.round(board.dragging.box.width / 2)) - board.dragging.origin.x),
                y = e.clientY + ((board.dragging.box.top + Math.round(board.dragging.box.height / 2)) - board.dragging.origin.y);
        el = document.elementFromPoint(x, y);
        if (el && el.className && el.className.indexOf("square") > -1 || el.className.indexOf("hoverSquare") > -1) {
            rank_m = el.className.match(/rank(\d+)/);
            file_m = el.className.match(/file(\d+)/);
            if (rank_m) {
                square.rank = parseInt(rank_m[1], 10);
            }
            if (file_m) {
                square.file = parseInt(file_m[1], 10);
            }
        }
        if (!isNaN(square.rank) && !isNaN(square.file)) {
            square.el = el;
            return square;
        }

    }

    function is_legal_move(uci) {
        if (!legal_moves || !legal_moves.uci) {
            return false;
        }

        return legal_moves.uci.indexOf(uci) > -1;
    }

    function get_move(starting, ending) {
        var str;
        if (starting && ending) {
            str = get_file_letter(starting.file) + (parseInt(starting.rank, 10) + 1) + get_file_letter(ending.file) + (parseInt(ending.rank, 10) + 1);
            if (is_promoting(starting, ending)) {
                str += "q"; /// We just add something to make sure it's a legal move. We'll ask the user later what he actually wants to promote to.
            }
        }
        return str;
    }

    function create_promotion_icon(which, piece, cb) {
        var icon = document.createElement("div");
        icon.addEventListener("click", function onclick() {
            cb(which);
        });
        /// In play mode, we can go with the color; in setup mode, we need to get the color from the piece.
        icon.style.backgroundImage = get_piece_img({
            color: board.get_mode() === "play" ? board.turn : piece.color,
            type: which
        });
        icon.className += " promotion_icon";
        return icon;
    }

    function create_modular_window(options) {
        var mod_win = G.cde("div", {c: "board_modular_window"}),
                old_mode,
                modular_mode = "waiting_for_modular_window";
        function close_window() {
            delete board.close_modular_window;
            document.body.removeChild(mod_win);
            if (!options.dont_change_mode && board.get_mode() === modular_mode) {
                board.set_mode(old_mode);
            }
            window.removeEventListener("keydown", listen_for_close);
        }

        function open_window() {
            if (board.close_modular_window) {
                return setTimeout(open_window, 200);
            }
            board.close_modular_window = close_window;
            document.body.appendChild(mod_win);
            if (!options.dont_change_mode) {
                old_mode = board.get_mode();
                board.set_mode(modular_mode);
            }
        }

        function listen_for_close(e) {
            if (e.keyCode === 27) { /// escape
                close_window();
            }
        }

        function add_x() {
            mod_win.appendChild(G.cde("div", {t: "X", c: "xButton"}, {click: close_window}));
        }

        if (options) {
            if (options.content) {
                if (typeof options.content === "object") {
                    mod_win.appendChild(options.content);
                } else {
                    mod_win.innerHTML = options.content;
                }
            }
            if (options.cancelable) {
                window.addEventListener("keydown", listen_for_close);
                add_x();
            }
            if (options.open) {
                open_window();
            }
        } else {
            options = {};
        }

        return {
            close: close_window,
            open: open_window,
            el: mod_win,
        }
    }

    function promotion_prompt(piece, cb) {
        var modular_window = create_modular_window();
        function onselect(which) {
            modular_window.close();
            cb(which);
        }

        modular_window.el.appendChild(G.cde("div", {t: "Promote to", c: "promotion_text"}));
        modular_window.el.appendChild(create_promotion_icon("q", piece, onselect));
        modular_window.el.appendChild(create_promotion_icon("r", piece, onselect));
        modular_window.el.appendChild(create_promotion_icon("b", piece, onselect));
        modular_window.el.appendChild(create_promotion_icon("n", piece, onselect));
        modular_window.open();
    }

    function report_move(uci, promoting, piece, cb) {
/// We make it async because of promotion.
        function record() {
            var san = get_san(uci);
            legal_moves = null;
            if (board.get_mode() === "play" && board.onmove) {
                track_move(uci);
                board.onmove(uci, san);
            }

            if (cb) {
                cb(uci);
            }
        }

        if (promoting) {
            promotion_prompt(piece, function onres(answer) {
///NOTE: The uci move already includes a promotion to queen to make it a valid move. We need to remove this and replace it with the desired promotion.
                uci = uci.substr(0, 4) + answer;
                record();
            });
        } else {
            setTimeout(record, 10);
        }
    }

    function set_piece_pos(piece, square) {
        if (!piece || !piece.el || !piece.el.style || !square) {
            return;
        }

        var chessBoardHeight = $('.chess_board').height() / 8;
        piece.el.style.width = chessBoardHeight + "px";
        piece.el.style.height = chessBoardHeight + "px";
        piece.el.style.marginTop = -(square.rank * 100) + "%";
        piece.el.style.marginBottom = (square.rank * 100) + "%";

        piece.el.style.left = (square.file * 100) + "%";
        piece.el.style.right = -(square.file * 100) + "%";
        piece.rank = square.rank;
        piece.file = square.file;
    }

    function get_san(uci) {
        if (!legal_moves || !legal_moves.uci || !legal_moves.san) {
            return;
        }

        return legal_moves.san[legal_moves.uci.indexOf(uci)];
    }

    function get_uci(san) {
        return legal_moves.uci[legal_moves.san.indexOf(san)];
    }


    function set_image(piece) {
        var img = get_piece_img(piece);
        /// Don't set it if it's the same.
        if (piece.backgroundImage !== img) {
            piece.backgroundImage = img;
            piece.el.style.backgroundImage = img;
        }
    }

    function promote_piece(piece, uci) {
        if (piece && uci.length === 5 && /[qrbn]/.test(uci[4])) {
            piece.type = uci[4];
            set_image(piece);
        }
    }

    function mark_ep(uci) {
        var index

        if (!legal_moves || !legal_moves.uci || !legal_moves.san) {
            return;
        }

        index = legal_moves.uci.indexOf(uci);
        if (legal_moves.san[index].indexOf("e.p.") === -1 && legal_moves.san[index].indexOf("(ep)") === -1) {
/// Add the notation after the move notation but before check(mate) symbol.
///NOTE: A pawn could check(mate) and en passant at the same time, but not promote.
            legal_moves.san[index] = legal_moves.san[index].substr(0, 4) + "e.p." + legal_moves.san[index].substr(4);
        }
    }

    function move_piece(piece, square, uci) {
        var captured_piece,
                rook,
                san = get_san(uci),
                rook_rank = board.turn === "w" ? 0 : 7; ///TODO: Use board_details.ranks

        if (!piece || !square || !uci) {
            return false;
        }

///NOTE: This does not find en passant captures. See below.
        captured_piece = get_piece_from_rank_file(square.rank, square.file);
        if (board.get_mode() === "play") {
/// Indicate that the board has been changed; it is not in the inital starting position.
            board.messy = true;
            /// En passant
            if (!captured_piece && piece.type === "p" && piece.file !== square.file && ((piece.color === "w" && square.rank === board_details.ranks - 3) || (piece.color === "b" && square.rank === 2))) {
                captured_piece = get_piece_from_rank_file(piece.rank, square.file);
                mark_ep(uci);
            }

            if (captured_piece && captured_piece.id !== piece.id) {
                capture(captured_piece);
            }

/// Is it castling?
            if (san === "O-O") { /// Kingside castle
                rook = get_piece_from_rank_file(rook_rank, board_details.files - 1);
                set_piece_pos(rook, {rank: rook_rank, file: board_details.files - 3});
            } else if (san === "O-O-O") { /// Queenside castle
                rook = get_piece_from_rank_file(rook_rank, 0);
                set_piece_pos(rook, {rank: rook_rank, file: 3});
            }
        } else if (board.get_mode() === "setup" && captured_piece) {
/// The pieces should swap places.
            set_piece_pos(captured_piece, piece);
            if (captured_piece.type === "p" && (captured_piece.rank === 0 || captured_piece.rank === board_details.ranks - 1)) {
                promotion_prompt(captured_piece, function onres(answer) {
                    promote_piece(captured_piece, num_to_alpha(square.file) + square.rank + num_to_alpha(piece.file) + piece.rank + answer);
                });
            }
        }

/// Make sure to change the rank and file after checking for a capured piece so that you don't capture yourself.
        set_piece_pos(piece, square);
    }

    function is_promoting(piece, square) {
        if (!piece || !square) {
            return;
        }

        return piece.type === "p" && square.rank % (board_details.ranks - 1) === 0;
    }

    function remove_piece(piece) {
        var i;
        function remove() {
            piece.el.parentNode.removeChild(piece.el);
        }

        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (piece.id === board.pieces[i].id) {
                G.array_remove(board.pieces, i);
                /// Make it fade out.
                piece.el.className += " captured";
                setTimeout(remove, 2000);
                return;
            }
        }
    }

    function make_move(piece, square, uci, promoting) {
        move_piece(piece, square, uci);
        report_move(uci, promoting, piece, function onreport(finalized_uci) {
            ///NOTE: Since this is async, we need to store which piece was moved.
            promote_piece(piece, finalized_uci);
        });
    }

    function onmouseup(e) {
        var square,
                uci,
                promoting;
        if (board.dragging && board.dragging.piece) {
            square = get_dragging_hovering_square(e);
            promoting = is_promoting(board.dragging.piece, square);
            uci = get_move(board.dragging.piece, square);
            if (square && (board.get_mode() === "setup" || is_legal_move(uci))) {
                make_move(board.dragging.piece, square, uci, promoting);
            } else {
/// Snap back.
                if (board.get_mode() === "setup") {
                    remove_piece(board.dragging.piece);
                    /// We need to remove "dragging" to make the transitions work again.
//                    board.dragging.piece.el.classList.remove("dragging");
                    board.dragging.piece.el.className = removeClass(board.dragging.piece.el.className, "dragging");
                    delete board.dragging.piece;
                }
            }


/// If it wasn't deleted
            if (board.dragging.piece) {
                if (orientation === "black") {
                    prefix_css(board.dragging.piece.el, "transform", "rotate(180deg)");
                } else {
                    prefix_css(board.dragging.piece.el, "transform", "none");
                }

//                board.dragging.piece.el.className = board.dragging.piece.el.className.replace("dragging", "");
                board.dragging.piece.el.className = removeClass(board.dragging.piece.el.className, "dragging");
            }
            board.el.className = removeClass(board.el.className, "dragging");
            delete board.dragging;
        }
    }

    function get_piece_img(piece) {
//        return "url(\"" + encodeURI("img/pieces/" + board.theme + "/" + piece.color + piece.type + (board.theme_ext || ".svg")) + "\")";
        return "url('/img/pieces/default/" + piece.color + piece.type + ".png')";
    }

    function clear_board_extras() {
        clear_highlights();
        clear_focuses();
        clear_dots();
        arrow_manager.clear();
    }

    function set_board(fen) {
        fen = fen || get_init_pos();
        load_pieces_from_start(fen);
        board.pieces.forEach(function oneach(piece) {
            if (!piece.el) {
                piece.el = document.createElement("div");
                piece.el.className += " piece";
                add_piece_events(piece);
                /// We just put them all in the bottom left corner and move the position.
                squares[0][0].appendChild(piece.el);
            }

            /// If the pieces were already on the board from a previous game, a pawn may have promoted.
            set_image(piece);
            /// If the pieces were already on the board from a previous game, they may have been captured.
            if (piece.captured) {
                release(piece);
            }

            set_piece_pos(piece, {rank: piece.rank, file: piece.file});
        });
        clear_board_extras();
        board.turn = "w";
        board.moves = [];
        board.messy = false;
        if (typeof board.close_modular_window === "function") {
            board.close_modular_window();
        }
    }

    function wait() {
        board.set_mode("wait");
        board.el.className += " waiting";
        board.el.className = removeClass(board.el.className, "settingUp");
        board.el.className = removeClass(board.el.className, "playing");
        arrow_manager.el.className += " waiting";
    }

    function play() {
        board.set_mode("play");
        board.el.className = removeClass(board.el.className, "waiting");
        board.el.className = removeClass(board.el.className, "settingUp");
        board.el.className += " playing";
        arrow_manager.el.className = removeClass(arrow_manager.el.className, "waiting");
    }

    function enable_setup() {
        board.set_mode("setup");
        board.el.className = removeClass(board.el.className, "waiting");
        board.el.className = removeClass(board.el.className, "playing");
        board.el.className += " settingUp";
        arrow_manager.el.className = removeClass(arrow_manager.el.className, "waiting");
    }

    function get_piece_from_rank_file(rank, file) {
        var i;
        rank = parseInt(rank, 10);
        file = parseInt(file, 10);
        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (!board.pieces[i].captured && board.pieces[i].rank === rank && board.pieces[i].file === file) {
                return board.pieces[i];
            }
        }
    }

    function split_uci(uci) {
        var positions = {
            starting: {
                file: uci.charCodeAt(0) - 97,
                rank: parseInt(uci[1], 10) - 1
            },
            ending: {
                file: uci.charCodeAt(2) - 97,
                rank: parseInt(uci[3], 10) - 1
            }
        };
        if (uci.length === 5) {
            positions.promote_to = uci[4];
        }

        return positions;
    }

    function capture(piece) {
        piece.captured = true;
        piece.el.className += " captured";
    }

    function release(piece) {
        delete piece.captured;
        piece.el.className = removeClass(piece.el.className, "captured");
    }

    function move_piece_uci(uci) {
        var positions = split_uci(uci),
                piece,
                ending_square;
        ending_square = {
            el: squares[positions.ending.rank][positions.ending.file],
            rank: positions.ending.rank,
            file: positions.ending.file
        };
        piece = get_piece_from_rank_file(positions.starting.rank, positions.starting.file);
        if (piece) {
            move_piece(piece, ending_square, uci);
            promote_piece(piece, uci);
        }
    }
    var i = 0;
    function move_only(uci, san) {
        var positions = split_uci(uci),
                piece,
                ending_square;
        ending_square = {
            el: squares[positions.ending.rank][positions.ending.file],
            rank: positions.ending.rank,
            file: positions.ending.file
        };
        piece = get_piece_from_rank_file(positions.starting.rank, positions.starting.file);
        if (piece) {
            var captured_piece,
                    rook,
                    rook_rank = board.turn === "w" ? 0 : 7; ///TODO: Use board_details.ranks
            var square = ending_square;

            if (!piece || !square || !uci) {
                return false;
            }

///NOTE: This does not find en passant captures. See below.
            captured_piece = get_piece_from_rank_file(square.rank, square.file);

/// Indicate that the board has been changed; it is not in the inital starting position.
            board.messy = true;
            /// En passant
            if (!captured_piece && piece.type === "p" && piece.file !== square.file && ((piece.color === "w" && square.rank === board_details.ranks - 3) || (piece.color === "b" && square.rank === 2))) {
                captured_piece = get_piece_from_rank_file(piece.rank, square.file);
                mark_ep(uci);
            }

            if (captured_piece && captured_piece.id !== piece.id) {
                capture(captured_piece);
            }

/// Is it castling?
            if (san === "O-O") { /// Kingside castle
                rook = get_piece_from_rank_file(rook_rank, board_details.files - 1);
                set_piece_pos(rook, {rank: rook_rank, file: board_details.files - 3});
            } else if (san === "O-O-O") { /// Queenside castle
                rook = get_piece_from_rank_file(rook_rank, 0);
                set_piece_pos(rook, {rank: rook_rank, file: 3});
            }
/// Make sure to change the rank and file after checking for a capured piece so that you don't capture yourself.
            set_piece_pos(piece, square);
            promote_piece(piece, uci);

            arrow_manager.clear();
            arrow_manager.draw(positions.starting.rank, positions.starting.file, positions.ending.rank, positions.ending.file, rgba[0], true);
            if (san.indexOf('+') > -1) {
                var turn = (board.turn === 'w') ? 'b' : 'w';
                var king = find_king(turn);
                arrow_manager.draw(positions.ending.rank, positions.ending.file, king.rank, king.file, rgba[1], true);
                focus_checked_king(king);
            }
        }
    }

    function track_move(uci) {
        board.moves.push(uci);
        switch_turn();
        clear_board_extras();
        G.events.trigger("board_move", {uci: uci});
    }

    function move(uci) {
        move_piece_uci(uci);
        track_move(uci);
    }

    function onkeydown(e) {
        var target = e.target || e.srcElement || e.originalTarget;
        if (e.ctrlKey) {
            board.el.className += " catchClicks";
            capturing_clicks = true;
            if (e.keyCode === 39) { /// Right
                cur_color += 1;
                if (cur_color >= colors.length) {
                    cur_color = 0;
                }
            } else if (e.keyCode === 37) { /// Left
                cur_color -= 1;
                if (cur_color < 0) {
                    cur_color = colors.length - 1;
                }
            } else if (e.keyCode === 32) { /// Space
                clear_highlights();
                arrow_manager.clear(true); /// Only clear lines drawn by the user.
            }
        }

        if (e.keyCode === 8 && (!target || target.tagName === "BODY")) { /// backspace
            arrow_manager.delete_arrow();
            e.preventDefault();
        }
    }

    function stop_capturing_clicks() {
        board.el.className = removeClass(board.el.className, "catchClicks");
        capturing_clicks = false;
    }

    function onkeyup(e) {
        if (!e.ctrlKey) {
            stop_capturing_clicks();
        }
    }

    function check_fen_trailing(fen) {

        if (/(w|b) (([k|q]?)|-) (([abcdefgh][36])|-) (\d*) (\d*)/i.test(fen)) {
            return fen;
        } else {
            return fen += " w - - 0 1";
        }

    }

    function set_fen_selection(fen) {
        if (!fen) {
            fen = document.getElementById("fen_selection").value;
        }

        if (/^\s*[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*/i.test(fen)) {
            set_board(fen);
            set_mode("setup");
            board.reset();
            set_mode("play");
            document.getElementById("current_fen").value = fen;
        } else {
            return;
        }
    }

    function set_fen(f) {
        var fen = document.getElementById("fen_input").value;
        if (f) {
            fen = f;
        }
        if (/^\s*[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*\/[^\/\s]*/i.test(fen)) {
            fen = check_fen_trailing(fen);
            set_board(fen);
            set_mode("setup");
            board.reset();
            set_mode("play");
            document.getElementById("current_fen").value = fen;
        } else {
            return;
        }
    }

    function get_fen(full) {
        var ranks = [],
                i,
                j,
                fen = "";
        board.pieces.forEach(function (piece) {
            if (!piece.captured) {
                if (!ranks[piece.rank]) {
                    ranks[piece.rank] = [];
                }
                ranks[piece.rank][piece.file] = piece.type;
                if (piece.color === "w") {
                    ranks[piece.rank][piece.file] = ranks[piece.rank][piece.file].toUpperCase();
                }
            }
        });
        /// Start with the last rank.
        for (i = board_details.ranks - 1; i >= 0; i -= 1) {
            if (ranks[i]) {
                for (j = 0; j < board_details.files; j += 1) {
                    if (ranks[i][j]) {
                        fen += ranks[i][j];
                    } else {
                        fen += "1";
                    }
                }
            } else {
                fen += "8";
            }
            if (i > 0) {
                fen += "/";
            }
        }

/// Replace 1's with their number (e.g., 11 with 2).
        fen = fen.replace(/1{2,}/g, function replacer(ones) {
            return String(ones.length);
        });
        return fen;
    }

    function find_king(color) {
        var i;
        for (i = board.pieces.length - 1; i >= 0; i -= 1) {
            if (board.pieces[i].color === color && board.pieces[i].type === "k") {
                return board.pieces[i];
            }
        }
    }

    function focus_checked_king(king) {
        if (king) {
            focus_square(king.file, king.rank, "red");
        }
        board.checked_king = king;
    }


    function show_lines_of_power() {
        var power_squares = [];
        function add_square(rank, file, piece) {
            var color;
            if (rank >= 0 && rank < board_details.ranks && file >= 0 && file < board_details.files) {
                if (!power_squares[rank]) {
                    power_squares[rank] = [];
                }

                color = piece.color === "w" ? "red" : "blue";
                /// Mix.
                if (power_squares[rank][file] && power_squares[rank][file].color !== color) {
                    color = "purple";
                }
                power_squares[rank][file] = {rank: rank, file: file, color: color};
                ///TODO: Remove squares when in check that do not remove check.
            }
        }

        function add_squares_dir(piece, file_change, rank_change) {
            var rank = piece.rank,
                    file = piece.file;
            for (; ; ) {
                rank += rank_change;
                file += file_change;
                if (file >= 0 && file < board_details.files && rank >= 0 && rank < board_details.ranks) {
                    add_square(rank, file, piece);
                    /// Stop at a piece (either friend or foe)
                    if (get_piece_from_rank_file(rank, file)) {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        function add_diagonal_squares(piece) {
            add_squares_dir(piece, 1, 1);
            add_squares_dir(piece, 1, -1);
            add_squares_dir(piece, -1, 1);
            add_squares_dir(piece, -1, -1);
        }

        function add_orthogonal_squares(piece) {
            add_squares_dir(piece, 1, 0);
            add_squares_dir(piece, -1, 0);
            add_squares_dir(piece, 0, 1);
            add_squares_dir(piece, 0, -1);
        }

        board.pieces.forEach(function oneach(piece) {
            var dir;
            if (!piece.captured) {
                if (piece.type === "p") {
                    if (piece.color === "w") {
                        dir = 1;
                    } else {
                        dir = -1;
                    }
                    add_square(piece.rank + dir, piece.file + 1, piece);
                    add_square(piece.rank + dir, piece.file - 1, piece);
                } else if (piece.type === "n") {
                    add_square(piece.rank + 2, piece.file + 1, piece);
                    add_square(piece.rank - 2, piece.file + 1, piece);
                    add_square(piece.rank + 1, piece.file + 2, piece);
                    add_square(piece.rank + 1, piece.file - 2, piece);
                    add_square(piece.rank - 2, piece.file - 1, piece);
                    add_square(piece.rank + 2, piece.file - 1, piece);
                    add_square(piece.rank - 1, piece.file - 2, piece);
                    add_square(piece.rank - 1, piece.file + 2, piece);
                } else if (piece.type === "b") {
                    add_diagonal_squares(piece);
                } else if (piece.type === "r") {
                    add_orthogonal_squares(piece);
                } else if (piece.type === "q") {
                    add_orthogonal_squares(piece);
                    add_diagonal_squares(piece);
                } else if (piece.type === "k") {
                    add_square(piece.rank + 1, piece.file + 1, piece);
                    add_square(piece.rank - 1, piece.file - 1, piece);
                    add_square(piece.rank + 1, piece.file - 1, piece);
                    add_square(piece.rank - 1, piece.file + 1, piece);
                    add_square(piece.rank + 1, piece.file, piece);
                    add_square(piece.rank - 1, piece.file, piece);
                    add_square(piece.rank, piece.file - 1, piece);
                    add_square(piece.rank, piece.file + 1, piece);
                }
            }
        });
        power_squares.forEach(function oneach(ranks) {
            ranks.forEach(function oneach(data) {
                highlight_square(data.file, data.rank, data.color);
            });
        });
    }

    function set_legal_moves(moves) {
        legal_moves = moves;
        if (board.display_lines_of_power) {
            show_lines_of_power();
        }

        G.events.trigger("board_set_legal_moves", {moves: moves});
    }

    function get_legal_moves() {
        return legal_moves;
    }

    function check_highlight(e) {
        var king;
        if (legal_moves && legal_moves.checkers && legal_moves.checkers.length) {
            king = find_king(board.turn);
            legal_moves.checkers.forEach(function (checker) {
                var checker_data = get_rank_file_from_str(checker);
                arrow_manager.draw(checker_data.rank, checker_data.file, king.rank, king.file, rgba[1], true);
            });
        }

///NOTE: This will clear the checked king square if there is no checked king, so it must always be called.
        focus_checked_king(king);
    }

    G.events.attach("board_set_legal_moves", check_highlight);
    arrow_manager = (function create_draw_arrow() {
        var canvas = document.createElement("canvas"),
                ctx,
                on_dom,
                arrows = [],
                canvas_left,
                canvas_top,
                remove_timer;
        function get_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
            /// See https://en.wikipedia.org/wiki/Line–line_intersection.
            return {
                x: ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)),
                y: ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))
            };
        }

        function rotate_point(point_x, point_y, origin_x, origin_y, angle) {
            return {
                x: Math.cos(angle) * (point_x - origin_x) - Math.sin(angle) * (point_y - origin_y) + origin_x,
                y: Math.sin(angle) * (point_x - origin_x) + Math.cos(angle) * (point_y - origin_y) + origin_y
            };
        }

        function create_arrow(x1, y1, x2, y2, options, offset) {
            options = options || {};
            options.width = options.width || 12;
            options.fillStyle = options.fillStyle || "rgb(0,0,200)";
            options.head_len = options.head_len || 30;
            if (options.head_len < options.width + 1) {
                options.head_len = options.width + 1;
            }
            options.head_angle = options.head_angle || Math.PI / 6;
            var angle = Math.atan2(y2 - y1, x2 - x1);
            var ang_neg = angle - options.head_angle;
            var ang_pos = angle + options.head_angle;
            var tri_point1 = {
                x: x2 - options.head_len * Math.cos(ang_neg),
                y: y2 - options.head_len * Math.sin(ang_neg)
            };
            var tri_point2 = {
                x: x2 - options.head_len * Math.cos(ang_pos),
                y: y2 - options.head_len * Math.sin(ang_pos)
            };
            /// Since the line has a width, we need to create a new line by moving the point half of the width and then rotating it to match the line.
            var p1 = rotate_point(x1, y1 + options.width / 2, x1, y1, angle);
            var p2 = rotate_point(x2, y2 + options.width / 2, x2, y2, angle);
            /// Find the point at which the line will reach the bottom of the triangle.
            var int2 = get_intersect(p1.x, p1.y, p2.x, p2.y, tri_point1.x, tri_point1.y, tri_point2.x, tri_point2.y);
            var p3 = rotate_point(x1, y1 - options.width / 2, x1, y1, angle);
            var p4 = rotate_point(x2, y2 - options.width / 2, x2, y2, angle);
            var int3 = get_intersect(p3.x, p3.y, p4.x, p4.y, tri_point1.x, tri_point1.y, tri_point2.x, tri_point2.y);
            ctx.fillStyle = options.fillStyle;
            //SHOWS rectagles INSTEAD of ARROW
            if (board.pointer) {
                ctx.beginPath();
                ctx.arc(x1, y1, options.width / 2, angle - Math.PI / 2, angle - Math.PI * 1.5, true);
                ctx.lineTo(int2.x, int2.y);
                ctx.lineTo(tri_point1.x, tri_point1.y);
                ctx.lineTo(x2, y2);
                ctx.lineTo(tri_point2.x, tri_point2.y);
                ctx.lineTo(int3.x, int3.y);
                ctx.closePath();
                if (options.lineWidth) {
                    ctx.lineWidth = options.lineWidth;
                    ctx.strokeStyle = options.strokeStyle;
                    ctx.stroke();
                }
            } else {
                ctx.rect(x1 - offset, y1 - offset, offset * 2, offset * 2);
                ctx.rect(x2 - offset, y2 - offset, offset * 2, offset * 2);
            }


            ctx.fill();
        }

        function draw_arrow(rank1, file1, rank2, file2, color, auto, do_not_add) {
            var box1 = squares[rank1][file1].getBoundingClientRect(),
                    box2 = squares[rank2][file2].getBoundingClientRect(),
                    proportion,
                    adjust_height;
            if (!do_not_add) {
                arrows.push({
                    rank1: rank1,
                    file1: file1,
                    rank2: rank2,
                    file2: file2,
                    color: color,
                    auto: auto,
                });
            }

            if (!on_dom) {
                set_size();
                document.body.appendChild(canvas);
                on_dom = true;
                var offset = $('.chess_board').offset();
                $('#canvas').offset(offset);
            }

            proportion = (box1.width / 2);
            create_arrow(box1.left + box1.width / 2 - canvas_left, box1.top + box1.height / 2 - canvas_top,
                    box2.left + box2.width / 2 - canvas_left, box2.top + box2.height / 2 - canvas_top,
                    {
                        fillStyle: color,
                        width: box1.width / 5,
                        head_len: box1.width / 1.5,
                    }, proportion);

            return arrows.length - 1;
        }

        function remove_if_empty() {
            clearTimeout(remove_timer);
            /// Since we often draw another arrow quickly, there's no need to remove it right away.
            remove_timer = setTimeout(function () {
                if (on_dom && !arrows.length) {
                    if (canvas.parentNode) {
                        canvas.parentNode.removeChild(canvas);
                    }
                    on_dom = false;
                }
            }, 2000);
        }

        function clear(keep_auto_arrows) {
            var i;
            /// Sometimes, we don't want to remove the arrows for last move and checkers.
            if (keep_auto_arrows) {
                for (i = arrows.length - 1; i >= 0; i -= 1) {
                    if (!arrows[i].auto) {
                        G.array_remove(arrows, i);
                    }
                }
            } else {
                arrows = [];
            }
            set_size();
            if (arrows.length) {
                draw_all_arrows();
            } else {
                remove_if_empty();
            }
        }

        function draw_all_arrows() {
            arrows.forEach(function (arrow) {
                draw_arrow(arrow.rank1, arrow.file1, arrow.rank2, arrow.file2, arrow.color, arrow.auto, true);
            });
        }

        function getPos(el) {
            // yay readability
            var lx, ly;
            for (lx = 0, ly = 0;
                    el != null;
                    lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent)
                ;
            return {x: lx, y: ly};
        }

        function set_size() {
            canvas_left = getPos(board.el).x;
            canvas_top = getPos(board.el).y - window.pageYOffset;
            canvas.width = board.el.offsetWidth;
            canvas.height = board.el.offsetHeight;
        }

        function redraw() {
            set_size();
            draw_all_arrows();
        }

        function delete_arrow(which) {
            if (!which) {
                which = arrows.length - 1;
                for (; ; ) {
                    /// We are looking for the last arrow drawn by the user.
                    if (arrows[which] && !arrows[which].auto) {
                        break;
                    }

                    which -= 1;
                    if (which < 0) {
                        return;
                    }
                }
            }

            if (arrows[which]) {
                G.array_remove(arrows, which);
                redraw();
            }

            remove_if_empty();
        }

        function arrow_onmove(e) {
            var uci_data = split_uci(e.uci);
            draw_arrow(uci_data.starting.rank, uci_data.starting.file, uci_data.ending.rank, uci_data.ending.file, rgba[0], true);
        }

        function draw(rank1, file1, rank2, file2, color, auto) {
            return draw_arrow(rank1, file1, rank2, file2, color, auto);
        }

        G.events.attach("board_resize", redraw);
        G.events.attach("board_move", arrow_onmove);
        canvas.className = "boardArrows";
        canvas.id = "canvas"
        ctx = canvas.getContext("2d");
        return {
            el: canvas,
            draw: draw,
            clear: clear,
            delete_arrow: delete_arrow
        };
    }());
    function get_mode() {
        return mode;
    }

    function set_mode(new_mode) {
        var old_mode = mode;
        if ((new_mode === "play" || new_mode === "setup") && typeof board.close_modular_window === "function") {
            board.close_modular_window();
        }
        mode = new_mode;
        G.events.trigger("board_mode_change", {old_move: old_mode, mode: new_mode});
    }

    function monitor_mode_change(e) {
        if (e.mode === "setup") {
            clear_board_extras();
        }
    }

    function change_theme_color() {

        if (board.theme_color) {
            document.getElementById("switch_theme").style.backgroundColor = "#2198d5";
            squares.forEach(function oneach(file, y) {
                file.forEach(function oneach(sq, x) {
                    if (squares[y][x].className.indexOf("light") > -1) {
                        squares[y][x].className = removeClass(squares[y][x].className, "light");
                        squares[y][x].className += " newLight";
                    } else {
                        squares[y][x].className = removeClass(squares[y][x].className, "dark");
                        squares[y][x].className += " newDark";
                    }
                });
            });
            board.theme_color = false;
        } else {
            var el = document.getElementById("switch_theme").style.backgroundColor = "#B58863";
            squares.forEach(function oneach(file, y) {
                file.forEach(function oneach(sq, x) {
                    if (squares[y][x].className.indexOf("newLight") > -1) {
                        squares[y][x].className = removeClass(squares[y][x].className, "newLight");
                        squares[y][x].className += " light";
                    } else {
                        squares[y][x].className = removeClass(squares[y][x].className, "newDark");
                        squares[y][x].className += " dark";
                    }
                });
            });
            board.theme_color = true;
        }

    }

    function change_pointer_type() {
        var el = document.getElementById("pointer_type");
        if (board.pointer) {
            el.className = "glyphicon";
            el.className += " glyphicon-stop";
            clear_board_extras();
            board.pointer = false;
        } else {
            el.className = "glyphicon";
            el.className += " glyphicon-arrow-right";
            clear_board_extras();
            board.pointer = true;
        }
    }

    board = {
        fen: "",
        pointer: true, //true = arrows, false = squares
        theme_color: true, //true = default colors, false = custom color
        change_theme_color: change_theme_color,
        change_pointer_type: change_pointer_type,
        set_fen: set_fen,
        set_fen_selection: set_fen_selection,
        pieces: [],
        size_board: size_board,
        theme: "default",
        wait: wait,
        play: play,
        move: move,
        move_only: move_only,
        players: {
            w: {
                color: "w",
            },
            b: {
                color: "b",
            }
        },
        switch_turn: switch_turn,
        set_board: set_board,
        is_legal_move: is_legal_move,
        moves: [],
        get_fen: get_fen,
        board_details: board_details,
        highlight_colors: colors,
        clear_highlights: clear_highlights,
        highlight_square: highlight_square,
        set_legal_moves: set_legal_moves,
        get_legal_moves: get_legal_moves,
        show_lines_of_power: show_lines_of_power,
        get_mode: get_mode,
        set_mode: set_mode,
        get_san: get_san,
        get_uci: get_uci,
        create_modular_window: create_modular_window,
        change_orientation: change_orientation
                /// onmove()
                /// onswitch()
                /// turn
                /// display_lines_of_power
    };

    function change_orientation(o) {
        $('.piece').css('transform', '');
        if (o === 'white') {
            orientation = "white";
            $('.chess_board').removeClass('orient_black');
            $('.ratingContainer').removeClass('orient_black');
            var num = $('.num');
            for (var i = 0; i < 8; i++) {
                $('.square.rank' + i + '.file0').append(num[i]);
            }
            var letter = $('.letter');
            for (var i = 0; i < 8; i++) {
                $('.square.rank0.file' + i).append(letter[i]);
            }
        } else if (o === 'black') {
            orientation = "black";
            $('.chess_board').addClass('orient_black');
            $('.ratingContainer').addClass('orient_black');
            var num = $('.num');
            for (var i = 0; i < 8; i++) {
                $('.square.rank' + i + '.file7').append(num[i]);
            }
            var letter = $('.letter');
            for (var i = 0; i < 8; i++) {
                $('.square.rank7.file' + i).append(letter[i]);
            }
        }
    }
    ;
    G.events.attach("board_mode_change", monitor_mode_change);
    options = options || {};
    create_board(el, options.dim);
    set_board(options.pos);
    window.addEventListener("mousemove", onmousemove);
    window.addEventListener("touchmove", onmousemove);
    window.addEventListener("mouseup", onmouseup);
    window.addEventListener("touchend", onmouseup);
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
    return board;
};
