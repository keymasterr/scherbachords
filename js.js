$(document).ready(function() {

  doubleHover('a', 'hover');

  $.get('chords.xml', {},
    xmlOnLoad
  );

  $(window).hashchange( function(){
    activateChords();
  })
  $(window).hashchange();
});

function abcIndex() {
  $('dl.content-contents dt a').each(function(){
    $('.abc_index').append('<a href="#' + $(this).attr('name') + '">' + $(this).text() + '</a>');
  });
};

function goToLetter() {
  var a = {
    49  : 'top',
    70  : 'a',
    188 : 'b',
    68  : 'v',
    85  : 'g',
    76  : 'd',
    84  : 'e',
    186 : 'zh',
    80  : 'z',
    66  : 'i',
    82  : 'k',
    75  : 'l',
    86  : 'm',
    89  : 'n',
    74  : 'o',
    71  : 'p',
    72  : 'r',
    67  : 's',
    78  : 't',
    69  : 'u',
    65  : 'f',
    219 : 'x',
    87  : 'c',
    88  : 'ch',
    73  : 'sh',
    79  : 'w',
    222 : 'eh',
    190 : 'ju',
    90  : 'ja'
  }

  var keys = {};

  $(document).keydown(function (e) {
    var k = a[e.which];
    if (JSON.stringify(keys).length <= 2) {
      keys[e.which] = true;

      if (k) {
        location.hash = "#" + k;
      }
    }
  });

  $(document).keyup(function (e) {
      delete keys[e.which];
  });

}

// «doubleHover» by artpolikarpov
var doubleHover = function(selector, hoverClass) {
  $(document).on('mouseover mouseout', selector, function(e) {
    $(selector)
      .filter('[href="' + $(this).attr('href') + '"]')
      .toggleClass(hoverClass, e.type == 'mouseover');
  });
};

var currTrackId = "";

function trimSpecial(k) {
  if (k.match(/^[0-9a-zA-Zа-яёА-ЯЁ]/)) {
    return k;
  } else if (k) {
    k = k.substring(1);
    return trimSpecial(k);
  } else {
    return '';
  };
};

var chords;
var contAbc = [];
var contYear = [];
function xmlOnLoad( xmlData, strStatus ){

  chords = $( xmlData );
  var track = chords.find( 'track' );

  track.each(function(){
    var id = $(this).attr('id');
    var title = $(this).find('title').text();
    var year = $(this).find('year').text();
    var titleAlt1 = $(this).find('title-alt1').text();
    var titleAlt2 = $(this).find('title-alt2').text();

    contAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +title+ '</a></li>');
    if (titleAlt1) {
      contAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +titleAlt1+ ' (' +title+ ')</a></li>');
    };
    if (titleAlt2) {
      contAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +titleAlt2+ ' (' +title+ ')</a></li>');
    };
  });

  contAbc.sort(function(a, b) {
    a1 = trimSpecial($(a).text());
    b1 = trimSpecial($(b).text());

    return a1.toUpperCase().localeCompare(b1.toUpperCase());
  });
  var contDds = [];
  var prev_char = '';

  $.each(contAbc, function(idx, itm) {
    var cur_char = trimSpecial($(itm).text()).toUpperCase()[0]
    if (cur_char.match(/^[0-9]/)) {
      cur_char = '0…9';
    } else if (cur_char.match(/^[a-zA-Z]/)) {
      cur_char = 'A…Z';
    };

    if (prev_char == cur_char){
      contDds.push(itm)
    } else {
      prev_char = cur_char;
      if ( prev_char != ''){
        contDds.push('</ul></dd>');
      }
      contDds.push('<dt><a>' +cur_char+ '</a></dt>');
      contDds.push('<dd><ul>')
      contDds.push(itm);
    }
  })

  var res = contDds.join('')
  $('.content-contents').append(res);

  abcIndex();
  goToLetter();
};

function activateChords(thisObj) {
  if (thisObj) {
    currTrackId = thisObj.attr('href').substring(1);
  }
  else if (document.location.hash.length > 3 && document.location.hash != '#top') {
    currTrackId = document.location.hash.substring(1);
  }
  else {
    $.modal().close();
    return false;
  }
  var currTrackText = '<div class="chords_text">' + chords.find('track[id="' +currTrackId+'"]').find('text').text() + '</div>';
  $('.modal').empty().html(currTrackText);
  $('.modal').modal().open();
  $.modal({
    onClose: function(){
      clearAddress()
    }
  });
  $('.modal').focus();
};

var clearAddress = function() {
  // document.location.hash = "";
  currTrackId = "";
  history.pushState('', '', window.location.href.split('#')[0]);
};
