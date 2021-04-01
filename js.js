const cont = document.querySelector('.content_contents');
let chordsMain,
    chordsByAbcHtml = [],
    chordsByYearHtml = [],
    chordsByAlbumHtml = [],
    sorting = '',
    currTrackId;

const albumNames = {
    'shanson': 'Шансон',
    'vishnevoe_varene': 'Вишнёвое варенье',
    'kovcheg_1': 'Ковчег неутомимый 1',
    'kovcheg_neutomimyy_2': 'Ковчег неутомимый 2',
    'balagan_2': 'Балаган 2',
    'vozdvig_ya_pamyatnik': 'Воздвиг я памятник',
    'eto_dolzhno_sluchitsya': 'Это должно случиться…',
    'drugaya_zhizn': 'Другая жизнь',
    'zaklinanie': 'Заклинание',
    'predpolozhim_': 'Предположим…',
    'peshkom_s_vostoka': 'Пешком с востока',
    'gorod_gorod': 'Город Город',
    'once': 'Once',
    'tseloe_leto': 'Целое лето',
    'lozhnyy_shag': 'Ложный шаг',
    'izbrannoe_chast_1': 'Избранное. Часть 1',
    'izbrannoe_chast_2': 'Избранное. Часть 2',
    'd_j': 'Déjà',
    'esli': 'Если',
    'raytsentr': 'Райцентр',
    'chuzhaya_muzyka_1': 'Чужая музыка и не только. Часть 1',
    'chuzhaya_muzyka_2': 'Чужая музыка и не только. Часть 2',
    'chuzhaya_muzyka_3': 'Чужая музыка и не только. Часть 3',
    'khorovod': 'Хоровод',
    'po_motivam': 'По мотивам'
};

getStateFromStorage();
getXmlMain('chords.xml');
parseChords(chordsMain);
sortToggle();
showContents();
keyListener();
daynight('.day-night-switch');



function getXmlMain(file) {
    let Connect = new XMLHttpRequest();
    Connect.open('GET', file, false);
    Connect.setRequestHeader('Content-Type', 'text/xml');
    Connect.send(null);
    chordsMain = Connect.responseXML.getElementsByTagName('track');
    document.querySelector('.chords_number').innerHTML = chordsMain.length;

    let dupArr = [];
    for (let i of chordsMain) {
        if (dupArr.indexOf(i.id) === -1) {
            dupArr.push(i.id);
        } else {
            console.error('Duplicate track id:', i.id);
        }
    };
    delete dupArr;

    activateTrack();
    window.onhashchange = activateTrack;
}

