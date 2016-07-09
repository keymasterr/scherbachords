$(document).ready(function() {
    chordsCreation();
    doubleHover();
    $(window).hashchange();
});

var chords;
var sortedByAbcHtml;
var sortedByYearHtml;
var currTrackId;

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
    $(document).prop('title',  chords.find('track[id="' +currTrackId+'"]').find('title').text() + ' — Щербаккорды');

    $.modal({
        onClose: function(){
           clearAddress();
      }
    });
    $('.modal').focus();
};

var clearAddress = function() {
  // document.location.hash = "";
  currTrackId = "";
  $(document).prop('title', 'Щербаккорды');
  history.pushState('', '', window.location.href.split('#')[0]);
};

function chordsCreation() {
    chords = $( getXML() );
    var track  = chords.find( 'track' );
    var byAbc  = [];
    var byYear = [];
    var sortedByAbc  = [];
    var sortedByYear = [];
    var prevCharAbc  = '';
    var prevCharYear = '';

    track.each(function(){
        var id        = $(this).attr('id');
        var title     = $(this).find('title').text();
        var year      = $(this).find('year').text();
        var titleAlt1 = $(this).find('title-alt1').text();
        var titleAlt2 = $(this).find('title-alt2').text();

        byAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +firstQuote(title)+ '</a></li>');
        if (titleAlt1) {
            byAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +firstQuote(titleAlt1)+ ' (' +title+ ')</a></li>');
        };
        if (titleAlt2) {
            byAbc.push('<li><a href="#' +id+ '" data-year="' +year+ '">' +firstQuote(titleAlt2)+ ' (' +title+ ')</a></li>');
        };

        var match = year.match(/\d{4}/g);
        $.each(match, function(idx, itm) {
            var sortYear = itm + '';
            if (titleAlt1 && titleAlt2) {
                byYear.push('<li><a href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title+ ', ' +titleAlt2+ ' (' +titleAlt1+ ')</a></li>');
            } else if (titleAlt1) {
                byYear.push('<li><a href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title+ ' (' +titleAlt1+ ')</a></li>');
            } else {
                byYear.push('<li><a href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title+ '</a></li>');
            };
        });
    });

    byAbc.sort(function(a, b) {
        a = trimSpecial($(a).text());
        b = trimSpecial($(b).text());
        return a.toUpperCase().localeCompare(b.toUpperCase());
    });

    $.each(byAbc, function(idx, itm) {
        var curChar = trimSpecial($(itm).text()).toUpperCase()[0];
        if (curChar.match(/^[0-9]/)) {
            curChar = '0…9';
        } else if (curChar.match(/^[a-zA-Z]/)) {
            curChar = 'A…Z';
        };

        if (prevCharAbc == curChar){
            sortedByAbc.push(itm)
        } else {
            prevCharAbc = curChar;
            if ( prevCharAbc != ''){
                sortedByAbc.push('</ul></dd>');
            }
            sortedByAbc.push('<dt><a>' +curChar+ '</a></dt>');
            sortedByAbc.push('<dd><ul>')
            sortedByAbc.push(itm);
        };
    });

    sortedByAbcHtml = sortedByAbc.join('');
    prevCharAbc = '';

    byYear.sort(function(a, b) {
        a = trimSpecial($('a',a).data('yearSort'));
        b = trimSpecial($('a',b).data('yearSort'));
        return a.localeCompare(b);
    });

    $.each(byYear, function(idx, itm) {
        var curChar = trimSpecial($('a', itm).data('yearSort'));
        if (prevCharYear == curChar){
            sortedByYear.push(itm)
        } else {
            prevCharYear = curChar;
            if ( prevCharYear != ''){
                sortedByYear.push('</ul></dd>');
            }
            sortedByYear.push('<dt><a>' +$('a', itm).data('yearSort')+ '</a></dt>');
            sortedByYear.push('<dd><ul>')
            sortedByYear.push(itm);
        };
    });

    sortedByYearHtml = sortedByYear.join('');
    $('.page_title').append('<span class="sorting_toggler by-abc"><span class="active">по алфавиту</span> / <span>по годам</span></span>');
    $('.sorting_toggler span').click(function() {
        if ($(this).hasClass('active')) {
            sortToggle();
        }
    });
    prevCharYear = '';

    $('body').append('<div class="modal" tabindex="1"></div>');
    if (Cookies.get('sorting') == 'year') {
        sortToggle();
    };
    sortToggle();


    $(window).hashchange( function(){
      activateChords();
    })
};

// Hanging quote mark if it is first character
function firstQuote(text) {
    if (text[0] == '«') {
        text = '<span style="margin-left:-.6em;">«</span>' + text.substring(1);
    };
    return text;
}

function sortToggle() {
    if ( $('.sorting_toggler .active').text() == 'по годам' ) {
        $('.sorting_toggler span').toggleClass('active');
        $('.content_contents').empty().append(sortedByYearHtml);
        Cookies.set('sorting','year');
    } else {
        $('.sorting_toggler span').toggleClass('active');
        $('.content_contents').empty().append(sortedByAbcHtml);
        Cookies.set('sorting','abc');
    }
};

function getXML() {
    var XML = null;
    $.ajax({
        url:     'chords.xml',
        dataType:'xml',
        async:    false,
        success:  function(data) {
            XML = data;
        }
    });
    return XML;
};

// Delete unwanted first symbols from string
function trimSpecial(t) {
    if (typeof t !== 'undefined') {
        t = t + '';
        if (t.match(/^[0-9a-zA-Zа-яёА-ЯЁ]/)) {
            return t;
        } else {
            t = t.substring(1);
            return trimSpecial(t);
        };
    } else {
        return '';
    };
};

// «doubleHover» by artpolikarpov
var doubleHover = function(selector, hoverClass) {
  $(document).on('mouseover mouseout', selector, function(e) {
    $(selector)
      .filter('[href="' + $(this).attr('href') + '"]')
      .toggleClass(hoverClass, e.type == 'mouseover');
  });
};
