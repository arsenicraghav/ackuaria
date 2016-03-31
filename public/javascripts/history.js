$(document).ready(function(){
	var filter_count = 0;
	var _last_data = info;

	$.fn.toggleDisabled = function() {
		return this.each(function(){
			this.disabled = !this.disabled;
		});
	};

	$("#initCalendar").datepicker();
	$("#finalCalendar").datepicker();

	document.getElementById("initButton").onclick = function(e) {
		$("#initCalendar").focus();
	}
	document.getElementById("finalButton").onclick = function(e) {
		$("#finalCalendar").focus();
	}
	$('#searchBar').keyup(function () {
        search();
    });

    var search = function() {
        var filter_array = new Array();
        var filter = $('#searchBar')[0].value.toLowerCase();  // no need to call jQuery here
        filter_array = filter.split(' '); // split the user input at the spaces
        var arrayLength = filter_array.length; // Get the length of the filter array
        $('.room').each(function() {
            var _this = $(this);
            var title1 = _this.find('.roomID').text().toLowerCase();
            var title2 = _this.find('.roomName').text().toLowerCase();
            var hidden = 0;
            for (var i = 0; i < arrayLength; i++) {
                if (title1.indexOf(filter_array[i]) < 0 && title2.indexOf(filter_array[i]) < 0) {
                    _this.hide();
                    hidden = 1;
                }
            }
            if (hidden == 0)  {
               _this.show();
            }
        });
    }

	var delete_filter = function(target) {
		$(target).remove();
	}	


	var delete_all_filters = function() {
		$("#initCalendar").val('');
		$("#finalCalendar").val('');
		$('#room_id').val('');
		$('#room_name').val('');

		$('#key_0 option:eq(0)').prop('selected', true);
		$('#value_0').val('');

		for (var i=1; i<=filter_count; i++){
			var target = '#filter_row_' + i;
			$(target).remove();
		}
	}

	var new_filter = function() {
		filter_count++;
		var html = '<div class="row filter_row key_value" id="filter_row_' + filter_count + '">' + 
			'<div class="filters col-md-2"><span>Key </span></div>' +
			'<div class="filters col-md-4"><div class="form-group">' + 
            '<select class="form-control" id="key_' + filter_count + '">' +
            '<option value="">Select key</option>';

        for (var k in keys) {
        	html = html + '<option>' + keys[k] + '</option>';
        }

        html += '</select></div></div>' + 
			'<div class="filters col-md-1"><span class="value">Value </span></div>' + 
			'<div class="filters col-md-4"><input id="value_' + filter_count + '" class="filter" type="text" placeholder="Insert value"></div>' + 
			'<div class="filters col-md-1"><span class="button toolIcon fa fa-times removeButton" todelete="filter_row_' + filter_count + '" id="remove_button_' + filter_count + '"></span></div>' + 
			'</div>';

		$(html).insertBefore($('#addFilter_row'));
                           
		$('#remove_button_' + filter_count).click(function() {
			var target = '#' + $(this).attr('todelete');
			delete_filter(target);
		});
	};

	document.getElementById("addButton").onclick = function(e) {
		new_filter();
	}

	$('#remove_button_1').click(function() {
		var target = '#' + $(this).attr('todelete');
		delete_filter(target);
	});
	
	$('#deleteFiltersButton').click(function() {
		delete_all_filters();
	});

	$('#searchButton').click(function() {

		var url = 'info/rooms?';

		var room_id = $('#room_id').val();
		var room_name = $('#room_name').val();

		if (room_id !== '') {
			url = 'info/' + room_id + '?';
		}

		if (room_name !== '') {
			url = url + '_name=' + room_name + '&';  
		}

		for (var i = 0; i < $('.key_value').length; i++) {
			var key = $('#key_' + i).val();
			var value = $('#value_' + i).val();

			if (key !== '' && key !== undefined) {
				url = url + key + '=' + value + '&';  
			}
		}

		var initDate = $("#initCalendar").datepicker('getDate');
		var finalDate = $("#finalCalendar").datepicker('getDate');

		if (initDate) {
			var i_year = initDate.getFullYear() + '';
			var i_month = initDate.getMonth() + 1 + '';
			var i_day = initDate.getDate() + '';

			if (i_month.length === 1) i_month = '0' + i_month;
			if (i_day.length === 1) i_day = '0' + i_day;

			url += 'init=' + i_day  + i_month + i_year + '&';
		}

		if (finalDate) {
			var f_year = finalDate.getFullYear() + '';
			var f_month = finalDate.getMonth() + 1 + '';
			var f_day = finalDate.getDate() + '';

			if (f_month.length === 1) f_month = '0' + f_month;
			if (f_day.length === 1) i_day = '0' + i_day;

			url += 'final=' + f_day  + f_month + f_year;
		}

		$.ajax({
			url: url,
			type: 'GET',
			statusCode: {
				200: function (data, status, xhr) {
					_last_data = data;
					paintRoomsList(data.room_list);
					paintRoomsStats(data);
				},
				// TODO: Handle errors 
				500: function (data, status, xhr) {

				}
			}
		});
	});

	$('#exportButton').click(function() {
		var csv = get_csv(_last_data);

        var blob = new Blob([csv], {type: "text/plain"});
        var blobURL = window.URL.createObjectURL(blob);

        var a = document.createElement("a");
	    document.body.appendChild(a);
	    a.style = "display: none";
	        
        a.href = blobURL;
        a.download = 'ackuaria.csv';
        a.click();
        window.URL.revokeObjectURL(blobURL);
        document.body.removeChild(a);
        
	});
});

var paintRoomsStats = function(data){
    $('#stats_sessions').html(data.n_sessions);
    $('#stats_rooms').html(data.n_rooms);
    $('#stats_users').html(data.n_users);
    $('#stats_time').html(data.time_published);
};

var paintRoomsList = function(room_list){
    $('#bodyTable').html("");
    var nRooms = Object.keys(room_list).length;
    for (var room in room_list) {
        var roomID = room;
        createNewRoomList(roomID, room_list[room]);        
    }

    if (nRooms === 0) {
    	$('#bodyTable').append('<tr class="show_list room_empty"><td colspan="2"><span>No rooms</span></td></tr>');
    }
};

var createNewRoomList = function(roomID, room){
	var roomName = room.data._name;
	var nSessions = room.n_sessions;
	var nUsers = room.n_users;
	var time = room.time_published;

    $('#bodyTable').append('<tr class="room show_list" id="room_' + roomID + '" data-room_id="' + roomID + '"><td class="roomID">'+ roomID + '</td><td colspan="2" class="roomName">' + roomName + '</td></tr>');
    $('#bodyTable').append('<tr class="room_detail show_list hidden" id="room_detail_' + roomID + '" data-room_id="' + roomID + '"><td colspan="3">' + 
    	'<span>Sessions </span><span class="info bold dark">' +  nSessions + '</span>' +
    	'<span>Users </span><span class="info bold dark">' +  nUsers + '</span>' +
    	'<span>Time published </span><span class="info bold dark">' +  time + '</span>' +
    	'</td></tr>');
    $('#room_' + roomID).click(function() {
        var room_id = $(this).data('room_id');

       	$('.room').removeClass('selected');
        if (!$('#room_detail_' + room_id).hasClass('hidden')) {
        	$('.room_detail').addClass('hidden');
        } else {
        	$('.room_detail').addClass('hidden');
        	$('#room_detail_' + room_id).removeClass('hidden');
        	$('#room_' + room_id).addClass('selected');
        }

    })
}
