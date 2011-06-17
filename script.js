//
// Initialize data
//
const musixMatchApiKey = 'b7ebc8c8ceff3dee95dfd85e2d7a239f';
const musicMetricApiKey = '71a1c2c497fa11e09d5600163e499d92';

const MAX_NUMBER_OF_TRACKS = 10;
const RESULT_SELECTORS = ["artist-a", "artist-b"];
const DEFAULT_INPUTS = ["Justin Bieber", "Rebecca Black"];
const EXAMPLES = [
        ["Hammerfall", "Metallica"],
        ["Britney Spears", "Lady Gaga"],
        ["Prince", "Madonna"],
        ["Eminem", "50 Cent"],
        ["Snoop Dog", "2pac"],
        ["Neil Young", "Bob Dylan"]
      ];

var lyrics;
var counter;
var numberOfTracks;
var output;

var initGlobals = function() {
  lyrics = {};
  counter = {};
  numberOfTracks = {};
  output = [];
}

//
//  API Queries
//

var getTracks = function(artist, resultSelector) {
  $.getJSON("http://api.musixmatch.com/ws/1.1/track.search?callback=?",
    {
      apikey: musixMatchApiKey,
      format: "jsonp",
      q_artist: artist
    },
    function(data) {
      if ( !(data.message.body.track_list[0] && data.message.body.track_list[0].track) ) {
        $("body").removeClass().addClass("not-found");
        $("div.not-found h3 span").text("\'" + artist + "\'");
      } else {
        $(".results ." + resultSelector + " .name").
          text(data.message.body.track_list[0].track.artist_name);

        var tracks = data.message.body.track_list;

        numberOfTracks[resultSelector] = Math.min(tracks.length, MAX_NUMBER_OF_TRACKS)

        $.each(data.message.body.track_list, function(i, item) {
          getLyrics(item.track.track_id, resultSelector);
          if ( i == numberOfTracks[resultSelector] - 1 ) return false;
        });
      }
    })
};

var getLyrics = function(trackId, resultSelector) {
  var doNext = function(lyrics, resultSelector) {
    if ( !counter[resultSelector] ) counter[resultSelector] = 0;

    counter[resultSelector] += 1

    if ( counter[resultSelector] >= numberOfTracks[resultSelector] ) {
      getSentiment(lyrics[resultSelector], resultSelector);
    }
  };

  $.getJSON("http://api.musixmatch.com/ws/1.1/track.lyrics.get?callback=?",
    {
      apikey: musixMatchApiKey,
      format: "jsonp",
      track_id: trackId
    },
    function(data) {
      if ( !lyrics[resultSelector] ) lyrics[resultSelector] = Array();

      if ( data.message.body.lyrics && data.message.body.lyrics.lyrics_body ) {
        lyrics[resultSelector].push( data.message.body.lyrics.lyrics_body );
      };

      doNext(lyrics, resultSelector);
    }).error(function () { doNext(lyrics, resultSelector) } );
};

var getSentiment = function(lyrics, resultSelector) {
  lyrics = lyrics.filter( function(item) { return (item != '') } )

  $.post("http://apib2.semetric.com/sentiment?token=" + musicMetricApiKey, 
    { 'text[]' : lyrics },
    function(data) {
      averageSentiment = intArrayAverage(
        data.response.map(
          function(e) { return e.score } 
        )
      );

      // Output
      output.push([ resultSelector, averageSentiment ] );

      if ( output.length >= RESULT_SELECTORS.length ) {
        $('#submit').removeClass();
        $('body').removeClass().addClass('results');
        $.each(output, function(i, element) {
          $(".results ." + element[0] + " .bar").animate( { height: ((element[1] * 60).toString() + "px") }, 500)
        });
      }

      winner = output.reduce( function(previous, current, index, array) {
        if (current[1] > previous[1]) {
          return current;
        } else {
          return previous;
        }
      });

      $("div.results h2.winner")
        .text("Wow, " + $(".results ." + winner[0] + " .name").text() + " has a potty mouth!")
        .delay(2000)
        .fadeIn(2000);
    }
  );
};

//
//  Meat Function
//
var start = function(artists) {
  initGlobals();

  // Output
  $(".results .displays").html("");
  $.each(RESULT_SELECTORS, function(i, selector) {

    $("#submit")
      .text(".")
      .waitingDots("waiting", 4, function(e) {});

    $(".templates .result")
      .clone()
      .appendTo(".results .displays")
      .addClass(selector);

    getTracks(artists[i], selector);
  });
};

//
// Inital Event Setup
//
$(document).ready( function() {
    // Submit
    $("#submit").click( function() {
      start(
        RESULT_SELECTORS.map( function(selector) {
          return( $('.start input.' + selector).val() )
        })
      );
    });

    // Inputs submit-on-enter
    $.each(RESULT_SELECTORS, function(i, selector) {
      $(".start input." + selector).keypress( function(e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $('#submit').click();
            return false;
        } else {
            return true;
        }
      });
    });

    // Inputs smart defaults
    $.each(RESULT_SELECTORS, function(i, selector) {
      $(".start input." + selector).focus(function() {
        // TODO This no worky
        if ( $.inArray(DEFAULT_INPUTS, $(this).val().toString()) != -1 ) {
          $(this).value('');
        };
      });

      $(".start input." + selector).blur(function() {
        if( $(this).val() == '' ) {
          $(this).val(DEFAULT_INPUTS[i]);
        };
      });
    });

    // Reset
    $("input.start").click( function() {
      $('.inputs input.artist-a').val("");
      $('.inputs input.artist-b').val("");
      $("div.results .winner").text("").hide();
      $("#submit").text("GO!");

      $('body').removeClass().addClass('start');
    });

    // Examples
    $.each(EXAMPLES, function(i, example) {
      $(".templates .example-element")
        .clone()
        .find("a").text( example.join(" vs. ") )
        .click(function() { start( example ) } ).end()
        .appendTo("div.start ul.examples");
    });
  }
);

//
// Utils
//

var intArrayAverage = function(array) {
  return (
    array.reduce(
      function(previous, current) { return( previous + current ) },
      0) / array.length
  )
};
