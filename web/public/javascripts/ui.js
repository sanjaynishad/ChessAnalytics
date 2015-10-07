
$(".modal-wide").on("show.bs.modal", function () {
    var height = $(window).height() - 200;
    $(this).find(".modal-body").css("max-height", height);
});

function loadModal() {

    document.getElementById("current_fen").value = board.get_fen();
    $('#myModal').modal('show');
}

$(document).ready(function () {
    $('select').addClass('form-control');
    $('#btnNewGame').click(function () {
        board.reset();
    });
//    $('#btnNewGame').click();

    $("#ex6").slider();
    var level = 0;
    $("#ex6").on("slide", function (slideEvt) {
        $("#ex6SliderVal").text(slideEvt.value);
        level = slideEvt.value;
    });

    $('.level .slider-track').click(function () {
        level = parseInt($('#ex6').val());
        $("#ex6SliderVal").text(level);
    });

    $('.side a').click(function () {
        var side = parseInt($(this).attr('value'));
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        if (side === 3) {
            side = Math.floor((Math.random() * 2) + 1);
        }
        if (side === 1) {
            $('.player_white select:eq(0) option:eq(0)').prop('selected', true);
            $('.player_white select:eq(0)').get(0).dispatchEvent(evt);

            $('.player_black select:eq(0) option:eq(1)').prop('selected', true);
            $('.player_black select:eq(0)').get(0).dispatchEvent(evt);

            $('.player_black select:eq(1) option:eq(' + level + ')').prop('selected', true);
            $('.player_black select:eq(1)').get(0).dispatchEvent(evt);
            board.change_orientation('white');
        } else if (side === 2) {
            $('.player_black select:eq(0) option:eq(0)').prop('selected', true);
            $('.player_black select:eq(0)').get(0).dispatchEvent(evt);

            $('.player_white select:eq(0) option:eq(1)').prop('selected', true);
            $('.player_white select:eq(0)').get(0).dispatchEvent(evt);

            $('.player_white select:eq(1) option:eq(' + level + ')').prop('selected', true);
            $('.player_white select:eq(1)').get(0).dispatchEvent(evt);
            board.change_orientation('black');
        }

    });

    $(document).scroll(function () {
        var offset = $('.chess_board').offset();
        $('#canvas').offset(offset);
        $('#canvas').width($('.chess_board').width());
        $('#canvas').height($('.chess_board').height());
    });

    $('.player_black select:eq(0)').change(function () {
        if ($(this).val() === 'ai') {
            return;
        }
        if ($(this).val() === 'human') {
            board.change_orientation('black');
        } else {
            board.change_orientation('white');
        }
    });
    $('.player_white select:eq(0)').change(function () {
        if ($(this).val() === 'ai') {
            return;
        }
        if ($(this).val() === 'human') {
            board.change_orientation('white');
        } else {
            board.change_orientation('black');
        }
    });

    $('.cancel').click(function () {
        $('#white').click();
    });
});
