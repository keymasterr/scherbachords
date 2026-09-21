// Page flavour: 'main' index.html mode, or others.html («Чужая музыка»)
// data-mode/data-source on <body> — same engine, another collection.
const pageConfig = {
    source: document.body.dataset.source || 'chords.xml',
    mode: document.body.dataset.mode || 'main',
};

const cont = document.querySelector('.content_contents');
let chordsMain;
let chordsByAbcHtml = [];
let chordsByYearHtml = [];
let chordsByAlbumHtml = [];
let chordsByAuthorHtml = [];
let sorting = pageConfig.mode === 'others' ? 'author' : (localStorage.getItem('sorting') || '');
let currTrackId;
let linkWeightChangeTimeout;
let searchInput;
const pageTitle = pageConfig.mode === 'others' ? 'Чужая музыка' : 'Щербаккорды';
const linksWeightKey = pageConfig.mode === 'others' ? 'linksWeightOthers' : 'linksWeight';

// Others-page songs live in the hash: no server rewrites, no indexing to care about.
// The page name must be explicit — a bare #hash would resolve against <base>
// and silently jump to the main page.
function trackHref(id) {
    return pageConfig.mode === 'others' ? `others.html#${id}` : `./songs/${id}`;
}

const albumNames = {
    'monologi': 'Дорожный календарь, или Монологи Cтранствующего Рыцаря',
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
    'po_motivam': 'По мотивам',
    'aviapochta': 'Авиапочта'
};

daynight('.day-night-switch');
init();

async function init() {
    await getXmlMain(pageConfig.source);
    parseChords(chordsMain);

    searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (event) => {
        searchText(event.target.value.trim().toLowerCase());
    });

    makeButton(document.querySelector('.randomTrackBtn'), 'Случайная песня', randomTrack);

    if (pageConfig.mode !== 'others') sortToggle();
    showContents();
    keyListener();

    activateTrack();
    window.addEventListener('popstate', activateTrack);

    swipeLeftRandom(".modal-content");

    // Add click event delegation for track links
    document.addEventListener('click', handleLinkClick);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
}

function extractToken(url = window.location.href) {
    // Extract from hash first
    if (url.includes('#')) {
        return url.split('#').pop();
    }
    // Extract from pathname
    const pathname = url.includes('://') ? new URL(url).pathname : url;
    return pathname.split('/').pop() || '';
}

function handleLinkClick(event) {
    const link = event.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Handle track links (./songs/... format)
    if (href.startsWith('./songs/')) {
        event.preventDefault();
        const trackId = href.replace('./songs/', '');
        if (chordsMain[trackId]) {
            history.pushState(null, '', href);

            activateTrack();
        }
        return;
    }

    // Others page: track links are hash-based
    if (pageConfig.mode === 'others' && href.startsWith('others.html#')) {
        const trackId = href.split('#').pop();
        if (chordsMain[trackId]) {
            event.preventDefault();
            history.pushState(null, '', href);
            activateTrack();
        }
        return;
    }
    
    // Handle album/year links when modal is open
    if (document.body.classList.contains('modal-lock') && href.startsWith('#')) {
        event.preventDefault();
        const token = href.substring(1);
        
        if (token.startsWith('album-')) {
            clearAddress();
            goToAlbum(token.substring(6));
        } else if (token.startsWith('year-')) {
            clearAddress();
            goToYear(token.substring(5));
        }
        return;
    }

    // Let other links (anchors, external) work normally
}

