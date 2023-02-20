const cont = document.querySelector('.content_contents');
let chordsMain;
let chordsByAbcHtml = [];
let chordsByYearHtml = [];
let chordsByAlbumHtml = [];
let sorting = '';
let currTrackId;

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

daynight('.day-night-switch');
getStateFromStorage();
getXmlMain('chords.xml');
parseChords(chordsMain);

const searchInput = document.querySelector(".search-input");

sortToggle();
showContents();
keyListener();

activateTrack();
window.onhashchange = activateTrack;



function getXmlMain(file) {
    const request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.setRequestHeader('Content-Type', 'text/xml');
    request.send();

    chordsMain = request.responseXML.getElementsByTagName('track');
    document.querySelector('.chords_number').textContent = chordsMain.length;

    const trackIds = new Set();
    [...chordsMain].forEach(track => {
        const trackId = track.id;
        if (trackIds.has(trackId)) {
            console.error(`Duplicate track id: ${trackId}`);
        } else {
            trackIds.add(trackId);
        }
    });
}


function parseChords(chords) {
    let chordsByAbc = [];
    let chordsByYear = [];
    let chordsByAlbum = [];
    let prevCharAbc = '';
    let prevCharYear = '';
    let prevCharAlbum = '';
    let liTempl = '<li><a %%<span class="track_starred-star">&#9733;</span></a></li>';

    for (let el of chords) {
        let textFirstLine = el.getElementsByTagName('title')[1]?.textContent || '';

        const titles = el.getElementsByTagName('title');
        for (let i = 0; i < titles.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', `#${el.id}`);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[i].textContent);
            if (i > 0) {
                link.innerHTML +=  ` (${italization(titles[0].textContent)})`;
            }
            if (i === 1) link.removeAttribute('title');
            chordsByAbc.push(link);
        }

        const year = el.getElementsByTagName('year')[0].textContent;
        year.match(/\d{4}/g).forEach(itm => {
            const sortYear = itm;
            let link = document.createElement('a');
            link.setAttribute('href', `#${el.id}`);
            link.setAttribute('data-year-sort', sortYear);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[0].textContent);
            chordsByYear.push(link);
        });

        const albums = el.getElementsByTagName('album');
        for (let i = 0; i < albums.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', `#${el.id}`);
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

        if (prevCharAbc === curChar) {
            chordsByAbcHtml.push(`<li>${firstQuote(itm).outerHTML}</li>`);
        } else {
            prevCharAbc = curChar;
            if (prevCharAbc !== '') {
                chordsByAbcHtml.push('</ul></dd>');
            }
            chordsByAbcHtml.push(`<dt><a>${curChar}</a></dt>`);
            chordsByAbcHtml.push('<dd><ul>');
            chordsByAbcHtml.push(`<li>${firstQuote(itm).outerHTML}</li>`);
        }
    });
    prevCharAbc = '';

    chordsByYear.sort(function(a, b) {
        const ay = a.getAttribute('data-year-sort');
        const by = b.getAttribute('data-year-sort');
        if (ay !== by) return ay - by;

        a = trimSpecial(a.textContent);
        b = trimSpecial(b.textContent);
        return a.localeCompare(b, undefined, {numeric: true, sensivity: 'base'});
    });

    chordsByYear.forEach(itm => {
        const curChar = trimSpecial(itm.getAttribute('data-year-sort'));
        if (prevCharYear === curChar) {
            chordsByYearHtml.push(`<li>${itm.outerHTML}</li>`);
        } else {
            prevCharYear = curChar;
            if (prevCharYear !== '') {
                chordsByYearHtml.push('</ul></dd>');
            }
            chordsByYearHtml.push(`<dt>${curChar}</dt>`);
            chordsByYearHtml.push('<dd><ul>');
            chordsByYearHtml.push(`<li>${itm.outerHTML}</li>`);
        }
    });
    prevCharYear = '';

    chordsByAlbum.sort(function(a, b) {
        const al = a.getAttribute('data-album');
        const bl = b.getAttribute('data-album');
        return al.localeCompare(bl, undefined, {numeric: true, sensivity: 'base'});
    });
    chordsByAlbum.sort(function(a, b) {
        const aal = a.getAttribute('data-album-year');
        const bal = b.getAttribute('data-album-year');
        if (aal !== bal) return bal < aal ? 1 : -1;
        return 1;
    });
    chordsByAlbum.sort(function(a, b) {
        const aaln = a.getAttribute('data-album-albumnum');
        const baln = b.getAttribute('data-album-albumnum');
        return aaln.localeCompare(baln, undefined, {numeric: true, sensivity: 'base'});
    });
    chordsByAlbum.sort(function(a, b) {
        const an = parseInt(a.getAttribute('data-album-tracknum'));
        const bn = parseInt(b.getAttribute('data-album-tracknum'));
        const al = a.getAttribute('data-album');
        const bl = b.getAttribute('data-album');
        if (al === bl) {
            if (an === bn) {
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
        if (prevCharAlbum === curChar) {
            chordsByAlbumHtml.push('<li>');
            if (tracknum !== 'null') {
                chordsByAlbumHtml.push(`<span class="tracknum">${itm.getAttribute('data-album-tracknum')}</span>`);
            }
            chordsByAlbumHtml.push(itm.outerHTML);
            chordsByAlbumHtml.push('</li>');
        } else {
            prevCharAlbum = curChar;
            if (prevCharAlbum !== '') {
                chordsByAlbumHtml.push('</ul></dd>');
            }
            const albumLat = Object.keys(albumNames).find(key => albumNames[key] === curChar);
            const albumYear = itm.getAttribute('data-album-year');

            chordsByAlbumHtml.push('<dt>');
            if (albumLat !== undefined) {
                chordsByAlbumHtml.push(`<img class="albumart" src="./covers/${albumLat}.jpg"  onerror="this.style.display=\'none\'">`);
            }
            // if (albumnum != 'null') {
            //     chordsByAlbumHtml.push('<span class="albumnum">' + itm.getAttribute('data-album-albumnum') + ') </span>');
            // }
            chordsByAlbumHtml.push(curChar);
            if (albumYear !== 'null') {
                chordsByAlbumHtml.push(` <span class="albumyear">${albumYear}</span>`);
            }
            chordsByAlbumHtml.push('</dt>');


            chordsByAlbumHtml.push('<dd><ul>');
            chordsByAlbumHtml.push('<li>');
            if (tracknum !== 'null') {
                chordsByAlbumHtml.push(`<span class="tracknum">${itm.getAttribute('data-album-tracknum')}</span>`);
            }
            chordsByAlbumHtml.push(itm.outerHTML);
            chordsByAlbumHtml.push('</li>');
        }
    });
    prevCharAlbum = '';


    document.querySelector('.page_title').insertAdjacentHTML('beforeend', '<span class="sorting_toggler">'
        + 'по<span class="sortToggle-abc active"> алфавиту</span>'
        + '<span class="sortToggle-album"> альбомам</span>'
        + '<span class="sortToggle-year"> годам</span>'
        + '</span>'
        + '<input type="search" class="search-input" placeholder="Искать">');
    const togglerYear = document.querySelector('.sortToggle-year');
    togglerYear.addEventListener('click', function() {
        if (!togglerYear.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('year');
        }
    });
    const togglerAbc = document.querySelector('.sortToggle-abc');
    togglerAbc.addEventListener('click', function() {
        if (!togglerAbc.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('abc');
        }
    });
    const togglerAlbum = document.querySelector('.sortToggle-album');
    togglerAlbum.addEventListener('click', function() {
        if (!togglerAlbum.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('album');
        }
    });
    prevCharYear = '';
}


function showContents() {
    clearSearch();
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
    el.classList.add(`sorting-${sorting}`);

    cont.innerHTML = aArray;
    abcIndex();
    linksWeightInit('dd a', 'linksWeight');
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
            if (sorting === '') {
                sorting = 'abc'
                return;
            }
            break;
    }
    sortToggler.querySelectorAll('span').forEach(span => {
        span.classList.remove('active');
    });
    sortToggler.querySelector(`.sortToggle-${sorting}`).classList.add('active');
    localStorage.setItem('sorting', sorting);
}


