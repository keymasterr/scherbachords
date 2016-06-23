$(document).ready(function() {

  doubleHover('a', 'hover');

  $(window).hashchange( function(){
    activateChords();
  })
  $(window).hashchange();
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
  else if (document.location.hash.length > 2) {
    currTrack = document.location.hash.substring(1);
  }
  else {
    $.modal().close();
    return false;
  }
  var currChords = $('.display .chords_text[chords-id="' + currTrack +'"]').clone();
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
  currTrack = "";
  history.pushState('', '', window.location.href.split('#')[0]);
};