async function getXmlMain(file) {
    const response = await fetch(file);
    const xmlText = await response.text();
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');

    chordsMain = xmlDoc.getElementsByTagName('track');
    document.querySelector('.chords_number').setAttribute('data-content', chordsMain.length);

    if (pageConfig.mode !== 'others') createStructuredData(chordsMain);

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

function goToAnchor(el) {
    if (!el) return;
    clearAddress();
    el.scrollIntoView(true);
    el.classList.add('signal');
    window.setTimeout(() => { el.classList.remove('signal') }, 500);
}

function goToAlbum(albumNameLat) {
    sorting !== 'album' && sortToggle('album');
    goToAnchor(document.querySelector(`#album-${albumNameLat}`));
}

function goToYear(year) {
    sorting !== 'year' && sortToggle('year');
    goToAnchor(document.querySelector(`#year-${year}`));
}

function albumLat(albumNameCyr) {
    return Object.keys(albumNames).find(key => albumNames[key] === albumNameCyr);
}

function parseChords(chords) {
    let chordsByAbc = [];
    let chordsByYear = [];
    let chordsByAlbum = [];
    let chordsByAuthor = [];
    let prevCharAbc = '';
    let prevCharYear = '';
    let prevCharAlbum = '';
    let prevCharAuthor = '';

    for (let el of chords) {
        let textFirstLine = el.getElementsByTagName('title')[1]?.textContent || '';

        const titles = el.getElementsByTagName('title');
        for (let i = 0; i < titles.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', `./songs/${el.id}`);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[i].textContent);
            if (i > 0) {
                link.innerHTML += ` (${italization(titles[0].textContent)})`;
            }
            if (i === 1) link.removeAttribute('title');
            chordsByAbc.push(link);
        }

        const year = el.getElementsByTagName('year')[0]?.textContent || '';
        (year.match(/\d{4}/g) || []).forEach(itm => {
            const sortYear = itm;
            let link = document.createElement('a');
            link.setAttribute('href', `./songs/${el.id}`);
            link.setAttribute('data-year-sort', sortYear);
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[0].textContent);
            chordsByYear.push(link);
        });

        const author = el.getElementsByTagName('author')[0]?.textContent || '—';
        let authorLink = document.createElement('a');
        authorLink.setAttribute('href', trackHref(el.id));
        authorLink.setAttribute('data-author', author);
        authorLink.setAttribute('title', textFirstLine);
        authorLink.innerHTML = italization(titles[0].textContent);
        chordsByAuthor.push(authorLink);

        const albums = el.getElementsByTagName('album');
        for (let i = 0; i < albums.length; i++) {
            let link = document.createElement('a');
            link.setAttribute('href', `./songs/${el.id}`);
            link.setAttribute('data-album', albums[i].textContent);
            link.setAttribute('data-album-year', albums[i].getAttribute('year'));
            link.setAttribute('data-album-tracknum', albums[i].getAttribute('tracknum'));
            link.setAttribute('data-album-albumnum', albums[i].getAttribute('albumnum'));
            link.setAttribute('title', textFirstLine);
            link.innerHTML = italization(titles[0].textContent);
            chordsByAlbum.push(link);
        };
    }

    chordsByAbc.sort(function (a, b) {
        a = trimSpecial(a.textContent);
        b = trimSpecial(b.textContent);
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
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
            if (prevCharAbc !== '') {
                chordsByAbcHtml.push('</ul></dd>');
            }
            prevCharAbc = curChar;
            chordsByAbcHtml.push(`<dt id="abc-${curChar}"><a>${curChar}</a></dt>`);
            chordsByAbcHtml.push('<dd><ul>');
            chordsByAbcHtml.push(`<li>${firstQuote(itm).outerHTML}</li>`);
        }
    });
    if (prevCharAbc !== '') {
        chordsByAbcHtml.push('</ul></dd>');
    }
    prevCharAbc = '';

    chordsByYear.sort(function (a, b) {
        const ay = a.getAttribute('data-year-sort');
        const by = b.getAttribute('data-year-sort');
        if (ay !== by) return ay - by;

        a = trimSpecial(a.textContent);
        b = trimSpecial(b.textContent);
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    chordsByYear.forEach(itm => {
        const curChar = trimSpecial(itm.getAttribute('data-year-sort'));
        if (prevCharYear === curChar) {
            chordsByYearHtml.push(`<li>${itm.outerHTML}</li>`);
        } else {
            if (prevCharYear !== '') {
                chordsByYearHtml.push('</ul></dd>');
            }
            prevCharYear = curChar;
            chordsByYearHtml.push(`<dt id="year-${curChar}">${curChar}</dt>`);
            chordsByYearHtml.push('<dd><ul>');
            chordsByYearHtml.push(`<li>${itm.outerHTML}</li>`);
        }
    });
    if (prevCharYear !== '') {
        chordsByYearHtml.push('</ul></dd>');
    }
    prevCharYear = '';

    // Albums ordered by number > year > alphabet, tracks by tracknum within an album
    chordsByAlbum.sort(function (a, b) {
        const aAlbum = a.getAttribute('data-album');
        const bAlbum = b.getAttribute('data-album');
        if (aAlbum === bAlbum) {
            return parseInt(a.getAttribute('data-album-tracknum')) - parseInt(b.getAttribute('data-album-tracknum'));
        }

        const aNum = a.getAttribute('data-album-albumnum');
        const bNum = b.getAttribute('data-album-albumnum');
        if (aNum !== bNum) return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });

        const aYear = a.getAttribute('data-album-year');
        const bYear = b.getAttribute('data-album-year');
        if (aYear !== bYear) return aYear < bYear ? -1 : 1;

        return aAlbum.localeCompare(bAlbum, undefined, { numeric: true, sensitivity: 'base' });
    });

    chordsByAlbum.forEach(itm => {
        const curChar = trimSpecial(itm.getAttribute('data-album'));
        const tracknum = itm.getAttribute('data-album-tracknum');
        if (prevCharAlbum === curChar) {
            chordsByAlbumHtml.push('<li>');
            if (tracknum !== 'null') {
                chordsByAlbumHtml.push(`<span class="tracknum">${itm.getAttribute('data-album-tracknum')}</span>`);
            }
            chordsByAlbumHtml.push(itm.outerHTML);
            chordsByAlbumHtml.push('</li>');
        } else {
            if (prevCharAlbum !== '') {
                chordsByAlbumHtml.push('</ul></dd>');
            }
            prevCharAlbum = curChar;
            const albumId = albumLat(curChar);
            const albumYear = itm.getAttribute('data-album-year');

            chordsByAlbumHtml.push(`<dt id="album-${albumId || 'unknown'}">`);
            if (albumId !== undefined) {
                chordsByAlbumHtml.push(`<img class="albumart" src="./covers/${albumId}.jpg"  onerror="this.style.display=\'none\'">`);
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
    if (prevCharAlbum !== '') {
        chordsByAlbumHtml.push('</ul></dd>');
    }
    prevCharAlbum = '';

    chordsByAuthor.sort(function (a, b) {
        const aAuthor = a.getAttribute('data-author');
        const bAuthor = b.getAttribute('data-author');
        if (aAuthor !== bAuthor) return aAuthor.localeCompare(bAuthor, undefined, { sensitivity: 'base' });
        return trimSpecial(a.textContent).localeCompare(trimSpecial(b.textContent), undefined, { numeric: true, sensitivity: 'base' });
    });
    chordsByAuthor.forEach(itm => {
        const curChar = itm.getAttribute('data-author');
        if (prevCharAuthor === curChar) {
            chordsByAuthorHtml.push(`<li>${firstQuote(itm).outerHTML}</li>`);
        } else {
            if (prevCharAuthor !== '') {
                chordsByAuthorHtml.push('</ul></dd>');
            }
            prevCharAuthor = curChar;
            chordsByAuthorHtml.push(`<dt>${curChar}</dt>`);
            chordsByAuthorHtml.push('<dd><ul>');
            chordsByAuthorHtml.push(`<li>${firstQuote(itm).outerHTML}</li>`);
        }
    });
    if (prevCharAuthor !== '') {
        chordsByAuthorHtml.push('</ul></dd>');
    }
    prevCharAuthor = '';

    if (pageConfig.mode === 'others') {
        document.querySelector('.page_title').insertAdjacentHTML('beforeend',
            '<span class="randomTrackBtn interpunctum" title="Случайная песня" data-content=" #?"></span>'
            + '<input type="search" class="search-input" placeholder="Искать">');
        return;
    }

    document.querySelector('.page_title').insertAdjacentHTML('beforeend', '<span class="sorting_toggler">'
        + 'по<span class="sortToggle-abc active"> алфавиту<span class="hidden interpunctum"> /</span></span>'
        + '<span class="sortToggle-album"> альбомам<span class="hidden interpunctum"> /</span></span>'
        + '<span class="sortToggle-year"> годам</span>'
        + '<span class="randomTrackBtn interpunctum" title="Случайная песня" data-content=" #?"></span>'
        + '</span>'
        + '<input type="search" class="search-input" placeholder="Искать">');
    const togglerYear = document.querySelector('.sortToggle-year');
    togglerYear.addEventListener('click', function () {
        if (!togglerYear.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('year');
        }
    });
    const togglerAbc = document.querySelector('.sortToggle-abc');
    togglerAbc.addEventListener('click', function () {
        if (!togglerAbc.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('abc');
        }
    });
    const togglerAlbum = document.querySelector('.sortToggle-album');
    togglerAlbum.addEventListener('click', function () {
        if (!togglerAlbum.classList.contains('active') || document.body.classList.contains('searching')) {
            sortToggle('album');
        }
    });
    prevCharYear = '';
}


function showContents() {
    clearSearch();
    let aArray;

    switch (sorting) {
        case 'year':
            aArray = chordsByYearHtml.join('');
            break;
        case 'album':
            aArray = chordsByAlbumHtml.join('');
            break;
        case 'author':
            aArray = chordsByAuthorHtml.join('');
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
    linksWeightInit('dd a', linksWeightKey);
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
    let results = [];

    window.scrollTo(0, 0);

    if (searchString.length < 2) {
        resultDiv.style.display = "none";
        regConent.style.display = "block";
        document.body.classList.remove('searching');
        return;
    }

    // Escape regex special characters in user input.
    // The matching regex must not carry the "g" flag: test() would then
    // track lastIndex across calls and skip matches.
    const escapedString = searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchRegex = new RegExp(escapedString, "i");
    const searchRegex = new RegExp(escapedString, "gi");

    for (let i = 0; i < chordsMain.length; i++) {
        const title = chordsMain[i].querySelector('title').textContent;
        const text = chordsMain[i].querySelector('text').textContent;
        const lines = text.split(/\r?\n/).map(line => line.replace(/[\s]*\u200C.*/g, ''));
        const matchingLines = lines.filter(line => matchRegex.test(line));
        const matchingTitle = matchRegex.test(title);
        if (matchingLines.length > 0 || matchingTitle) {
            const result = {
                id: chordsMain[i].getAttribute("id"),
                title: title,
                lines: matchingLines,
                year: chordsMain[i].querySelector('year')?.textContent.match(/\d{4}/g)?.[0] || ''
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
            resultHtml += `<li><a href="${trackHref(results[i].id)}">${italization(results[i].title.replace(searchRegex, '<span class="highlight">$&</span>').replace(/^[«]/, '<span style="margin-left:-.6em;">«</span>'))}</a>`;
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
    const token = extractToken();

    if (pageConfig.mode !== 'others') {
        if (token.startsWith('album-')) {
            clearAddress();
            goToAlbum(token.substring(6));
            return false;
        }
        if (token.startsWith('year-')) {
            clearAddress();
            goToYear(token.substring(5));
            return false;
        }
    }

    if (chordsMain[token]) currTrackId = token;
    const currChords = chordsMain[token];
    if (!currChords) {
        modal('close');
        return false;
    }

    const title = currChords.querySelector('title')?.textContent || token;
    const trackTitle = `<h2 class="tracktitle">${italization(title)}</h2>`;

    const altTitle = currChords.querySelectorAll('title')[2]?.textContent || '';
    const trackAltTitle = altTitle ? `<h2 class="tracktitle-alt">${altTitle}</h2>` : '';

    const subtitle = currChords.querySelector('subtitle')?.textContent || '';
    const trackSubtitle = subtitle ? `<div class="subtitle">${subtitle}</div>` : '';

    // Others page has no album/year views to jump to: author + albums render as plain text
    let album;
    if (pageConfig.mode === 'others') {
        const author = currChords.querySelector('author')?.textContent || '';
        album = `<span class="">${author}</span> / ` + [...Array.from(currChords.querySelectorAll('album')).map(a => a.textContent)]
            .filter(Boolean).map(itm => `<li class="album"><span>${itm}</span></li>`).join(', ');
    } else {
        album = Array.from(currChords.querySelectorAll('album')).map(a => `<li class="album"><a href="#album-${albumLat(a.textContent)}">${a.textContent}</a></li>`).join(', ');
    }
    const trackAlbum = album ? `<ul class="albumlist">${album}</ul>` : '';

    const year = currChords.querySelector('year')?.textContent || '';
    const trackYear = year
        ? (pageConfig.mode === 'others'
            ? `<div class="year">${year}</div>`
            : '<div class="year">' + year.replace(/\b(\d{4})\b/g, '<a href="#year-$1">$1</a>') + '</div>')
        : '';

    let text = currChords.querySelector('text').textContent;
    let lines = text.split(/\r?\n/).map(line => line.split('\u200c'));
    let htmlLines = lines.map(line => {
        let lyricsPart = line[0] !== ''
            ? `<div class="line-lyrics"><span class="lyrics-text">${line[0].replace(/\s*$/, '')}</span><span class="trailing-spaces">${line[0].match(/(\s*)$/)[0]}</span></div>`
            : '';
    
        let chordsPart = line[1] && line[1].trim() !== ''
            ? `<div class="line-chords">${line[1].replace(/\s*$/, '')}</div>`
            : '';
    
        return `<div class="line${(lyricsPart || chordsPart) ? '' : ' empty'}">${lyricsPart}${chordsPart}${(lyricsPart || chordsPart) ? '' : '\n'}</div>`;
    });
    
    const currTrackHeader = `<div class="chords_header">${trackAlbum}${trackTitle}${trackAltTitle}${trackSubtitle}</div>`;
    const currTrackText = `<div class="chords_text">${htmlLines.join('')}</div>`;
    const currTrack = currTrackHeader + currTrackText + trackYear;

    modalContent.innerHTML = currTrack;
    modalContent.innerHTML += '<div class="chords-view-switch"></div>';
    modalContent.innerHTML += '<div class="day-night-switch"></div>';
    
    modal('open');

    history.replaceState(null, '');
    document.title = `${title} — ${pageTitle}`;

    chordsView(".chords-view-switch");
    daynight(".modal .day-night-switch");
    
    if (typeof linkWeightChangeTimeout !== 'undefined') {
        clearTimeout(linkWeightChangeTimeout);
    }
    linkWeightChangeTimeout = setTimeout(() => linksWeightChange(trackHref(token), linksWeightKey), 20000);
}


function randomTrack() {
    if (!chordsMain || chordsMain.length < 2) return;

    let rndId;
    do {
        rndId = chordsMain[~~(Math.random() * chordsMain.length)].id;
    } while (rndId === currTrackId);

    history.pushState(null, '', trackHref(rndId));
    activateTrack();
};


function clearAddress() {
    if (!currTrackId) return false;

    modal('close');
    currTrackId = "";
    history.pushState(null, '', window.location.pathname.split('#')[0].split('/songs/')[0] || './');
    document.title = pageTitle;
}

function modal(arg) {
    const modal = document.querySelector('.modal');
    if (!(arg || modal)) {
        document.body.insertAdjacentHTML('beforeend', '<div class="modal"><div class="modal-content" role="dialog" aria-modal="true" tabindex="-1"></div></div>');
        document.body.insertAdjacentHTML('beforeend', '<div class="random-indicator" aria-hidden="true" data-nosnippet="data-nosnippet">Случайная песня <span>#?</span></div>');
    }

    switch (arg) {
        case 'open':
            modal.style.display = 'block';
            document.body.classList.add('modal-lock');
            document.querySelectorAll('header, main, footer').forEach(el => {
                el.setAttribute('data-nosnippet', 'data-nosnippet')
            });
            document.querySelector('.modal-content').focus();
            document.querySelector('.modal').scrollTo(0, 0);
            scrollBorder();
            break;
        case 'close':
            document.body.classList.remove('modal-lock');
            document.querySelectorAll('header, main, footer').forEach(el => {
                el.removeAttribute('data-nosnippet')
            });
            modal.style.display = 'none';
            break;
        default:
            return;
    }
}


document.addEventListener("click", (event) => {
    if (!document.body.classList.contains('modal-lock')) return;

    const flyoutElement = document.querySelector('.modal-content');
    if (!flyoutElement.contains(event.target)) {
        clearAddress();
    }
}, true);


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
        'Я': 'ja',
        'Ё': 'jo'
    };

    const indexUl = document.querySelector('.abc_index ul');
    if (!indexUl) return;
    indexUl.innerHTML = '';

    if (sorting !== 'abc') return;

    document.querySelectorAll('dl.content_contents dt a').forEach(a => {
        const l = a.textContent.toUpperCase();
        let nameVal = '';
        if (l in aabb) nameVal = aabb[l];
        else if (/^[a-zA-Z]/.test(l)) nameVal = 'a…z';
        else if (/^[0-9]/.test(l)) nameVal = '0…9';

        a.setAttribute('name', nameVal);
        a.setAttribute('href', '#top');
        a.addEventListener('click', event => {
            event.preventDefault();
            window.scrollTo(0, 0);
        });

        indexUl.insertAdjacentHTML('beforeend', `<li><a href="#${nameVal}">${l}</a></li>`);
    });

    indexUl.querySelectorAll('a').forEach(a => {
        const link = a.getAttribute('href');
        a.addEventListener('click', event => {
            event.preventDefault();
            goToAnchor(document.querySelector(`a[name="${link.substring(1)}"]`));
        });
    });
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
        // 7? key
        if ((e.keyCode === 55 || e.key === '7') && !(targetElement.matches('[contenteditable], input, textarea') && !(e.ctrlKey || e.altKey || e.metaKey))) randomTrack();
        // /? key (191 = physical slash key regardless of layout)
        if ((e.keyCode === 166 || e.keyCode === 191 || e.key === '/') && document.activeElement !== searchInput && !(e.ctrlKey || e.altKey || e.metaKey)) {
            clearAddress();
            searchInput.focus();
            e.preventDefault();
        }
        if (key === 'Escape'
            && !document.body.classList.contains('modal-lock')
            && (document.activeElement === searchInput
                || document.body.classList.contains('searching'))
        ) {
            searchInput.blur();
            clearSearch();
        };
        if (!(targetElement.matches('[contenteditable], input, textarea') || (e.ctrlKey || e.altKey || e.metaKey))) {
            if (!document.body.classList.contains('modal-lock')) {

                if (Object.keys(keys).length <= 2 && (sorting === 'abc' || sorting === '')) {
                    keys[e.keyCode] = true;

                    if (k) {
                        if (k === 'top') {
                            document.body.scrollIntoView(true);
                        } else {
                            const targetAnchor = document.querySelector(`a[name="${k}"]`);
                            goToAnchor(targetAnchor);

                        }
                    }
                }

            } else if (key === 'Escape') clearAddress();
        }
    });

    document.addEventListener('keyup', (e) => {
        delete keys[e.keyCode];
    });
}

// Called on every modal('open'), but the listener must be attached only once:
// one stale closure per visited song used to fire on the jump-to-top of a song
// swap, each with an old scrollPos, flashing the border at full opacity.
let scrollBorderAttached = false;
let resetScrollBorder = () => {};

function scrollBorder() {
    if (scrollBorderAttached) {
        resetScrollBorder();
        return;
    }
    scrollBorderAttached = true;

    const elName = 'scroll-border';
    const container = document.querySelector('.modal');
    const fadeTimerTime = 500;
    const minDelta = 1;          // ignore only the programmatic scroll-to-top settling,
                                 // never a genuine slow scroll of a few px per event

    let scrollPos = container.scrollTop;
    let fadingInterval;
    let fadeStartTimeout;

    function removeBorder() {
        clearInterval(fadingInterval);
        clearTimeout(fadeStartTimeout);
        document.getElementById(elName)?.remove();
    }

    function createBorder() {
        if (!document.getElementById(elName)) {
            const el = document.createElement('div');
            el.setAttribute('id', elName);
            el.style.top = `${scrollPos}px`;
            container.appendChild(el);
        }
    }

    function updateBorderOpacity() {
        const borderEl = document.getElementById(elName);
        if (!borderEl) return;
        // Deliberately keyed to scroll SPEED, not to the distance from the marker:
        // scrolling slowly means the reader is watching the screen and following the
        // lines, so there is nothing to recover and no reason to distract them. Only a
        // fast, imprecise fling loses your place. Don't "fix" this to distance-based.
        const scrollDiff = Math.abs(scrollPos - container.scrollTop);
        const opacity = Math.min(1, Math.log(scrollDiff + 1) / Math.log(800)); // Adjust the denominator as needed
        borderEl.style.opacity = opacity;
    }

    function fadeOutBorder() {
        const borderEl = document.getElementById(elName);
        if (borderEl == null) return;
        clearInterval(fadingInterval);
        fadingInterval = setInterval(() => {
            const current = parseFloat(borderEl.style.opacity);
            const opacity = (Number.isFinite(current) ? current : 0) - 0.05;
            borderEl.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadingInterval);
                borderEl.remove();
            }
        }, fadeTimerTime / 20);
    }

    container.addEventListener('scroll', () => {
        if (Math.abs(container.scrollTop - scrollPos) < minDelta) {
            scrollPos = container.scrollTop;
            return;
        }
        // Scrolling again must call off a fade that already started — otherwise the
        // interval keeps eating the opacity we just set, and once it removes the
        // element the next scroll re-anchors the border at the wrong place.
        clearInterval(fadingInterval);
        clearTimeout(fadeStartTimeout);
        createBorder();
        updateBorderOpacity();
        fadeStartTimeout = setTimeout(fadeOutBorder, 700);
        scrollPos = container.scrollTop;
    });

    // A new song resets the scroll to the top: that is not a gesture, so it must
    // not paint a border — drop any leftover one and re-baseline.
    resetScrollBorder = () => {
        removeBorder();
        scrollPos = container.scrollTop;
    };
    resetScrollBorder();
}


function daynight(selector) {
    const switches = document.querySelectorAll(selector);
    const states = ['system', 'dark', 'light'];
    let currentColorTheme = localStorage.getItem('colorTheme') || 'system';

    function changeState() {
        localStorage.setItem('colorTheme', currentColorTheme);
        document.documentElement.setAttribute('data-theme', currentColorTheme);
    }
    changeState();

    switches.forEach(el => {
        makeButton(el, 'Переключить тему', () => {
            let idx = states.indexOf(currentColorTheme);
            currentColorTheme = states[(idx + 1) % states.length];
            changeState();
        });
    });
}

// Button semantics + keyboard activation for a non-interactive element
function makeButton(el, label, action) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', label);
    el.addEventListener('click', action);
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    });
}

