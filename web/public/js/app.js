(function(chess){
	"use strict";

	var CA = {}

	CA.chessboard = function($el){
		chess.useAI(false);
		chess.setPromotion('Queen');
		chess.setFrameRate(1000);
		chess.setSide('White');
		chess.useKeyboard(true);
		chess.placeById("chessDesk");
		chess.setView(1);

		$.get(window.location.href+'.json', function(data){
			chess.readPGN(data.pgn);
		});

		$(document).on('keydown', function(e){
			if(e.which === 37){ chess.navigate(-1); }
			else if(e.which === 39){ chess.navigate(1); }
		});

		$('.game').on('click','[data-turn]', CA.change_turns);

		$el.on('chess-navigate', CA.highlight);

		$('#chessCtrlPanel').draggable();
		setTimeout(function(){
			CA.highlight();
		},500);
	};

	CA.change_turns = function(e){
//    	console.log(moveId);
//		$('#chessMoves').val( $(e.currentTarget).data('turn') ).trigger('change');
		KingdomPGN.makeMoveFromId(parseInt($(e.currentTarget).data('turn'))*2-1);
	};

	CA.highlight = function(){
		var turn = $('#chessMoves').val();
		$('.game').find('[data-turn]').removeClass('highlight');
		$('.game').find('[data-turn="'+turn+'"]').addClass('highlight');
	};

	CA.highlightMove = function(move){
		var turn = parseInt((move+1)/2);
		$('.game').find('[data-turn]').removeClass('highlight');
		$('.game').find('[data-turn="'+turn+'"]').addClass('highlight');
	};



	var QueueStats = function($el){
		console.log("QueueStats");
		this.$el = $el;

		var socket = io.connect();
		this.game_template = Handlebars.compile($('#queue_games').text());
		this.message_template = Handlebars.compile($('#queue_message').text());
		socket.on('queue', $.proxy(this.update, this));
		socket.emit('hook', 'queue');
	};

	QueueStats.prototype.update_games = function(games){
		this.$el.find('.game_list').html(this.game_template({
			games: games
		}));
	};

	QueueStats.prototype.update_count = function(count){
		if(!count){ count = 0; }
		this.count = count;
		this.$el.find('.count').text(count+' ');
	};

	QueueStats.prototype.update = function(games, count){
		console.log("QueueStats.prototype.update");
		console.log(games);
		console.log(count);
		if(count !== this.count){
			this.update_count(count);
		}
		this.update_games(games);	
	};

	CA.queuestats = function($el){
		var qs = new QueueStats($el);
	};

	CA.analysis_form = function($el){
		$el.on('submit', function(e){
			e.preventDefault();
			$.post($(this).attr('action'), $(this).serialize(), function(data){
				$('#message').html(data.message);
				$('#message').parent().fadeIn().css('visibility', 'visible');
			});
			$(this).find('#pgn').val('');
			$(this).parents('.dropdown-menu:first').hide();
		});
	};

	CA.nav_tooltip_close = function($open_els){
		var i;

		for(i=0; i<$open_els.length; i++){
			$open_els[i].hide();
		}
		$open_els=[];
	};

	CA.nav = function($el){
		var $open_els = [];

		$el.on('click', '[data-toggle="menu-dropdown"]', function(e){
			e.preventDefault();
			CA.nav_tooltip_close($open_els);

			$(this).next().show();
			$open_els.push($(this).next());
		});

		$el.on('click', '.icon-remove', function(e){
			e.preventDefault();
			CA.nav_tooltip_close($open_els);	
		});
	};

	$(function(){
		$('[data-loader]').each(function(){
			CA[$(this).data('loader')]($(this));
		});
	});
		$(function() {
			function trim(s){
			　　    return s.replace(/(^\s*)|(\s*$)/g, "");
			}
		      $('.open-modal').click(function(){
		          var modalLink = $(this).attr('data-modal');
		          $('.ui.small.modal#'+modalLink).modal('show');
		          });
//		          $('.tabular.menu .item').tab();

				if($( "#nalyzegamebtn" ).length){
					$('#nalyzegamebtn').click(function() {
//						e.preventDefault();
						if(trim($('#pgn').val()) == ""){
							return;
						}
						$.ajax({
							  type: 'POST',
							  url: "/analyse-game",
							  data: {private:$('#private').is(':checked') ? "on" : "off",pgn:$('#pgn').val()},
							  success: function (data){
								  console.log(data.message);
									$('#message').html(data.message);
									$('#message').parent().fadeIn().css('visibility', 'visible');
							  }
							});
						
//						$.post($(this).attr('action'), $(this).serialize(), function(data){
//							$('#message').html(data.message);
//							$('#message').parent().fadeIn().css('visibility', 'visible');
//						});
						$('#pgn').val("");
						$('#modal-game').modal('hide');
					});
				}
				if($( "#cancelbtn" ).length){
					$('#cancelbtn').click(function() {
						$('#'+$(this).data('dismiss')).modal('hide');
					});
				}
				$('#searchGames').bind('keypress',function(event){
			        if(event.keyCode == "13")
			        {
//			        	$('#search').val($('#searchtext').val());
//			        	$('#page').val("1");
			        	$("#searchform").submit();
			        }
			    });
			
			if($( "#import-pgn" ).length){
				$('#import-pgn').click(function() {
					  console.log("import-pgn");
					$('#template-import-game-dialog').modal('show');
				});
			}
			
			if($( ".oauth-popup" ).length){
				$('.oauth-popup').click(function() {
					$.oauthpopup({
						    path: '/chess4life-passport',
						    callback: function(){
						        window.location = "../index";
						    }
						});
				});
			}
			
			if($( ".deleteGame" ).length){
				$('.deleteGame').click(function(ev) {
		            ev.preventDefault();
					var id = $(this).data("gameid");
					var element = $(this).parent();
					$.ajax({
						  type: 'POST',
						  url: "/deleteGame",
						  data: {id:id},
						  success: function (data){
							  console.log(data.result);
							  if (data.result == "ok") {
								  element.remove();
							} else {
								  alert(data.result);
							}
						  }
						});
				});
			}
			
			if($( "#board" ).length){
				console.log($( "#pgn1" ).val());
				var b = new KingdomPGN.ChessBoard('board');
				KingdomPGN.GetMoveList('moveList');
				KingdomPGN.SetPgn($( "#pgn1" ).val());
				KingdomPGN.highlightMove = CA.highlightMove;
				//$( "#board" ).draggable();
//				$( "#moveList" ).draggable();
				
				

				$(document).on('keydown', function(e){
					if(e.which === 37){ chess.navigate(-1); }
					else if(e.which === 39){ chess.navigate(1); }
				});

				$('.game').on('click','[data-turn]', CA.change_turns);

//				$el.on('chess-navigate', CA.highlight);

				$('#chessCtrlPanel').draggable();
				setTimeout(function(){
					CA.highlight();
				},500);
			}
		});
}(chess));