$(document).ready(function() {
    chordsCreation();
    doubleHover('a','hover');
    $(window).hashchange();
});

var chords,
    sortedByAbcHtml,
    sortedByYearHtml,
    currTrackId,
    starray;

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
    var currChords = chords.find('track[id="' +currTrackId+'"]');

    var currTrackHeader = '<div class="chords_header"><h2 href="#' +currTrackId+ '">' +currChords.find('title').text()+ '<span class="track_starred-star">&#9733;</span></h2><h3>' +currChords.find('title-alt2').text()+ '</h3><h4>' +currChords.find('year').text()+ '</h4><p class="subtitle">' +currChords.find('subtitle').text()+ '</p></div>';
    var currTrackText = '<div class="chords_text">' + currChords.find('text').text() + '</div>';
    var currTrack = currTrackHeader + currTrackText;

    $('.modal').empty().html(currTrack).modal().open();
    $(document).prop('title',  chords.find('track[id="' +currTrackId+'"]').find('title').text() + ' — Щербаккорды');

    setStarred();

    $.modal({
        onClose: function() {
            clearAddress();
            setStarred();
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
    var track  = chords.find( 'track' ),
        byAbc  = [],
        byYear = [],
        sortedByAbc  = [],
        sortedByYear = [],
        prevCharAbc  = '',
        prevCharYear = '';

    track.each(function() {
        var id        = $(this).attr('id'),
            title     = $(this).find('title').text(),
            year      = $(this).find('year').text(),
            titleAlt1 = $(this).find('title-alt1').text(),
            titleAlt2 = $(this).find('title-alt2').text(),
            liTempl   = '<li><a %%<span class="track_starred-star">&#9733;</span></a></li>';

        byAbc.push(liTempl.splice(7, 2,
            'href="#' +id+ '" data-year="' +year+ '">' +firstQuote(title)
        ));
        titleAlt1 && byAbc.push(liTempl.splice(7, 2,
            'href="#' +id+ '" data-year="' +year+ '">' +firstQuote(titleAlt1)+ ' (' +title+ ')'
        ));
        titleAlt2 && byAbc.push(liTempl.splice(7, 2,
            'href="#' +id+ '" data-year="' +year+ '">' +firstQuote(titleAlt2)+ ' (' +title+ ')'
        ));

        var match = year.match(/\d{4}/g);
        $.each(match, function(idx, itm) {
            var sortYear = itm + '';
            if (titleAlt1 && titleAlt2) {
                byYear.push(liTempl.splice(7, 2,
                    'href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title+ ', ' +titleAlt2+ ' (' +titleAlt1+ ')'
                ));
            } else if (titleAlt1) {
                byYear.push(liTempl.splice(7, 2,
                    'href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title+ ' (' +titleAlt1+ ')'
                ));
            } else {
                byYear.push(liTempl.splice(7, 2,
                    'href="#' +id+ '" data-year-sort="' +sortYear+ '">' +title
                ));
            };
        });
    });

    byAbc.sort(function(a, b) {
        a = trimSpecial($(a).find('a').text());
        b = trimSpecial($(b).find('a').text());
        return a.toUpperCase().localeCompare(b.toUpperCase());
    });

    $.each(byAbc, function(idx, itm) {
        var curChar = trimSpecial($(itm).text()).toUpperCase()[0];
        if (curChar.match(/^[0-9]/)) {
            curChar = '0…9';
        } else if (curChar.match(/^[a-zA-Z]/)) {
            curChar = 'A…Z';
        };

        if (prevCharAbc == curChar) {
            sortedByAbc.push(itm)
        } else {
            prevCharAbc = curChar;
            if ( prevCharAbc != '') {
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
        var ay = $(a).find('a').data('yearSort') + '',
            by = $(b).find('a').data('yearSort') + '';
        if (ay != by) {
            return ay - by;
        };
        a = trimSpecial($(a).text());
        b = trimSpecial($(b).text());
        return a.toUpperCase().localeCompare(b.toUpperCase());
    });

    $.each(byYear, function(idx, itm) {
        var curChar = trimSpecial($('a', itm).data('yearSort'));
        if (prevCharYear == curChar) {
            sortedByYear.push(itm)
        } else {
            prevCharYear = curChar;
            if ( prevCharYear != '') {
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

    setStarred();


    $(window).hashchange( function() {
      activateChords();
    })
};

function setStarred() {
    var starClass = 'track_starred',
        starCookie = 'sch_starred';

    if (typeof starray === 'undefined') {
        starray = [];
    };
    if (typeof Cookies(starCookie) !== 'undefined') {
        starray = JSON.parse(Cookies.get(starCookie));
    };

    $('.' + starClass).removeClass(starClass);
    for (var i = 0; i < starray.length; i++) {
        $('a[href="#' +starray[i]+ '"], h2[href="#' +starray[i]+ '"]').addClass(starClass);
    };

    $('h2 .track_starred-star').click(function() {
        var par = $(this).parent(),
            id = par.attr('href').substring(1),
            n = $.inArray(id, starray);
        if (n != -1) {
            par.removeClass(starClass);
            starray.splice(n, 1);
        } else {
            par.addClass(starClass);
            starray.push(id);
        };
        Cookies.set(starCookie, JSON.stringify(starray));
    });
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
    starray = undefined;
    setStarred();
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

// Delete unwanted first and last symbols from string
function trimSpecial(t) {
    if (typeof t !== 'undefined') {
        t = t + '';
        if (t.match(/[\u{2605}]$/igmu)) {
            t = t.slice(0, -1);
        };
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

// http://stackoverflow.com/a/4314050/5423515
if (!String.prototype.splice) {
    /**
     * {JSDoc}
     *
     * The splice() method changes the content of a string by removing a range of
     * characters and/or adding new characters.
     *
     * @this {String}
     * @param {number} start Index at which to start changing the string.
     * @param {number} delCount An integer indicating the number of old chars to remove.
     * @param {string} newSubStr The String that is spliced in.
     * @return {string} A new string with the spliced substring.
     */
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}