function parseChords(chords) {
    let chordsByAbc = [],
        chordsByYear = [],
        chordsByAlbum = [],
        prevCharAbc = '',
        prevCharYear = '',
        prevCharAlbum = '',
        liTempl = '<li><a %%<span class="track_starred-star">&#9733;</span></a></li>';

    for (let el of chords) {
        let textFirstLine = el.getElementsByTagName('title')[1]?.textContent || '';

        const titles = el.getElementsByTagName('title');
        for (let i = 0; i < titles.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', '#' + el.id);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[i].textContent);
            if (i > 0) {
                link.innerHTML +=  ' (' + italization(titles[0].textContent) + ')';
            }
            if (i === 1) link.removeAttribute('title');
            chordsByAbc.push(link);
        }

        const year = el.getElementsByTagName('year')[0].textContent;
        year.match(/\d{4}/g).forEach(itm => {
            const sortYear = itm;
            let link = document.createElement('a');
            link.setAttribute('href', '#' + el.id);
            link.setAttribute('data-year-sort', sortYear);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[0].textContent);
            chordsByYear.push(link);
        });

        const albums = el.getElementsByTagName('album');
        for (let i = 0; i < albums.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', '#' + el.id);
            link.setAttribute('data-album', albums[i].textContent);
            link.setAttribute('data-album-year', albums[i].getAttribute('year'));
            link.setAttribute('data-album-tracknum', albums[i].getAttribute('tracknum'));
            link.setAttribute('data-album-albumnum', albums[i].getAttribute('albumnum'));
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[0].textContent);
            chordsByAlbum.push(link);
        };
    }

    chordsByAbc.sort(function(a, b) {
        a = trimSpecial(a.textContent);
        b = trimSpecial(b.textContent);
        return a.localeCompare(b, undefined, {numeric: true, sensivity: 'base'});
    });
    chordsByAbc.forEach(itm => {
        let curChar = trimSpecial(itm.textContent).toUpperCase()[0];
        if (curChar.match(/^[0-9]/)) {
            curChar = '0…9';
        } else if (curChar.match(/^[a-zA-Z]/)) {
            curChar = 'A…Z';
        }

        if (prevCharAbc == curChar) {
            chordsByAbcHtml.push('<li>' + firstQuote(itm).outerHTML + '</li>');
        } else {
            prevCharAbc = curChar;
            if (prevCharAbc != '') {
                chordsByAbcHtml.push('</ul></dd>');
            }
            chordsByAbcHtml.push('<dt><a>' + curChar + '</a></dt>');
            chordsByAbcHtml.push('<dd><ul>');
            chordsByAbcHtml.push('<li>' + firstQuote(itm).outerHTML + '</li>');
        }
    });
    prevCharAbc = '';

    chordsByYear.sort(function(a, b) {
        const ay = a.getAttribute('data-year-sort'),
            by = b.getAttribute('data-year-sort');
        if (ay != by) return ay - by;

        a = trimSpecial(a.textContent);
        b = trimSpecial(b.textContent);
        return a.localeCompare(b, undefined, {numeric: true, sensivity: 'base'});
    });

    chordsByYear.forEach(itm => {
        const curChar = trimSpecial(itm.getAttribute('data-year-sort'));
        if (prevCharYear == curChar) {
            chordsByYearHtml.push('<li>' + itm.outerHTML + '</li>');
        } else {
            prevCharYear = curChar;
            if (prevCharYear != '') {
                chordsByYearHtml.push('</ul></dd>');
            }
            chordsByYearHtml.push('<dt>' + curChar + '</dt>');
            chordsByYearHtml.push('<dd><ul>');
            chordsByYearHtml.push('<li>' + itm.outerHTML + '</li>');
        }
    });
    prevCharYear = '';

    chordsByAlbum.sort(function(a, b) {
        const al = a.getAttribute('data-album'),
              bl = b.getAttribute('data-album');
              return al.localeCompare(bl, undefined, {numeric: true, sensivity: 'base'});
    });
    chordsByAlbum.sort(function(a, b) {
        const aal = a.getAttribute('data-album-year'),
              bal = b.getAttribute('data-album-year');
        if (aal != bal) return bal < aal ? 1 : -1;
        return 1;
    });
    chordsByAlbum.sort(function(a, b) {
        const aaln = a.getAttribute('data-album-albumnum'),
              baln = b.getAttribute('data-album-albumnum');
        return aaln.localeCompare(baln, undefined, {numeric: true, sensivity: 'base'});
    });
    chordsByAlbum.sort(function(a, b) {
        const an = parseInt(a.getAttribute('data-album-tracknum')),
              bn = parseInt(b.getAttribute('data-album-tracknum')),
              al = a.getAttribute('data-album'),
              bl = b.getAttribute('data-album');
        if (al == bl) {
            if (an == bn) {
                return 1
            } else {
                return bn < an ? 1 : -1;
            }
        }
    });

    chordsByAlbum.forEach(itm => {
        const curChar = trimSpecial(itm.getAttribute('data-album'));
        const tracknum = itm.getAttribute('data-album-tracknum');
        const albumnum = itm.getAttribute('data-album-tracknum');
        if (prevCharAlbum == curChar) {
            chordsByAlbumHtml.push('<li>');
            if (tracknum != 'null') {
                chordsByAlbumHtml.push('<span class="tracknum">' + itm.getAttribute('data-album-tracknum') + '</span>');
            }
            chordsByAlbumHtml.push(itm.outerHTML);
            chordsByAlbumHtml.push('</li>');
        } else {
            prevCharAlbum = curChar;
            if (prevCharAlbum != '') {
                chordsByAlbumHtml.push('</ul></dd>');
            }
            const albumLat = Object.keys(albumNames).find(key => albumNames[key] === curChar);
            const albumYear = itm.getAttribute('data-album-year');

            chordsByAlbumHtml.push('<dt>');
            if (albumLat != undefined) {
                chordsByAlbumHtml.push('<img class="albumart" src="./covers/' + albumLat + '.jpg"  onerror="this.style.display=\'none\'">');
            }
            // if (albumnum != 'null') {
            //     chordsByAlbumHtml.push('<span class="albumnum">' + itm.getAttribute('data-album-albumnum') + ') </span>');
            // }
            chordsByAlbumHtml.push(curChar);
            if (albumYear != 'null') {
                chordsByAlbumHtml.push(' <span class="albumyear">' + albumYear + '</span>');
            }
            chordsByAlbumHtml.push('</dt>');


            chordsByAlbumHtml.push('<dd><ul>');
            chordsByAlbumHtml.push('<li>');
            if (tracknum != 'null') {
                chordsByAlbumHtml.push('<span class="tracknum">' + itm.getAttribute('data-album-tracknum') + '</span>');
            }
            chordsByAlbumHtml.push(itm.outerHTML);
            chordsByAlbumHtml.push('</li>');
        }
    });
    prevCharAlbum = '';


    document.querySelector('.page_title').insertAdjacentHTML('beforeend', '<span class="sorting_toggler">'
    + 'по <span class="sortToggle-abc active">алфавиту</span>'
    + ' <span class="sortToggle-album">альбомам</span>'
    + ' <span class="sortToggle-year">годам</span>'
    + '</span>');
    const togglerYear = document.querySelector('.sortToggle-year');
    togglerYear.addEventListener('click', function() {
        if (!togglerYear.classList.contains('active')) {
            sortToggle('year');
        }
    });
    const togglerAbc = document.querySelector('.sortToggle-abc');
    togglerAbc.addEventListener('click', function() {
        if (!togglerAbc.classList.contains('active')) {
            sortToggle('abc');
        }
    });
    const togglerAlbum = document.querySelector('.sortToggle-album');
    togglerAlbum.addEventListener('click', function() {
        if (!togglerAlbum.classList.contains('active')) {
            sortToggle('album');
        }
    });
    prevCharYear = '';
}


