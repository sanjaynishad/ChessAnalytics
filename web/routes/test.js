var express = require('express');
var router = express.Router();

router
		.get(
				'/analyse_game_test',
				function(req, res) {

					console.log('analyse_game_test');
					var order, queue;
					var _private = false;
					var pgn = '[Event "Lloyds Bank op"]\n'
							+ '[Site "London"]\n'
							+ '[Date "1984"]\n'
							+ '[Round "1"]\n'
							+ '[White "Adams, Michael"]\n'
							+ '[Black "Sedgwick, David"]\n'
							+ '[Result "1-0"]\n'
							+ '[WhiteElo ""]\n'
							+ '[BlackElo ""]\n'
							+ '[ECO "C05"]\n'
							+ '1.e4 e6 2.d4 d5 3.Nd2 Nf6 4.e5 Nfd7 5.f4 c5 6.c3 Nc6 7.Ndf3 cxd4 8.cxd4 f6 9.Bd3 Bb4+ 10.Bd2 Qb6 11.Ne2 fxe5 12.fxe5 O-O 13.a3 Be7 14.Qc2 Rxf3 15.gxf3 Nxd4 16.Nxd4 Qxd4 17.O-O-O Nxe5 18.Bxh7+ Kh8 19.Kb1 Qh4 20.Bc3 Bf6 21.f4 Nc4 22.Bxf6 Qxf6 23.Bd3 b5 24.Qe2 Bd7 25.Rhg1 Be8 26.Rde1 Bf7 27.Rg3 Rc8 28.Reg1 Nd6 29.Rxg7 Nf5 30.R7g5 Rc7 31.Bxf5 exf5 32.Rh5+  1-0\n';
					pgn = '[Event "Lloyds Bank op"]\n'
							+ '[Site "London"]\n'
							+ '[Date "1984"]\n'
							+ '[Round "1"]\n'
							+ '[White "1"]\n'
							+ '[Black "2"]\n'
							+ '[Result "1-0"]\n'
							+ '[WhiteElo ""]\n'
							+ '[BlackElo ""]\n'
							+ '[ECO "C05"]\n'
							+ '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. Re1 O-O 7. Bc6 bc6 8. h3 Re8 9. Nbd2 Nd7 10. Nc4 Bb6 11. a4 a5 12. Nb6 cb6 13. d4 Qc7 14. Ra3 Nf8 15. de5 de5 16. Nh4 Rd8 17. Qh5 f6 18. Nf5 Be6 19. Rg3 Ng6 20. h4 Bf5 21. ef5 Nf4 22. Bf4 ef4 23. Rc3 c5 24. Re6 Rab8 25. Rc4 Qd7 26. Kh2 Rf8 27. Rce4 Rb7 28. Qe2 b5 29. b3 ba4 30. ba4 Rb4 31. Re7 Qd6 32. Qf3 Re4 33. Qe4 f3 34. g3 h5 35. Qb7  1-0\n';
					queue_manager.add_to_queue({
						private : _private,
						user_id : "1",
						pgn : pgn
					});

					res.send({
						message : "added to queue"
					});

				});
router
		.get(
				'/analyse_game_test1',
				function(req, res) {

					console.log('analyse_game_test');
					var order, queue;
					var _private = false;
					var pgn = '[Event "Lloyds Bank op"]\n'
							+ '[Site "London"]\n'
							+ '[Date "1984"]\n'
							+ '[Round "1"]\n'
							+ '[White "zhao"]\n'
							+ '[Black "test"]\n'
							+ '[Result "1-0"]\n'
							+ '[WhiteElo ""]\n'
							+ '[BlackElo ""]\n'
							+ '[ECO "C05"]\n'
							+ '1.e4 e6 2.d4 d5 3.Nd2 Nf6 4.e5 Nfd7 5.f4 c5 6.c3 Nc6 7.Ndf3 cxd4 8.cxd4 f6 '
							+ '9.Bd3 Bb4+ 10.Bd2 Qb6 11.Ne2 fxe5 12.fxe5 O-O 13.a3 Be7 14.Qc2 Rxf3 15.gxf3 Nxd4 '
							+ '16.Nxd4 Qxd4 17.O-O-O Nxe5 18.Bxh7+ Kh8 19.Kb1 Qh4 20.Bc3 Bf6 21.f4 Nc4 22.Bxf6 Qxf6 '
							+ '23.Bd3 b5 24.Qe2 Bd7 25.Rhg1 Be8 26.Rde1 Bf7 27.Rg3 Rc8 28.Reg1 Nd6 29.Rxg7 Nf5 '
							+ '30.R7g5 Rc7 31.Bxf5 exf5 32.Rh5+  1-0\n';
					pgn = '[Event "Lloyds Bank op"]\n'
							+ '[Site "London"]\n'
							+ '[Date "1984.??.??"]\n'
							+ '[Round "1"]\n'
							+ '[White "3"]\n'
							+ '[Black "4"]\n'
							+ '[Result "1-0"]\n'
							+ '[WhiteElo ""]\n'
							+ '[BlackElo ""]\n'
							+ '[ECO "C05"]\n'
							+ '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. O-O d6 6. Re1 O-O 7. Bc6 bc6 8. h3 Re8 9. Nbd2 Nd7 10. Nc4 Bb6 11. a4 a5 12. Nb6 cb6 13. d4 Qc7 14. Ra3 Nf8 15. de5 de5 16. Nh4 Rd8 17. Qh5 f6 18. Nf5 Be6 19. Rg3 Ng6 20. h4 Bf5 21. ef5 Nf4 22. Bf4 ef4 23. Rc3 c5 24. Re6 Rab8 25. Rc4 Qd7 26. Kh2 Rf8 27. Rce4 Rb7 28. Qe2 b5 29. b3 ba4 30. ba4 Rb4 31. Re7 Qd6 32. Qf3 Re4 33. Qe4 f3 34. g3 h5 35. Qb7  1-0\n';

					var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

					console.log('analyse');
					analyser.analyse_new({
						private : _private,
						fen : fen,
						pgn : pgn
					}, function() {
						console.log('analysed');

						res.send({
							message : "success"
						});
					});

				});

module.exports = router;
