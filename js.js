$(document).ready(function() {

  doubleHover('a', 'hover');
  activateChords();

  $('.content dd a').click(function() {
    activateChords( $(this) );
  });
});


// «doubleHover» by artpolikarpov
var doubleHover = function(selector, hoverClass) {
  $(document).on('mouseover mouseout', selector, function(e) {
    $(selector)
      .filter('[href="' + $(this).attr('href') + '"]')
      .toggleClass(hoverClass, e.type == 'mouseover');
  });
};

var currTrack = "";

function activateChords(thisObj) {
  if (thisObj) {
    currTrack = thisObj.attr('href').substring(1);
  }
  else if (document.location.hash) {
    currTrack = document.location.hash.substring(1);
  }
  else {
    return false;
  }
  var currChords = $('.display .chords_text[track="' + currTrack +'"]').clone();
  $('.modal').empty().html(currChords);
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
  history.pushState('', '', window.location.href.split('#')[0]);
  currTrack = "";
};