function showContents() {
    let aArray;

    switch(sorting) {
        case 'year':
            aArray = chordsByYearHtml.join('');
            break;
        case 'album':
            aArray = chordsByAlbumHtml.join('');
            break;
        default:
            aArray = chordsByAbcHtml.join('');
    }

    const el = document.body;
    for (let i = el.classList.length - 1; i >= 0; i--) {
        const className = el.classList[i];
        if (className.startsWith('sorting-')) {
            el.classList.remove(className);
        }
    }
    el.classList.add('sorting-' + sorting);

    cont.innerHTML = aArray;
    abcIndex();
}


function sortToggle(arg) {
    const sortToggler = document.querySelector('.sorting_toggler');
    switch (arg) {
        case 'abc':
            sorting = 'abc';
            showContents();
            break;
        case 'year':
            sorting = 'year';
            showContents();
            break;
        case 'album':
            sorting = 'album';
            showContents();
            break;
        default:
            if (sorting == '') {
                sorting = 'abc'
                return;
            }
            break;
    }
    sortToggler.querySelectorAll('span').forEach(span => {
        span.classList.remove('active');
    });
    sortToggler.querySelector('.sortToggle-' + sorting).classList.add('active');
    localStorage.setItem('sorting', sorting);
}




// Delete unwanted first and last symbols from string
function trimSpecial(t) {
    if (typeof t !== 'undefined') {
        t = t + '';
        if (t.match(/[\u{2605}]$/igmu)) {
            t = t.slice(0, -1);
        }
        if (t.match(/^[0-9a-zA-Zа-яёА-ЯЁ]/)) {
            return t;
        } else {
            t = t.substring(1);
            return trimSpecial(t);
        }
    } else {
        return '';
    }
}