function chordsView(selector) {
    const switches = document.querySelectorAll(selector);
    const states = ['line', 'block', 'none'];
    let currentChordsView;
    if (localStorage.getItem('chordsView')) {
        currentChordsView = localStorage.getItem('chordsView');
    } else {
        currentChordsView = window.innerWidth > 730 ? 'line' : 'block';
    }

    function changeState() {
        localStorage.setItem('chordsView', currentChordsView);
        document.documentElement.setAttribute('data-chords-view', currentChordsView);
    }
    changeState();

    switches.forEach(el => {
        makeButton(el, 'Расположение аккордов', () => {
            let idx = states.indexOf(currentChordsView);
            currentChordsView = states[(idx + 1) % states.length];
            changeState();
        });
    });
}

/**
 * Adds left swipe detection to an element that triggers randomTrack()
 * @param {string} selector - CSS selector for the target element
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum swipe distance
 * @param {number} options.maxVerticalMovement - Max vertical movement allowed
 * @param {number} options.scrollThreshold - Max horizontal scroll before disabling
 */
function swipeLeftRandom(selector, options = {}) {
    const {
        threshold = 100,
        maxVerticalMovement = 100,
        directionLock = 8,      // px of movement before the gesture picks an axis
        releaseTime = 300       // must be ≥ the .random-releasing transition in style.css
    } = options;

    const target = document.querySelector(selector);
    if (!target) return;
    if (typeof randomTrack !== 'function') return;

    let touchData = null;

    const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The live indicator must promise exactly what touchend will do — otherwise the
    // gesture lights up "ready" and then silently does nothing.
    function qualifies(dx, dy) {
        return dx <= -threshold && Math.abs(dx) > Math.abs(dy) && Math.abs(dy) <= maxVerticalMovement;
    }

    // Wide chord sheets (inline-chords view) scroll horizontally, and that scrolling
    // belongs to the content: only claim the swipe once there's nothing left to reveal.
    function atScrollEnd() {
        const scroller = target.closest('.modal') || target;
        const max = scroller.scrollWidth - scroller.clientWidth;
        return max <= 0 || scroller.scrollLeft >= max - 1;
    }

    function clearProgress() {
        document.body.style.removeProperty('--random-progress');
        document.body.classList.remove('random-ready');
    }

    // Aborted swipe: ease back to rest instead of teleporting.
    function springBack() {
        document.body.classList.remove('random-ready');
        if (reduceMotion()) {
            clearProgress();
            return;
        }
        document.body.classList.add('random-releasing');
        document.body.style.setProperty('--random-progress', 0);
        window.setTimeout(() => {
            document.body.classList.remove('random-releasing');
            document.body.style.removeProperty('--random-progress');
        }, releaseTime);
    }

    // Completed swipe: carry the card out to the left, swap the song, bring the new
    // one in from the right. The gesture owns this — activateTrack() stays unaware.
    function fire() {
        if (reduceMotion() || typeof target.animate !== 'function') {
            clearProgress();
            randomTrack();
            return;
        }

        const cs = getComputedStyle(target);
        const out = target.animate(
            [{ transform: cs.transform, opacity: cs.opacity },
             { transform: 'translateX(-55%)', opacity: 0 }],
            { duration: 170, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }
        );

        // The song must change even if the animation never finishes (backgrounded tab,
        // stalled compositor) — the swap is guaranteed, the animation only decorates it.
        let swapped = false;
        const swap = () => {
            if (swapped) return;
            swapped = true;
            clearProgress();
            randomTrack();
            try { out.cancel(); } catch (e) { /* already gone */ }
            target.animate(
                [{ transform: 'translateX(45%)', opacity: 0 },
                 { transform: 'translateX(0)', opacity: 1 }],
                { duration: 240, easing: 'cubic-bezier(0, .55, .25, 1)' }
            );
        };
        out.finished.then(swap, swap);
        window.setTimeout(swap, 220);
    }

    function handleTouchStart(e) {
        if (window.visualViewport?.scale !== 1) return;
        if (e.touches.length > 1) return;

        const touch = e.touches[0];
        touchData = { startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0, claimed: false, armed: false };
    }

    function handleTouchMove(e) {
        if (!touchData) return;
        if (e.touches.length > 1) {          // pinch started — hand the gesture back
            if (touchData.claimed) springBack();
            touchData = null;
            return;
        }

        const touch = e.touches[0];
        const dx = touch.clientX - touchData.startX;
        const dy = touch.clientY - touchData.startY;
        touchData.dx = dx;
        touchData.dy = dy;

        // Lock the axis once, on the first meaningful movement: either this is our
        // swipe, or it's a scroll and we stay out of it for the rest of the touch.
        if (!touchData.claimed) {
            if (Math.abs(dx) < directionLock && Math.abs(dy) < directionLock) return;
            if (Math.abs(dx) > Math.abs(dy) && dx < 0 && atScrollEnd()) {
                touchData.claimed = true;
            } else {
                touchData = null;
                return;
            }
        }

        e.preventDefault();
        document.body.style.setProperty('--random-progress', Math.max(0, -dx));

        // Arming needs a clean horizontal pull, but once armed only pulling back
        // out of the threshold disarms it — drifting down afterwards is still a swipe.
        const past = dx <= -threshold;
        touchData.armed = touchData.armed ? past : (past && qualifies(dx, dy));
        document.body.classList.toggle('random-ready', touchData.armed);
    }

    function handleTouchEnd() {
        if (!touchData) return;
        const { claimed, armed } = touchData;
        touchData = null;
        if (!claimed) return;

        if (armed) fire();
        else springBack();
    }

    function handleTouchCancel() {
        if (!touchData) return;
        const claimed = touchData.claimed;
        touchData = null;
        if (claimed) springBack();
        else clearProgress();
    }

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    target.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return function cleanup() {
        target.removeEventListener('touchstart', handleTouchStart);
        target.removeEventListener('touchmove', handleTouchMove);
        target.removeEventListener('touchend', handleTouchEnd);
        target.removeEventListener('touchcancel', handleTouchCancel);
        clearProgress();
    };
}