function searchText(searchString = "") {
    const regConent = document.querySelector(".content_contents");
    const resultDiv = document.querySelector(".content_search");
    const searchRegex = new RegExp(searchString, "gi");
    let results = [];

    document.body.scrollTo(0, 0);

    if (searchString.length < 2) {
        searchString = '';
        results = [];
        resultDiv.style.display = "none";
        regConent.style.display = "block";
        document.body.classList.remove('searching');
        return;
    }

    for (let i = 0; i < chordsMain.length; i++) {
        const title = chordsMain[i].querySelector('title').textContent;
        const text = chordsMain[i].querySelector('text').textContent;
        const lines = text.split(/\r?\n/).map(line => line.replace(/[\s]{2,}.*/g, ''));
        const matchingLines = lines.filter(line => searchRegex.test(line));
        const matchingTitle = searchRegex.test(title);
        if (matchingLines.length > 0 || matchingTitle) {
            const result = {
                id: chordsMain[i].getAttribute("id"),
                title: title,
                lines: matchingLines,
                year: chordsMain[i].querySelector('year').textContent.match(/\d{4}/g)[0]
            };
            results.push(result);
        }
    }

    if (results.length > 0) {
        if (sorting === 'year') {
            // Sort results by year
            results.sort((a, b) => {
                const yearA = a.year;
                const yearB = b.year;
                if (yearA && yearB) {
                    return yearA - yearB;
                } else {
                    return a.title.localeCompare(b.title, undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    });
                }
            });
        } else {
            // Sort results alphabetically by title
            results.sort((a, b) => trimSpecial(a.title).localeCompare(trimSpecial(b.title), undefined, {
                numeric: true,
                sensitivity: 'base'
            }));
        }

        let resultHtml = "";
        for (let i = 0; i < results.length; i++) {
            resultHtml += `<li><a href="#${results[i].id}">${results[i].title.replace(searchRegex, '<span class="highlight">$&</span>').replace(/^[«]/, '<span style="margin-left:-.6em;">«</span>')}</a>`;
            resultHtml += "<ul>";
            for (let j = 0; j < results[i].lines.length; j++) {
                const line = results[i].lines[j].replace(searchRegex, '<span class="highlight">$&</span>');
                resultHtml += `<li>${line}</li>`;
            }
            resultHtml += "</ul></li>";
        }
        resultDiv.innerHTML = resultHtml;
        document.body.classList.add('searching');
        regConent.style.display = "none";
        resultDiv.style.display = "block";
    } else {
        document.body.classList.remove('searching');
        resultDiv.style.display = "none";
        regConent.style.display = "block";
    }
}