// Hanging quote mark if it is first character
function firstQuote(a) {
    let text = a.innerHTML;
    if (text[0] == '«') {
        text = '<span style="margin-left:-.6em;">«</span>' + text.substring(1);
    }
    a.innerHTML = text;
    return a;
}

// convert _text_ to italic
function italization(str) {
    const regex = /_(\S.*?\S)_([\s\,\.\:\-]|$)/g;
    const subst = `<i>$1<\/i>$2`;
    const result = str.replace(regex, subst);
    return result;
}

function activateTrack() {
    modal();
    const modalContent = document.querySelector('.modal-content');

    if (document.location.hash.length > 3 && ['#top', '#a…z', '#0…9'].indexOf(document.location.hash) <= -1) {
        currTrackId = document.location.hash.substring(1);
    } else {
        modal('close');
        return false;
    }

    const currChords = chordsMain[currTrackId];

    const checkTitle = currChords.querySelectorAll('title')[0];
    let currTrackTitle;
    if (checkTitle) {
        currTrackTitle = '<h2 class="tracktitle">' + italization(currChords.querySelector('title').textContent) + '<span class="track_starred-star">&#9733;</span></h2>';
    } else currTrackTitle = '<h2 class="tracktitle">' + currTrackId + '<span class="track_starred-star">&#9733;</span></h2>';

    const checkAltTitle = currChords.querySelectorAll('title')[2];
    let currTrackAltTitle;
    if (checkAltTitle) {
        currTrackAltTitle = '<h2 class="tracktitle-alt">' + checkAltTitle.textContent + '</h2>';
    } else currTrackAltTitle = '';

    const checkSubtitle = currChords.querySelector('subtitle');
    let currTrackSubtitle;
    if (checkSubtitle) {
        currTrackSubtitle = '<div class="subtitle">' + checkSubtitle.textContent + '</div>';
    } else currTrackSubtitle = '';

    const checkAlbum = currChords.querySelectorAll('album');
    let currTrackAlbum;
    if (checkAlbum.length > 0) {
        currTrackAlbum = '<ul class="albumlist"><li class="album">' + checkAlbum[0].textContent + '</li>';
        for (let i = 1; i < checkAlbum.length; i++) {
            currTrackAlbum += ', <li class="album">' + checkAlbum[i].textContent + '</li>';
        }
        currTrackAlbum += '</ul>';
    } else currTrackAlbum = '';

    const checkYear = currChords.querySelector('year');
    let currTrackYear;
    if (checkYear) {
        currTrackYear = '<div class="year">' + checkYear.textContent + '</div>';
    } else currTrackYear = '';


    const currTrackHeader = '<div class="chords_header">'
    + currTrackAlbum
    + currTrackTitle
    + currTrackAltTitle
    + currTrackSubtitle
    + '</div>';
    const currTrackText = '<div class="chords_text">' + currChords.querySelector('text').textContent + '</div>';
    const currTrack = currTrackHeader + currTrackText + currTrackYear;


    modalContent.innerHTML = currTrack;
    modal('open');

    document.title = currChords.querySelector('title').textContent + ' — Щербаккорды';
}

function clearAddress() {
    // document.location.hash = "";
    modal('close');
    currTrackId = "";
    document.title = 'Щербаккорды';
    history.pushState('', '', window.location.href.split('#')[0]);
}

function modal(arg) {
    const modal = document.querySelector('.modal');
    if (!arg && (typeof(modal) == 'undefined' || modal == null)) {
        document.body.insertAdjacentHTML('beforeend', '<div class="modal"><div class="modal-content" tabindex="1"></div></div>');
    }

    switch (arg) {
        case 'open':
            modal.style.display = 'block';
            document.body.classList.add('modal-lock');
            document.querySelector('.modal-content').focus();
            document.querySelector('.modal').scrollTo(0, 0);
            scrollBorder();
            break
        case 'close':
            // modal.innerHTML = '';
            document.body.classList.remove('modal-lock');
            modal.style.display = 'none';
            break
        default:
            return;
    }
}

