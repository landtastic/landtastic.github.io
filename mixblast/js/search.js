var search = function(query,counter) {
	var q = query;
	var c = counter;

	var request = gapi.client.youtube.search.list({
	q: q,
	part: 'snippet',
	maxResults: 20
	//order: 'viewCount'
	});
  
  request.execute(function(response) {
	var searchObj = response.result;
	//these arrays will hold the top 20 results of each one in the loop
	var vIdArr=[], vTitleArr=[], vThumbArr=[];
	if (!searchObj) { console.log('bad search: '+c); }

	$.each(searchObj.items, function(i,x) {
		var vId = x.id.videoId;
		var vTitle = x.snippet.title;
		//console.log(x.snippet);
		if (x.snippet.thumbnails.default.url !=undefined) var vThumb = x.snippet.thumbnails.default.url;
		if (vId===undefined) {
			vId="Not Found"; vTitle="Not Found. Try version refresh button: "; vThumb="img/notfound.png"; 
		}

		vIdArr.push(vId);
		vTitleArr.push(vTitle);
		vThumbArr.push(vThumb);
		//global object of all the song results
		search.vidObjArray[c] = {
			vid:vIdArr,
			title:vTitleArr, 
			thumb:vThumbArr
		};

		//display list, use only first result of each
		if (i === 0) {
			search.topvIdArray.push(vId);	
			search.topvTitleArray.push(vTitle);
			search.topvThumbArray.push(vThumb);
			//start the first video right away while the playlist loads

			if (search.topvIdArray.length == 1) {
				//only cue on the first search, keep the video running on subsequent searches
				//////if (count==1) cuePlayer();
				if (search.count==1) loadVid(search.topvIdArray[0], 0, "medium"); //ok nevermind, let's autoplay instead of cue
			} 

			renderPlaylist(c,vThumb,vId,vTitle);
			c++;
		}
	});
  });	
};


function multiSearch() {
//alert(mixBuilder.fromFirstField);
//alert(($('#mixbuilder-buttons').css("visibility") == "hidden"));
//alert($('#query').is(':hidden'));
//alert(rssfeed);
	//first time search/search from mixbuilder if textarea blank
	/*
	if (($('#mixbuilder-buttons').is(':hidden')) && ($('#query').is(':hidden')) && (rssfeed==='')) {
		$("#logo-wrapper").animate({ 'width':'50%', 'height':'50px', 'margin-bottom': '20px', 'margin-top': '20px' }, "fast");
		$("#mixbuilder-buttons").show();
		$("#query").show().val('');
		mixBuilder.fromFirstField = true;
		mixBuilder.search();
		$("#query").hide();
		return;
	}
	*/
	//mixBuilder.fromFirstField = false;
	//toggle edit playlist
	editSearchTerm(0);
	search.vidObjArray = {}; //, search.prev_vidObjArray = {};
	search.topvIdArray = []; search.topvTitleArray =[]; search.topvThumbArray = []; search.listArray = [];
	search.vidcount = 0; search.playcount = 0; search.done = false; 
	if (!search.count) search.count = 0;

	//show video player
	$('#player-container').show();
	$('#button-container').show();
	//erase previous search
	$('#search-container').empty();
	$('#errormsg').hide();
	$('#advanced-container').hide();
	$('#youtube-playlist-container').show();
	$('#player-thumb-close').show();
	$("#mixbuilder-buttons").show();
	if (search.topvIdArray) {
		search.topvIdArray.length = 0; search.topvTitleArray.length = 0; search.topvThumbArray.length = 0;
		search.listArray.length = 0;
	}
	pastBlasts.add($('#query').val());
	//var mobile_width = 666;
	//if ($(window).width() < mobile_width) $("#pb-icon" ).hide();

	//split texarea into lines
	var lines = $('#query').val().split(/\n/);
	//console.log(lines);
	//only get non-whitespace lines, push into listArray
	for (var i=0; i < lines.length; i++) {
	  if (/\S/.test(lines[i])) {
		search.listArray.push($.trim(lines[i]));
	  }
	}
	
	var x = 0;
	var searchnum = search.listArray.length;
	if ((searchnum < 1)) { 
		$('#errormsg-txt').html('Error. <br>No songs. Put a list of songs into the textbox.');
		//$("#query").val($("#query").prop("defaultValue")).css("color", "#999");
		var t=setTimeout(function(){$('#editplaylist').trigger( "click" );},1000);
		$('#errormsg').show();
		return false; 
	}

	//$("#query").animate({height:'200px'},200);
	//$("#logo").animate({height:'0px',width:'100%',marginBottom:'20px'});
	//$("#logo-wrapper").animate({ 'width':'50%', 'height':'50px', 'marginBottom': '20px', 'marginTop': '20px' }, "fast");

	(function setInterval_afterDone(){

		/* do search function */
		if (search.listArray[x]) { search(search.listArray[x],x); }// else { console.log('error: ILB'); return false;}
		
		x++;
		
		//if(ready2search==true) waittime = 300; //wait for player to animate in
		
		var waittime = 600; 
		var timerId = setTimeout(setInterval_afterDone, waittime);
		if(x==searchnum) {
			//ready the playlist button
			$('#playlist-button').attr('disabled', false);
			$("#shufflebutton").removeClass("disabled");

			search.done = true;
			//player.cuePlaylist(search.topvIdArray);
			/////todo: start with vidObjArray[vidcount].vid[0]

			clearTimeout(timerId);
		}
	})();
	search.count++;
}