searchInput.addEventListener("input", (event) => {
    const searchString = event.target.value.trim().toLowerCase();
    searchText(searchString);
});

function clearSearch() {
    searchInput.value = "";
    searchText();
}


// Delete unwanted first and last symbols from string
function trimSpecial(t) {
    if (typeof t !== 'undefined') {
        t = `${t}`;
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
    if (text[0] === '«') {
        text = `<span style="margin-left:-.6em;">«</span>${text.substring(1)}`;
    }
    a.innerHTML = text;
    return a;
}

// convert _text_ to italic
function italization(str) {
    const regex = /_(\S.*?\S)_(?=[\s.,:;-]|$)/g;
    const subst = "<i>$1</i>";
    return str.replace(regex, subst);
}

function activateTrack() {
    modal();
    const modalContent = document.querySelector('.modal-content');
    const trackId = document.location.hash.substring(1);
    const currChords = chordsMain[trackId];
    if (!currChords) {
      modal('close');
      return false;
    }

    const title = currChords.querySelector('title')?.textContent || trackId;
    const star = '<span class="track_starred-star">&#9733;</span>';
    const trackTitle = `<h2 class="tracktitle">${italization(title)}${star}</h2>`;

    const altTitle = currChords.querySelectorAll('title')[2]?.textContent || '';
    const trackAltTitle = altTitle ? `<h2 class="tracktitle-alt">${altTitle}</h2>` : '';

    const subtitle = currChords.querySelector('subtitle')?.textContent || '';
    const trackSubtitle = subtitle ? `<div class="subtitle">${subtitle}</div>` : '';

    const album = Array.from(currChords.querySelectorAll('album')).map(a => `<li class="album">${a.textContent}</li>`).join(', ');
    const trackAlbum = album ? `<ul class="albumlist">${album}</ul>` : '';

    const year = currChords.querySelector('year')?.textContent || '';
    const trackYear = year ? `<div class="year">${year}</div>` : '';

    const currTrackHeader = `<div class="chords_header">${trackAlbum}${trackTitle}${trackAltTitle}${trackSubtitle}</div>`;
    const currTrackText = `<div class="chords_text">${currChords.querySelector('text').textContent}</div>`;
    const currTrack = currTrackHeader + currTrackText + trackYear;

    modalContent.innerHTML = currTrack;
    modal('open');
    document.title = `${title} — Щербаккорды`;
    linksWeightChange(`#${trackId}`, 'linksWeight');
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
    if (!(arg || modal)) {
        document.body.insertAdjacentHTML('beforeend', '<div class="modal"><div class="modal-content" tabindex="1"></div></div>');
    }

    switch (arg) {
        case 'open':
            modal.style.display = 'block';
            document.body.classList.add('modal-lock');
            document.querySelector('.modal-content').focus();
            document.querySelector('.modal').scrollTo(0, 0);
            scrollBorder();
            break;
        case 'close':
            document.body.classList.remove('modal-lock');
            modal.style.display = 'none';
            break;
        default:
            return;
    }
}


document.addEventListener("click", (event) => {
    if (document.body.classList.contains('modal-lock')) {
        const flyoutElement = document.querySelector('.modal-content');
        if (!flyoutElement.contains(event.target)) {
            clearAddress();
        }
    }
});

function getStateFromStorage() {
    const sort = localStorage.getItem('sorting');
    if (sort) {
      return sort;
    }
    return null;
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

    if (sorting === 'abc') {
        document.querySelectorAll('dl.content_contents dt a').forEach(a => {

            const l = a.textContent.toUpperCase();
            let nameVal = '';
                if (l in aabb) nameVal = aabb[l];
                else if (/^[a-zA-Z]/.test(l)) nameVal = 'a…z';
                else if (/^[0-9]/.test(l)) nameVal = '0…9';
                else nameVal = '';

            a.setAttribute('name', nameVal);
            a.setAttribute('href', '#top');

            document.querySelector('.abc_index ul').insertAdjacentHTML('beforeend', `<li><a href="#${a.getAttribute('name')}">${l}</a></li>`);
            document.querySelectorAll('.abc_index ul a').forEach(a => {
                const link = a.getAttribute('href');
                a.addEventListener('click', event => {
                    event.preventDefault();
                    let target = document.querySelector(`a[name="${link.substring(1)}"]`);
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
    const keys = {};

    document.addEventListener('keydown', e => {
        const key = e.key;
        const k = a[e.keyCode];
        const targetElement = e.target;
        if (!(targetElement.matches('[contenteditable], input, textarea') || (e.ctrlKey || e.altKey || e.metaKey))) {
            if (!document.body.classList.contains('modal-lock')) {

                if (Object.keys(keys).length <= 2 && (sorting === 'abc' || sorting === '')) {
                    keys[e.keyCode] = true;

                    if (k) {
                        if (k === 'top') {
                            document.body.scrollIntoView(true);
                        } else {
                            const targetAnchor = document.querySelector(`a[name="${k}"]`);
                            targetAnchor.scrollIntoView(true);
                            targetAnchor.classList.add('signal');
                            window.setTimeout(() => {targetAnchor.classList.remove('signal')}, 500);
                        }
                    }
                }

            } else if (key === 'Escape') clearAddress();
        }
    });

    document.addEventListener('keyup', (e) => {
        // rome-ignore lint/performance/noDelete:
        delete keys[e.keyCode];
    });
}

function scrollBorder() {
    const elName = 'scroll-border';
    const container = document.querySelector('.modal');
    const fadeTimerTime = 500;

    let scrollPos = 0;
    let fadeEffect;

    const elParent = getScrollParent(document.activeElement);

    function createBorder() {
        if (!document.getElementById(elName)) {
            const el = document.createElement('div');
            el.setAttribute('id', elName);
            container.appendChild(el);
        }
    }

    function updateBorderOpacity() {
        const borderEl = document.getElementById(elName);
        const scrollDiff = Math.abs(scrollPos - elParent.scrollTop);
        const opacity = scrollDiff * 0.004;
        borderEl.style.opacity = opacity;
    }

    function fadeOutBorder() {
        const borderEl = document.getElementById(elName);
        fadeEffect = setInterval(() => {
            let opacity = parseFloat(borderEl.style.opacity);
            opacity -= 0.05;
            borderEl.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeEffect);
                borderEl.remove();
            }
        }, fadeTimerTime / 20);
    }

    elParent.addEventListener('scroll', () => {
        createBorder();
        updateBorderOpacity();
        clearTimeout(fadeEffect);
        fadeEffect = setTimeout(fadeOutBorder, 700);
        scrollPos = elParent.scrollTop;
    });

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
}
  

function daynight(selector) {
    const switches = document.querySelectorAll(selector);
    let colorTheme = localStorage.getItem('colorTheme') || 'system';

    function changeState() {
        localStorage.setItem('colorTheme', colorTheme);
        document.documentElement.setAttribute('data-theme', colorTheme);
    }
    changeState();

    switches.forEach(el => {
        el.addEventListener('click', () => {
            switch(colorTheme) {
                case 'dark':
                    colorTheme = 'light';
                    break
                case 'light':
                    colorTheme = 'system';
                    break
                default:
                    colorTheme = 'dark';
            }
            changeState();
        });
    });
}

function linksWeightInit(selector, locStorItem) {
    const links = document.querySelectorAll(selector);
    let linksWeight = JSON.parse(localStorage.getItem(locStorItem)) || {
        dateChanged: new Date().toDateString(),
        list: [],
    };
    const dateCurr = new Date().toDateString();

    links.forEach(el => {
        const trackLink = el.getAttribute('href');
        if (!linksWeight.list.some(e => e.id === trackLink)) {
            linksWeight.list.push({
                id: trackLink,
                weight: 400,
                dateChanged: dateCurr,
                changesToday: 0,
                isFavorite: false,
            });
        }
    });

    if (!isToday(new Date(linksWeight.dateChanged))) {
        linksWeight.dateChanged = dateCurr;
        linksWeight.list.forEach(track => {
            if (!track.isFavorite) {
                track.weight -= 1;
            }
        });
    }

    linksWeight.list.forEach(track => {
        document.querySelectorAll(`a[href="${track.id}"]`).forEach(link => {
            link.style.fontVariationSettings = `"wght" ${weightCalc(track.weight)}`;
            if (track.isFavorite === true) {
                link.setAttribute('data-favorite', true);
            }
            const favicon = document.createElement('span');
            favicon.classList.add('track-favicon');
            favicon.textContent = '⭑';
            // favicon.addEventListener('click', function(){favTrack(track.id);});
            link.append(favicon);
        });
    });

    localStorage.setItem(locStorItem, JSON.stringify(linksWeight));
    console.debug('linksWeightInit', linksWeight);
}

function linksWeightChange(id, locStorItem) {
    const linksWeight = JSON.parse(localStorage.getItem(locStorItem));
    if (!linksWeight) {
        return false;
    }
    const track = linksWeight.list.find(e => e.id === id);

    if (track.changesToday < 5) {
        if (!isToday(new Date(track.dateChanged))) {
            track.dateChanged = new Date().toDateString();
            console.debug(track.dateChanged);
            track.changesToday = 0;
        }
        track.weight += Math.ceil(Math.pow(5 - track.changesToday, 3) / 16);
        track.changesToday++;

        if (track.weight < 400) {
            track.weight = 408;
        }
        if (track.weight > 800) {
            track.weight = 800;
            track.isFavorite = true;
        }

        document.querySelectorAll(`a[href="${id}"]`).forEach(link => {
            link.style.fontVariationSettings = `"wght" ${weightCalc(track.weight)}`;
        });

        localStorage.setItem(locStorItem, JSON.stringify(linksWeight));
    }

    // console.debug('linksWeightChange', linksWeight);
}

function weightCalc(num) {
    let result = 400;
    if (num < 200) {
        result = 200;
    } else if (num <= 800) {
        const x = num - 400;
        result = Math.floor(x * (Math.pow((400 - x), 1.8) * 0.00004 + 1) + 400);
    }
    return result;
}

function favTrack(id) {
    locStorItem = 'linksWeight';
    let linksWeight = JSON.parse(localStorage.getItem(locStorItem));
    if (!linksWeight) return false;
    let track = linksWeight.list.find(e => e.id === id);
    let links = document.querySelectorAll(`a[href="${id}"]`);

    if (track.isFavorite === true) {
        links.forEach(link => {
            track.isFavorite = false;
            link.removeAttribute('data-favorite');
        });
        if (track.weight >= 800) {
            track.weight = 600;
        }
    } else {
        links.forEach(link => {
            track.isFavorite = true;
            link.setAttribute('data-favorite', true);
        });
    }
    localStorage.setItem(locStorItem, JSON.stringify(linksWeight));
}


function isToday(someDate) {
    const today = new Date()
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear()
}