function linksWeightInit(selector, locStorItem) {
    const links = document.querySelectorAll(selector);
    let linksWeight = JSON.parse(localStorage.getItem(locStorItem)) || {
        dateChanged: new Date().toDateString(),
        list: [],
    };
    const dateCurr = new Date().toDateString();

    const currentIds = new Set([...links].map(el => el.getAttribute('href')));
    linksWeight.list = linksWeight.list.filter(track => currentIds.has(track.id));

    links.forEach(el => {
        const trackLink = el.getAttribute('href');
        if (!linksWeight.list.some(e => e.id === trackLink)) {
            linksWeight.list.push({
                id: trackLink,
                weight: 400,
                dateChanged: dateCurr,
                changesToday: 0
            });
        }
    });

    if (!isToday(new Date(linksWeight.dateChanged))) {
        linksWeight.dateChanged = dateCurr;
        linksWeight.list.forEach(track => {
            track.weight -= 1;
        });
    }

    linksWeight.list.forEach(track => {
        document.querySelectorAll(`a[href="${track.id}"]`).forEach(link => {
            link.style.fontVariationSettings = `"wght" ${weightCalc(track.weight)}`;
        });
    });

    localStorage.setItem(locStorItem, JSON.stringify(linksWeight));
}

function linksWeightChange(id, locStorItem) {
    const linksWeight = JSON.parse(localStorage.getItem(locStorItem));
    if (!linksWeight) {
        return false;
    }
    const track = linksWeight.list.find(e => e.id === id);
    if (!track) {
        return false;
    }

    if (!isToday(new Date(track.dateChanged))) {
        track.dateChanged = new Date().toDateString();
        track.changesToday = 0;
    }

    if (track.changesToday < 5) {
        track.weight += Math.ceil(Math.pow(5 - track.changesToday, 3) / 16);
        track.changesToday++;

        if (track.weight < 400) {
            track.weight = 408;
        }
        if (track.weight > 800) {
            track.weight = 800;
        }

        document.querySelectorAll(`a[href="${id}"]`).forEach(link => {
            link.style.fontVariationSettings = `"wght" ${weightCalc(track.weight)}`;
        });

        localStorage.setItem(locStorItem, JSON.stringify(linksWeight));
    }
}