var mixBuilder = {
	render : function (artistName,trackName,albumName) {

		var song_num = $("#topSongs-num").val();
		if (search.dropVal == 'drop-topSongs') {
			mixBuilder.getJSON("https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist="+artistName+"&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?",artistName,trackName,albumName)
		} else if (search.dropVal == 'drop-similarSongs'){
			mixBuilder.getJSON("https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist="+artistName+"&track="+trackName+"&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?",artistName,trackName,albumName)
		} else if (search.dropVal == 'drop-topAlbums'){
			mixBuilder.getJSON("https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist="+artistName+"&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ 100 +"&format=json&callback=?",artistName,trackName)
		} else if (search.dropVal == 'drop-album'){
			mixBuilder.getJSON("https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist="+artistName+"&album="+albumName+"&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?",artistName,trackName,albumName)
		} else if (search.dropVal == 'drop-quickMix'){
			mixBuilder.getJSON("https://developer.echonest.com/api/v4/playlist/static?api_key=KHXHOPL1UHQ0LU1ES&artist="+artistName+"&type=artist-radio&results="+100,artistName,trackName);
			console.log("https://developer.echonest.com/api/v4/playlist/static?api_key=KHXHOPL1UHQ0LU1ES&artist="+artistName+"&type=artist-radio&results="+100)
		} else {
			console.log('dropdown not selected');
			mixBuilder.getJSON("https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist="+artistName+"&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&limit=100&format=json&callback=?",artistName,trackName,albumName)
		}
		showRelated.artists(artistName);
	},
	search : function () {
		if (search.dropVal == 'drop-similarSongs') {
			mixBuilder.render($.trim($("#mixbuilder-artist").val()),$.trim($("#mixbuilder-song").val()),'');
		} else if (search.dropVal == 'drop-album') {
			mixBuilder.render($.trim($("#mixbuilder-artist").val()),'',$.trim($("#mixbuilder-album").val()));
		} else {
			mixBuilder.render($.trim($("#mixbuilder-artist").val()),'','');
		}
		//showRelated.artists($.trim($("#mixbuilder-artist").val()));
	},
	getJSON : function(apiURL,artistName,trackName,albumName) {
		//var song_num = $("#topSongs-num").val();
		$.getJSON(apiURL, function(data) {
			//if (!mixBuilder.songlist) mixBuilder.songlist = '';
			mixBuilder.songlist = '';
			if ((data.toptracks != undefined) && (data.toptracks.track != undefined)) {
				$.each(data.toptracks.track, function(i, item) {
					mixBuilder.songlist += artistName + " - " + item.name + "\n";
				});
			} else if (data.similartracks != undefined) {
				mixBuilder.songlist = artistName + " - " + trackName + "\n";
				$.each(data.similartracks.track, function(i, item) {
					mixBuilder.songlist += item.artist.name + " - " + item.name + "\n";
				});
			} else if (data.topalbums != undefined) {
				mixBuilder.songlist = '';
				$.each(data.topalbums.album, function(i, item) {
					mixBuilder.songlist += artistName + " - " + item.name + " - full" + "\n";
				});
			} else if (data.album != undefined) {
				mixBuilder.songlist = '';
				$.each(data.album.tracks.track, function(i, item) {
					mixBuilder.songlist += item.artist.name + " - " + item.name + "\n";
				});
			} else if (data.response != undefined) {
				$.each(data.response.songs, function(i, item) {
					mixBuilder.songlist += item.artist_name + " - " + item.title + "\n";
				});
			} else {
				$('#errormsg').show();
				$('#errormsg-txt').html(': ( <br><br>Error loading videos for: '+artistName+'<br><br>Check spelling?');
			}
		})
		.done(function() {
			//console.log( "second success" );
		})
		.fail(function() {
			console.log( "error" );
			$('#errormsg').show();
			$('#errormsg-text').html(apiURL+' : (() <br><br>Error loading videos for: '+artistName+'<br><br>Check spelling?');
		})
		.always(function() {
			//overwrite text list if first search
			if ((search.count === undefined)) {
				$('#query').val(mixBuilder.songlist);
				search.count = 0;
			} else if (($.trim($("#query").val()) == '')) {
				$('#query').val(mixBuilder.songlist);
			} else {
				//add to list
				$('#query').val($('#query').val() + mixBuilder.songlist);
				var textarea = document.getElementById('query');
				var t=setTimeout(function(){textarea.scrollTop = textarea.scrollHeight;},1000);
			}
			 //$('#search-button').trigger( "click" );
			//console.log('hey ' + mixBuilder.fromFirstField);
			//if (mixBuilder.fromFirstField) multiSearch();
			//alert($.trim($("#mixbuilder-artist").val()));
		});
	}
};

//legacy codefix
function allSongsBy(artistName,song_num) {
        if (!song_num) var song_num = $("#topSongs-num").val();
        $.getJSON("https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist="+artistName+"&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?" , function( data ) {
        	if (!songlist) var songlist= '';
                if ((data.toptracks != undefined) && (data.toptracks.track != undefined)) {
                        $.each(data.toptracks.track, function(i, item) {
                                songlist += artistName + " - " + item.name + "\n";
                        });

                        if (search.count === undefined) {
                                $('#query').val(songlist);
                                search.count = 0;
                        } else {
                                $('#query').val($('#query').val() + songlist);
                        }

                         //$('#search-button').trigger( "click" );
                        var textarea = document.getElementById('query');
                        var t=setTimeout(function(){textarea.scrollTop = textarea.scrollHeight;},1000);
                } else {
                        $('#errormsg').show();
                        $('#errormsg-txt').html(': ( <br><br>Error loading videos by: '+artistName+'<br><br>Check spelling?');
                }
        });

}

$('.dropdown-menu li').click(function( event ){
	var $target = $( event.currentTarget );
	search.dropVal = this.id;
	dropdownSwitcher();
	$target.closest( '.btn-group' )
		.find( '[data-bind="label"]' ).html( $target.html() )
			.end()
		.children( '.dropdown-toggle' ).dropdown( 'toggle' );

		return false;
});

function dropdownSwitcher() {
	if (search.dropVal == 'drop-similarSongs') {
		$('#mixbuilder-artist').show().css("width","45%");
		$('#mixbuilder-song').show().css("width","45%");
		$('#mixbuilder-album').hide();
		$("#songNum").css("display","inline-block");
		//if (($('#mixbuilder-buttons').is(':hidden')) && ($(document).width() >= 992)) $('#mixbuilder-song').css("width","83.4%");
	} else if (search.dropVal == 'drop-album') {
		$('#mixbuilder-artist').show().css("width","45%");
		$('#mixbuilder-song').hide();
		$('#mixbuilder-album').show().css("width","45%");
		//$("#songNum").css("display","none");
		//if (($('#mixbuilder-buttons').is(':hidden')) && ($(document).width() >= 992)) $('#mixbuilder-album').css("width","83.4%");
	} else if (search.dropVal == 'drop-paste') {
		editTextList();
		$('#mixbuilder-artist').hide();
		$('#mixbuilder-song').hide();
		$('#mixbuilder-album').hide();
	} else {
		$('#mixbuilder-artist').show().css("width","95%");
		$('#mixbuilder-song').hide();
		$('#mixbuilder-album').hide();
		$("#songNum").css("display","inline-block");
		//if (($('#mixbuilder-buttons').is(':hidden')) && ($(document).width() >= 992)) $('#mixbuilder-artist').css("width","133.3%");
	}
console.log(search.dropVal);
	if ((search.dropVal == 'drop-quickMix') || (search.dropVal == 'drop-topAlbums') || (search.dropVal == 'drop-album')) {
		//$("#topSongs-num").val('');
		$("#songNum").hide();
		if ($(document).width() < 992) $("#mixbuilder-dropdown").css('margin-left','0px')
	} else {
		$("#songNum").show();
		if ($(document).width() < 992) $("#mixbuilder-dropdown").css('margin-left','60px')
	}
	localStorage.setItem('dropdown-lastvalue', search.dropVal);
}

$("#topSongs-num, #mixbuilder-artist, #mixbuilder-song, #mixbuilder-album").keypress(function (e) {
 var key = e.which;
 if(key == 13) {

 	//if (mixBuilder.fromFirstField == true) {
 	//	multiSearch();
 	//} else {
 		mixBuilder.search();
 	//}

	$("#ui-id-1").hide();
	//return false;  
 }
});  

//#topSongs-num, 
$("#mixbuilder-artist, #mixbuilder-song, #mixbuilder-album").click(function (e){
	$(this).select();this.setSelectionRange(0, 9999);
});

$("#mixbuilder-search-button").click(function(){
	mixBuilder.search();
});


var showRelated =  {
	artists : function(artistName) {
		$("#related-container" ).show();
		var addString;
		addString = " Songs By A Related Artist:";
		$.getJSON("https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=" + artistName + "&limit=60&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&format=json", function(data) {
			var curArtist;
			var artistList = '';
			if (data.similarartists) {
				$.each(data.similarartists.artist, function(i, item) {
					if (item.name) {
						curArtist = item.name.replace(/["']/g, "\\'");
					} else {
						console.log('related artist error');
						//$("#related-container").html("<br><hr class='similar-top'>Error loading related artists: "+artistName); 
					}
					artistList += '<a class="similar-artistButton" href="javascript:void(0);" onclick="showRelated.addSongs(\''+ curArtist +'\')">' + item.name + '</a>';
					if (i < data.similarartists.artist.length-1) artistList += " ";
				});
				$("#related-container").html("<br><hr class='similar-top'><span id='similarArtTitle'>Add <input id='similar-num' value='10' type='number' pattern='[0-9]*'' inputmode='numeric'></span><span id='addString'>"+ addString +"</span></span>&nbsp;" + artistList);
			} else {
				$("#related-container").html("<br><hr class='similar-top'>Error loading related artists: "+artistName); 
			}
		});
		$("#related-more").show();
	},
	addSongs : function(curArtist) {
		$('#mixbuilder-artist').val(curArtist);
		allSongsBy(curArtist,$('#similar-num').val());
		//mixBuilder.render($.trim(curArtist),'');
		return false;
	}
};
$("#related-more").click(function() {
    	if ($("#related-more").text() == '...') {
			$('#related-container').css({height: 'auto'});
    		$("#related-more").text('Less...'); 
    	} else {
    		$('#related-container').css({height: '134px'});
    		$("#related-more").text('...');
    	}
});


$("#shuffletext").click(function(){
	var lines = $('#query').val().split("\n");
	shuffle(lines);
	//var randomlines = lines.join("\n");
	var randomlines = '';
	for (var i=0; i < lines.length; i++) {
		if (/\S/.test(lines[i])) {
			randomlines += lines[i] + '\n';
			//if (i != lines.length) randomlines += '\n';
		}
	}
	//randomlines = randomlines.replace(/^(\r\n)|(\n)/,'');
	$('#query').val(randomlines);

});
//todo: undo clear list
$("#query-clear").click(function(){
	$("#query").val('');
});

$("#editplaylist").click(function(){
	editSearchTerm(0);
});
$("#player-thumb-close").click(function(){
	editSearchTerm(0);
});
$("#closeAdvanced").click(function(){
	$('#advanced-container').slideToggle("fast");
});

function editSearchTerm(lineNumber) {
	var toggleEditText = $("#editplaylist").html();
	var qHeightClosed = '205px'; var qHeightOpen = '282px'; var vTop = '85px';
	if ($(document).width() < 992) { qHeightClosed = '40px'; var qHeightOpen = '345px'; var vTop = '127px'; }
	if (toggleEditText.indexOf("Edit Playlist") > -1) {
		//thumbnail player
		$("#player-container").css({top: '0px', right: '0px', width: '160px', height: '87px'});
		$('#query').animate({height: '345px'}, 'fast', function() {
			$("#related-container").show(); $("#related-more").show();
		});
		$("#player-thumb-close").show();
		$("#mixbuilder-bar").show();
		$("#mixbuilder-buttons").show();
		$("#editplaylist").html(toggleEditText.replace("Edit Playlist","Close Playlist Editor"));
	} else {
		$("#related-container").hide(); $("#related-more").hide();
		$("#query").show();
		//$("#logo").animate({marginTop: "2%",'marginBottom': '10px'}, "fast");
		$('#player-container').css({top: vTop, right: '0px', width: '100%', height: '364px'}, function() {
			$("#mixbuilder-bar").hide();
  		});
		$('#query').animate({height: qHeightClosed}, 'fast');
		$("#player-thumb-close").hide();
		$("#mixbuilder-buttons").show();
		$("#editplaylist").html(toggleEditText.replace("Close Playlist Editor","Edit Playlist"));
	}
	/*
	var input = $("#query");
	var lineHeight = 1.14;
	input.scrollTop(lineNumber * lineHeight);
	window.scrollTo(0, 0);
	*/
}

$(document).keydown(function(e) {
	//allow arrow keys if an input is focused
	if($("input,textarea").is(":focus")) return; 

	switch(e.which) {
		case 37: nextVideo(false);// left
		break;

		case 192: editSearchTerm(0);// `
		return;

		case 39: nextVideo(true);// right
		break;

		case 32: playPause();// space
		e.preventDefault();
		break;

		default: return; // exit this handler for other keys
	}
	//e.preventDefault(); // prevent the default action (scroll / move caret)
});