document.addEventListener("click", (event) => {
    if (!document.body.classList.contains('modal-lock')) { return; }

    const flyoutElement = document.querySelector('.modal-content');
    let targetElement = event.target;

    do {
        if (targetElement == flyoutElement) { return; }
        targetElement = targetElement.parentNode;
    } while (targetElement);

    clearAddress();
});

function getStateFromStorage() {
    const sort = localStorage.getItem('sorting');
    if (sort) {
        sorting = sort;
    }
}

function abcIndex() {
    const aabb = {
        'А': 'a',
        'Б': 'b',
        'В': 'v',
        'Г': 'g',
        'Д': 'd',
        'Е': 'e',
        'Ж': 'zh',
        'З': 'z',
        'И': 'i',
        'К': 'k',
        'Л': 'l',
        'М': 'm',
        'Н': 'n',
        'О': 'o',
        'П': 'p',
        'Р': 'r',
        'С': 's',
        'Т': 't',
        'У': 'u',
        'Ф': 'f',
        'Х': 'x',
        'Ц': 'c',
        'Ч': 'ch',
        'Ш': 'sh',
        'Щ': 'w',
        'Э': 'eh',
        'Ю': 'ju',
        'Я': 'ja'
    };

    document.querySelector('.abc_index ul').innerHTML = '';

    if (sorting == 'abc') {
        document.querySelectorAll('dl.content_contents dt a').forEach(a => {

            const l = a.textContent.toUpperCase();
            let nameVal = '';
                if (l in aabb) nameVal = aabb[l];
                else if (/^[a-zA-Z]/.test(l)) nameVal = 'a…z';
                else if (/^[0-9]/.test(l)) nameVal = '0…9';
                else nameVal = '';

            a.setAttribute('name', nameVal);
            a.setAttribute('href', '#top');

            document.querySelector('.abc_index ul').insertAdjacentHTML('beforeend', '<li><a href="#' + a.getAttribute('name') + '">' + l + '</a></li>');
            document.querySelectorAll('.abc_index ul a').forEach(a => {
                const link = a.getAttribute('href');
                a.addEventListener('click', event => {
                    event.preventDefault();
                    let target = document.querySelector('a[name="' + link.substring(1) + '"]');
                    target.scrollIntoView(true);
                    target.classList.add('signal');
                    function signaled() {
                        target.classList.remove('signal');
                    }
                    window.setTimeout(signaled, 500);
                });
            });
            document.querySelectorAll('dt a').forEach(a => {
                a.addEventListener('click', event => {
                    event.preventDefault();
                    document.body.scrollTo(0, 0);
                });
            });
        });
    };
};

function keyListener() {
    let keys = {};
    const a = {
        48: 'top',
        49: 'top',
        50: 'top',
        51: 'top',
        52: 'top',
        53: 'top',
        54: 'top',
        55: 'top',
        56: 'top',
        57: 'top',
        192: 'top',
        70: 'a',
        188: 'b',
        68: 'v',
        85: 'g',
        76: 'd',
        84: 'e',
        186: 'zh',
        80: 'z',
        66: 'i',
        82: 'k',
        75: 'l',
        86: 'm',
        89: 'n',
        74: 'o',
        71: 'p',
        72: 'r',
        67: 's',
        78: 't',
        69: 'u',
        65: 'f',
        219: 'x',
        87: 'c',
        88: 'ch',
        73: 'sh',
        79: 'w',
        222: 'eh',
        190: 'ju',
        90: 'ja'
    };

    document.addEventListener('keydown', e => {
        const   key = e.key,
                k = a[e.keyCode];

        if (key == 'Escape' && document.body.classList.contains('modal-lock')) {
            clearAddress();
        } else if (document.body.classList.contains('modal-lock')) return;

        if (JSON.stringify(keys).length <= 2 && (sorting == 'abc' || sorting == '')) {
            keys[e.keyCode] = true;

            if (k) {
                if (k == 'top')
                document.body.scrollIntoView(true);
                else {
                    let target = document.querySelector('a[name="' + k + '"]');

                    target.scrollIntoView(true);
                    target.classList.add('signal');
                    function signaled() {
                        target.classList.remove('signal');
                    }
                    window.setTimeout(signaled, 500);
                }
            }
        }
    });


    document.addEventListener('keyup', e => {
        delete keys[e.keyCode];
    });
}