function weightCalc(num) {
    let result = 400;
    if (num < 300) {
        result = 300;
    } else {
        const x = Math.min(num, 800) - 400;
        result = Math.floor(x * (Math.pow((400 - x), 1.8) * 0.00004 + 1) + 400);
    }
    return result;
}

function isToday(someDate) {
    const today = new Date()
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear()
}

function createStructuredData(chords) {
    const tracks = [...chords].map(track => ({
        "@type": "MusicComposition",
        "name": track.getElementsByTagName('title')[0].textContent,
        "author": {
            "@type": "Person",
            "name": "Михаил Щербаков"
        },
        "inLanguage": "ru",
        "includedInAlbum": {
            "@type": "MusicAlbum",
            "name": track.getElementsByTagName('album')[0]?.textContent || "Unknown Album"
        },
        "dateCreated": track.getElementsByTagName('year')[0].textContent,
        "url": `${window.location.origin}/scherbakov/songs/${track.id}`,
        "description": "Текст и аккорды песни"
    }));

    const jsonLD = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pageTitle,
        "url": `${window.location.origin}/scherbakov`,
        "about": {
            "@type": "Dataset",
            "name": "Аккорды к песням Михаила Щербакова",
            "description": "Коллекция текстов и аккордов песен",
            "license": "https://creativecommons.org/licenses/by-nc/4.0/",
            "keywords": ["Михаил Щербаков", "аккорды", "песни", "тексты", "музыка", "авторская песня", "гитара"],
            "creator": {
                "@type": "Person",
                "name": "Михаил Щербаков"
            },
            "hasPart": tracks
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
    script.textContent = JSON.stringify(jsonLD);
}