function scrollBorder () {
    const elName = 'scroll-border',
          container = document.querySelector('.modal'),
          timerTime = 700,
          fadeTimerTime = 500;
    let scrollA, scrollB, fadeEffect;

    const elParent = getScrollParent(document.activeElement);
    elParent.onscroll = function(e) {
        if (!document.getElementById(elName)) {
            scrollA = getScrollPos();
            const el = document.createElement('div');
            el.setAttribute('id', elName);
            el.style.cssText = '';
            el.style.top = scrollA;
            // el.style.cssText += 'outline: 2px solid rgba(255,0,50,.2);'
            container.appendChild(el);
        }
    };

    function scrollFadeOut(el) {
        const fadeTarget = document.getElementById(el);
        fadeEffect = setInterval(function () {
            if (!fadeTarget.style.opacity) {
                fadeTarget.style.opacity = 1;
            }
            if (fadeTarget.style.opacity > 0) {
                if (fadeTarget.style.opacity > 1) {
                    fadeTarget.style.opacity  = 1;
                    fadeTarget.style.opacity -= 0.05;
                }
                fadeTarget.style.opacity -= 0.05;
            } else {
                clearInterval(fadeEffect);
                if (fadeTarget) fadeTarget.remove();
                isScrolling = scrollA = scrollB = undefined;
            }
        }, (fadeTimerTime / 20));
    }

    function scrollFadeIn(el) {
        const fadeTarget = document.getElementById(el);
        scrollB = getScrollPos();
        varScrollDif = Math.abs(scrollA - scrollB);
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 0;
        }
        if (fadeTarget.style.opacity < 1) {
            fadeTarget.style.opacity = varScrollDif * 0.004;
        }
    }

    let isScrolling;
    container.addEventListener('scroll', function ( event ) {
        clearInterval(fadeEffect);
        scrollFadeIn(elName);
        window.clearTimeout( isScrolling );
        isScrolling = setTimeout(function() {
            scrollFadeOut(elName);
        }, timerTime);
    }, false);

    function getScrollParent(node) {
        if (node == null) {
            return null;
        }
        if (node.scrollHeight > node.clientHeight) {
            return node;
        } else {
            return getScrollParent(node.parentNode);
        }
    }

    function getScrollPos() {
        // var el = document.scrollingElement || document.documentElement;
        const el = getScrollParent(document.activeElement);
        return el.scrollTop;
    }
}

function daynight(selector) {
    const switches = document.querySelectorAll(selector);
    let colorTheme = localStorage.getItem('colorTheme');
    if (!colorTheme) colorTheme = 'default';

    function changeState() {
        switches.forEach(el => {
           el.classList.remove('default', 'day', 'night');
           el.classList.add(colorTheme);
        });
        localStorage.setItem('colorTheme', colorTheme);
        document.querySelector('html').classList.remove('daynight-default', 'daynight-day', 'daynight-night');
        document.querySelector('html').classList.add('daynight-' + colorTheme);
    }

    changeState();
    switches.forEach(el => {
        el.addEventListener('click', () => {
            switch(colorTheme) {
                case 'night':
                    colorTheme = 'day';
                    break;
                case 'day':
                    colorTheme = 'default';
                    break;
                default:
                    colorTheme = 'night';
            }
            changeState();
        });
    });
}