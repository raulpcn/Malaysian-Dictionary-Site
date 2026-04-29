var App = {
  tab: 'home', cat: null,

  init() {
    if (location.protocol !== 'file:') {
      var l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.json'; document.head.appendChild(l)
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')
    }
    this.shell()
    this.go('home')
  },

  wotd() {
    var d = new Date()
    var day = d.getFullYear() * 1000 + (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 | 0)
    return WORDS[day % WORDS.length]
  },

  shell() {
    document.getElementById('app').innerHTML =
      '<header id="hdr" class="hd"><div class="hd-in"><div class="hd-t">Malaysia Dictionary</div><div class="hd-s">English > Bahasa Melayu</div></div></header>' +
      '<div id="cx" class="cx"></div>' +
      '<nav id="nav" class="bn">' +
      '<button class="nb active" data-t="home"><span class="nb-i">🏠</span><span class="nb-l">Home</span></button>' +
      '<button class="nb" data-t="search"><span class="nb-i">🔍</span><span class="nb-l">Search</span></button>' +
      '<button class="nb" data-t="words"><span class="nb-i">📂</span><span class="nb-l">Words</span></button>' +
      '<button class="nb" data-t="lists"><span class="nb-i">📋</span><span class="nb-l">Lists</span></button>' +
      '<button class="nb" data-t="grammar"><span class="nb-i">📖</span><span class="nb-l">Grammar</span></button>' +
      '<button class="nb" data-t="quiz"><span class="nb-i">🧠</span><span class="nb-l">Quiz</span></button>' +
      '</nav>'
    document.getElementById('nav').onclick = function(e) {
      var b = e.target.closest('.nb')
      if (b) App.go(b.dataset.t)
    }
    document.getElementById('cx').onclick = function(e) { App.click(e) }
  },

  go(t) {
    this.tab = t
    var navs = document.querySelectorAll('.nb')
    for (var i = 0; i < navs.length; i++) navs[i].className = 'nb' + (navs[i].dataset.t === t ? ' active' : '')
    document.getElementById('hdr').className = 'hd' + (t === 'search' ? ' hd--search' : '')
    if (t === 'home') this.home()
    else if (t === 'search') this.search()
    else if (t === 'words') this.words()
    else if (t === 'lists') this.lists()
    else if (t === 'quiz') this.quiz()
    else if (t === 'grammar') this.grammar()
    else if (t === 'stats') this.stats()
  },

  click(e) {
    if (e.target.closest('.speak-btn')) {
      var c = e.target.closest('.wc')
      if (c) { var ms = c.getAttribute('data-ms'); if (ms) this.speak(ms) }
      return
    }
    if (e.target.closest('.card-btn')) {
      var c = e.target.closest('.wc')
      if (c) {
        var en = c.getAttribute('data-en')
        var ms = c.getAttribute('data-ms')
        for (var i = 0; i < WORDS.length; i++) {
          if (WORDS[i].en === en && WORDS[i].ms === ms) { this.downloadCard(WORDS[i]); break }
        }
      }
      return
    }
    var f = e.target.closest('.fav-btn')
    if (f && f.dataset.idx !== undefined) {
      var sp = f.closest('.sp')
      var cg = f.closest('[id^="cgw_"]')
      var w = null
      if (sp) {
        for (var i = 0; i < WORDS.length; i++) {
          if (WORDS[i].en === f.dataset.en && WORDS[i].ms === f.dataset.ms) { w = WORDS[i]; break }
        }
      } else if (cg) {
        var ws = WORDS.filter(function(ww) { return ww.cat === cg.id.replace('cgw_', '') })
        w = ws[parseInt(f.dataset.idx)]
      }
      if (w) { var nf = Favorites.toggle(w); f.textContent = nf ? '⭐' : '☆'; f.className = 'fav-btn' + (nf ? ' on' : '') }
      return
    }
    if (e.target.closest('.pl-add-btn')) {
      var c = e.target.closest('.wc')
      if (c) { var en = c.querySelector('.wc-en'); var ms = c.querySelector('.wc-ms'); if (en && ms) this.plDlg({ en: en.textContent, ms: ms.textContent }) }
      return
    }
    if (e.target.closest('.rm-btn')) {
      var b = e.target.closest('.rm-btn')
      PlaylistManager.removeWord(b.dataset.pl, b.dataset.en, b.dataset.ms)
      this.lists()
      return
    }
    if (e.target.closest('.pl-del')) {
      if (confirm('Delete this playlist?')) { PlaylistManager.delete(e.target.closest('.pl-del').dataset.pl); this.lists() }
      return
    }
    if (e.target.closest('.pl-exp')) {
      var b = e.target.closest('.pl-exp')
      var id = b.dataset.pl
      var name = b.dataset.pln
      var ww = PlaylistManager.getWords(id)
      var csv = 'English,Malay\n'
      for (var i = 0; i < ww.length; i++) csv += '"' + ww[i].en + '","' + ww[i].ms + '"\n'
      var blob = new Blob([csv], { type: 'text/csv' })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url; a.download = (name || 'playlist') + '.csv'; a.click()
      URL.revokeObjectURL(url)
      return
    }
  },

  wotdTime() {
    var n = new Date()
    var now = n.getTime()
    var nextMidRo = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 21, 0, 0)
    if (now >= nextMidRo) nextMidRo += 86400000
    var left = nextMidRo - now
    var h = Math.floor(left / 3600000)
    var m = Math.floor((left % 3600000) / 60000)
    var s = Math.floor((left % 60000) / 1000)
    var my = n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })
    return { my: my, ro: (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s }
  },

  home() {
    var c = document.getElementById('cx')
    var w = this.wotd()
    var wl = CATEGORIES[w.cat] ? CATEGORIES[w.cat].label : w.cat
    var t = this.wotdTime()
    c.innerHTML =
      '<div class="hm"><div class="hm-h"><div class="hm-f">🇲🇾</div><h2 class="hm-ti">Selamat Datang!</h2><p class="hm-d"><strong>' + WORDS.length + ' words</strong> across ' + Object.keys(CATEGORIES).length + ' categories. Start learning Bahasa Melayu!</p></div>' +
      '<div class="hm-wotd"><div class="hm-wh">📅 Word of the Day</div><div class="wc"><div class="wc-r"><span class="wc-en">' + esc(w.en) + '</span><span class="wc-ar">→</span><span class="wc-ms">' + esc(w.ms) + '</span></div><div class="wc-ct">' + wl + '</div>' + (w.ex ? '<div class="wc-ex">"' + esc(w.ex) + '"</div>' : '') + '<div class="wc-tm"><span>🇲🇾 <span id="myTime">' + t.my + '</span></span><span>⏳ <span id="roTime">' + t.ro + '</span></span></div></div></div>' +
      this.goalHTML() +
      this.streakHTML() +
      '<div class="hm-q">' +
      '<button class="hc-btn" data-g="search"><span class="hc-i">🔍</span><span class="hc-t">Search a word</span><span class="hc-a">→</span></button>' +
      '<button class="hc-btn" data-g="words"><span class="hc-i">📂</span><span class="hc-t">Browse categories</span><span class="hc-a">→</span></button>' +
      '<button class="hc-btn" data-g="lists"><span class="hc-i">📋</span><span class="hc-t">Manage playlists</span><span class="hc-a">→</span></button>' +
      '<button class="hc-btn" data-g="quiz"><span class="hc-i">🧠</span><span class="hc-t">Take a quiz</span><span class="hc-a">→</span></button>' +
      '</div>' +
      '<div class="hm-p"><h3 class="hm-ph">Popular Words</h3><div class="hm-pg">' +
      this.wcQuick({en:"hello",ms:"helo",cat:"greetings"}) +
      this.wcQuick({en:"thank you",ms:"terima kasih",cat:"greetings"}) +
      this.wcQuick({en:"water",ms:"air",cat:"food"}) +
      this.wcQuick({en:"eat",ms:"makan",cat:"food"}) +
      this.wcQuick({en:"how are you",ms:"apa khabar",cat:"greetings"}) +
      this.wcQuick({en:"goodbye",ms:"selamat tinggal",cat:"greetings"}) +
      '</div></div>' +
      '<div class="hm-tip">💡 Tap <strong>Search</strong> to look up words, <strong>Words</strong> to browse by topic, or <strong>Quiz</strong> to test yourself!</div></div>'
    var btns = c.querySelectorAll('.hc-btn')
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function() { App.go(this.dataset.g) }
    }
    var gBtn = document.getElementById('goalSetBtn')
    if (gBtn) gBtn.onclick = function() { App.goalDialog() }
    if (this._to) clearInterval(this._to)
    var self = this
    this._to = setInterval(function() {
      if (document.getElementById('myTime') && document.getElementById('roTime')) {
        var t = self.wotdTime()
        document.getElementById('myTime').textContent = t.my
        document.getElementById('roTime').textContent = t.ro
      }
    }, 1000)
    this.checkNotification()
  },

  wcQuick(w) {
    var lab = CATEGORIES[w.cat] ? CATEGORIES[w.cat].label : w.cat
    return '<div class="wc"><div class="wc-r"><span class="wc-en">' + esc(w.en) + '</span><span class="wc-ar">→</span><span class="wc-ms">' + esc(w.ms) + '</span></div><div class="wc-ct">' + lab + '</div></div>'
  },

  search() {
    var cats = Object.keys(CATEGORIES)
    var catOpts = '<option value="">All categories</option>'
    for (var i = 0; i < cats.length; i++) catOpts += '<option value="' + cats[i] + '">' + CATEGORIES[cats[i]].icon + ' ' + CATEGORIES[cats[i]].label + '</option>'
    document.getElementById('cx').innerHTML = '<div class="sp"><div class="sb"><span class="sb-i">🔍</span><input type="text" id="si" class="si" placeholder="Type English or Malay..." autocomplete="off"></div><select id="scat" class="qs" style="margin-bottom:10px;width:100%">' + catOpts + '</select><div id="sr" class="sr"></div></div>'
    var si = document.getElementById('si')
    si.oninput = function() { App.doSearch(si.value) }
    si.focus()
    document.getElementById('scat').onchange = function() { App.doSearch(document.getElementById('si').value) }
    this.doSearch('')
  },

  doSearch(q) {
    var c = document.getElementById('sr')
    var qu = (q || '').toLowerCase().trim()
    var cat = document.getElementById('scat') ? document.getElementById('scat').value : ''
    if (!qu) {
      c.innerHTML = '<div class="sr-e"><div class="sr-ei">🔍</div><p>Search for any word</p><p class="sr-eh">Try: <button class="ht" data-q="hello">hello</button> · <button class="ht" data-q="makan">makan</button> · <button class="ht" data-q="air">air</button></p></div>'
      var btns = c.querySelectorAll('.ht')
      for (var i = 0; i < btns.length; i++) {
        btns[i].onclick = function() { document.getElementById('si').value = this.dataset.q; App.doSearch(this.dataset.q) }
      }
      return
    }
    var scored = []
    for (var i = 0; i < WORDS.length; i++) {
      var w = WORDS[i]
      var en = w.en.toLowerCase(), ms = w.ms.toLowerCase()
      var ex = w.ex ? w.ex.toLowerCase() : ''
      var alt = w.alt ? w.alt.toLowerCase() : ''
      var score = 0
      if (en === qu) score = 100
      else if (ms === qu) score = 95
      else if (en.indexOf(qu) === 0) score = 80
      else if (ms.indexOf(qu) === 0) score = 75
      else if (en.indexOf(qu) >= 0) score = 60
      else if (ms.indexOf(qu) >= 0) score = 50
      else if (ex.indexOf(qu) >= 0) score = 30
      else if (alt.indexOf(qu) >= 0) score = 20
      if (score > 0 && (!cat || w.cat === cat)) scored.push({ word: w, score: score, idx: i })
    }
    scored.sort(function(a, b) { return b.score - a.score })
    if (!scored.length) {
      var sug = []
      for (var i = 0; i < WORDS.length; i++) {
        var d1 = this.lev(WORDS[i].en.toLowerCase(), qu)
        var d2 = this.lev(WORDS[i].ms.toLowerCase(), qu)
        var d = Math.min(d1, d2)
        if (d <= 3) sug.push({ word: WORDS[i], dist: d })
      }
      sug.sort(function(a, b) { return a.dist - b.dist })
      var html = '<div class="sr-e"><div class="sr-ei">😕</div><p>No results for "<strong>' + esc(qu) + '</strong>"</p>'
      if (sug.length) {
        html += '<p class="sr-eh">Did you mean:</p><div class="sr-sug">'
        var seen = {}
        for (var i = 0; i < Math.min(sug.length, 6); i++) {
          var s = sug[i].word.en.toLowerCase() + '|' + sug[i].word.ms.toLowerCase()
          if (seen[s]) continue; seen[s] = true
          html += '<button class="ht" data-q="' + esc(sug[i].word.en) + '">' + esc(sug[i].word.en) + '</button> · '
        }
        html = html.replace(/ · $/, '') + '</div>'
      }
      html += '</div>'
      c.innerHTML = html
      var btns = c.querySelectorAll('.ht')
      for (var i = 0; i < btns.length; i++) {
        btns[i].onclick = function() { document.getElementById('si').value = this.dataset.q; App.doSearch(this.dataset.q) }
      }
      return
    }
    var total = scored.length
    if (scored.length > 50) scored = scored.slice(0, 50)
    var html = '<div class="sr-n">' + total + ' result' + (total > 1 ? 's' : '') + (total > 50 ? ', showing top 50' : '') + '</div>'
    for (var i = 0; i < scored.length; i++) html += this.wcFull(scored[i].word, i, qu)
    c.innerHTML = html
  },

  lev(a, b) {
    var m = a.length, n = b.length
    var d = []
    for (var i = 0; i <= m; i++) { d[i] = [i]; for (var j = 1; j <= n; j++) d[i][j] = 0 }
    for (var j = 0; j <= n; j++) d[0][j] = j
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + 1)
      }
    }
    return d[m][n]
  },

  speak(text) {
    if (window.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(text)
      u.lang = 'ms'
      u.volume = 1
      u.rate = 0.9
      speechSynthesis.speak(u)
    }
  },

  downloadCard(w) {
    var cw = 600, ch = 350
    var c = document.createElement('canvas')
    c.width = cw; c.height = ch
    var ctx = c.getContext('2d')

    ctx.fillStyle = '#1c1c1e'
    ctx.fillRect(0, 0, cw, ch)

    ctx.fillStyle = '#d32f2f'
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(cw, 0); ctx.lineTo(cw, 6); ctx.lineTo(0, 6)
    ctx.fill()

    ctx.fillStyle = '#999'
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Malaysia Dictionary', cw / 2, 34)

    var lab = CATEGORIES[w.cat] ? CATEGORIES[w.cat].label : w.cat
    ctx.fillStyle = '#555'
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.fillText(lab, cw / 2, 54)

    ctx.fillStyle = '#e8e8e8'
    ctx.font = '800 36px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.fillText(w.en, cw / 2, 120)

    ctx.fillStyle = '#d32f2f'
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.fillText('\u2192', cw / 2, 165)

    ctx.fillStyle = '#90caf9'
    ctx.font = '700 32px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.fillText(w.ms, cw / 2, 210)

    if (w.ex) {
      ctx.fillStyle = '#777'
      ctx.font = 'italic 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
      var ex = w.ex.length > 40 ? w.ex.substring(0, 38) + '\u2026' : w.ex
      ctx.fillText('\u201c' + ex + '\u201d', cw / 2, 250)
    }

    ctx.fillStyle = '#333'
    ctx.fillRect(0, ch - 50, cw, 1)

    ctx.fillStyle = '#555'
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    ctx.fillText('Malaysia Dictionary', cw / 2, ch - 22)

    c.toBlob(function(blob) {
      var f = new File([blob], w.en.replace(/\s+/g, '_') + '_' + w.ms.replace(/\s+/g, '_') + '.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: w.en + ' → ' + w.ms }).catch(function(){})
      } else {
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = f.name
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  },

  hl(t, q) {
    if (!q) return t
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi')
    return t.replace(re, '<mark>$1</mark>')
  },

  wcFull(w, i, q) {
    var f = Favorites.isFavorite(w)
    var pls = PlaylistManager.getWordPlaylists(w)
    var lab = CATEGORIES[w.cat] ? CATEGORIES[w.cat].label : w.cat
    var en = esc(w.en), ms = esc(w.ms)
    if (q) { en = this.hl(en, esc(q)); ms = this.hl(ms, esc(q)) }
    var alt = w.alt ? '<span class="wc-alt">' + esc(w.alt) + '</span>' : ''
    var tags = ''
    if (pls.length) {
      tags = '<div class="wc-pl-tags">'
      for (var j = 0; j < pls.length; j++) tags += '<span class="wc-pl-tag">' + esc(pls[j].name) + '</span>'
      tags += '</div>'
    }
    return '<div class="wc" data-en="' + esc(w.en) + '" data-ms="' + esc(w.ms) + '"><div class="wc-t"><div class="wc-m"><div><div class="wc-r"><span class="wc-en">' + en + '</span><span class="wc-ar">→</span><span class="wc-ms">' + ms + '</span>' + alt + '</div><div class="wc-ct">' + lab + '</div></div><div class="wc-acts"><button class="speak-btn" title="Listen">🔊</button><button class="card-btn" title="Download image">🖼️</button><button class="pl-add-btn">➕</button><button class="fav-btn' + (f ? ' on' : '') + '" data-idx="' + i + '" data-en="' + esc(w.en) + '" data-ms="' + esc(w.ms) + '">' + (f ? '⭐' : '☆') + '</button></div></div>' + (w.ex ? '<div class="wc-ex">"' + esc(w.ex) + '"</div>' : '') + tags + '</div></div>'
  },

  words() {
    var c = document.getElementById('cx')
    var ks = Object.keys(CATEGORIES)
    var html = '<div class="cp"><h2 class="ph">Browse by Topic</h2><p class="ps">Tap to expand a category</p><div class="cg">'
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i]
      var cnt = 0
      for (var j = 0; j < WORDS.length; j++) { if (WORDS[j].cat === k) cnt++ }
      var cat = CATEGORIES[k]
      var op = this.cat === k
      html += '<div class="cg-g"><button class="cg-b' + (op ? ' o' : '') + '" data-c="' + k + '"><span class="cg-i">' + cat.icon + '</span><span class="cg-n">' + cat.label + '</span><span class="cg-c">' + cnt + '</span><span class="cg-ar">' + (op ? '▼' : '▶') + '</span></button><div class="cg-w' + (op ? ' o' : '') + '" id="cgw_' + k + '">'
        if (op) {
            var ci = 0
            for (var j = 0; j < WORDS.length; j++) { if (WORDS[j].cat === k) html += this.wcFull(WORDS[j], ci++) }
        }
      html += '</div></div>'
    }
    html += '</div></div>'
    c.innerHTML = html
    var btns = c.querySelectorAll('.cg-b')
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function() { App.cat = App.cat === this.dataset.c ? null : this.dataset.c; App.words() }
    }
  },

  lists() {
    var c = document.getElementById('cx')
    var favs = Favorites.getAll()
    var pls = PlaylistManager.list()
    var getC = function(k) { try { var v = localStorage.getItem('lp_collapse_' + k); return v === null || v !== '1' } catch(e) { return true } }
    var setC = function(k, v) { try { localStorage.setItem('lp_collapse_' + k, v ? '1' : '0') } catch(e) {} }
    var html = '<div class="lp"><h2 class="ph">📋 Your Lists</h2><p class="ps">Star words to save to Favorites, or create custom playlists</p>'

    var fo = getC('favs')
    html += '<div class="lp-favs"><div class="lp-h lp-toggle" data-c="favs"><span>⭐ Favorites</span><span class="lp-hc">' + favs.length + '</span><span class="lp-ar">' + (fo ? '▼' : '▶') + '</span></div><div class="lp-in"' + (fo ? '' : ' style="display:none"') + '>'
    if (favs.length === 0) {
      html += '<div class="lp-e"><p>No favorites yet. Tap ☆ on any word to save it.</p></div>'
    } else {
      for (var i = 0; i < favs.length; i++) {
        var pb = ProgressTracker.bar(favs[i], 'favs')
        html += '<div class="wc lp-wc"><div class="wc-t"><div class="wc-m"><div><div class="wc-r"><span class="wc-en">' + esc(favs[i].en) + '</span><span class="wc-ar">→</span><span class="wc-ms">' + esc(favs[i].ms) + '</span></div>' + pb + '</div></div><button class="fav-btn on" data-fi="' + i + '">⭐</button></div></div></div>'
      }
    }
    html += '</div></div>'

    html += '<div class="lp-add"><input type="text" id="plInp" class="si" placeholder="New playlist name..." maxlength="40"><button id="plCr" class="btn-s">Create</button></div><div class="lp-pls">'
    if (pls.length === 0) {
      html += '<div class="lp-e"><p>No playlists yet. Create one above!</p></div>'
    } else {
      for (var i = 0; i < pls.length; i++) {
        var po = getC(pls[i].id)
        var ww = PlaylistManager.getWords(pls[i].id)
        html += '<div class="lp-c"><div class="lp-ch lp-toggle" data-c="' + pls[i].id + '"><span class="lp-ct">📁 ' + esc(pls[i].name) + '</span><span class="lp-cc">' + pls[i].count + '</span><span class="lp-ar">' + (po ? '▼' : '▶') + '</span></div><div class="lp-ci"' + (po ? '' : ' style="display:none"') + '>'
        if (ww.length === 0) {
          html += '<div class="lp-e"><p>Empty.</p></div>'
        } else {
          for (var j = 0; j < ww.length; j++) {
            var pb = ProgressTracker.bar(ww[j], pls[i].id)
            html += '<div class="wc lp-wc"><div class="wc-t"><div class="wc-m"><div><div class="wc-r"><span class="wc-en">' + esc(ww[j].en) + '</span><span class="wc-ar">→</span><span class="wc-ms">' + esc(ww[j].ms) + '</span></div>' + pb + '</div></div><button class="rm-btn" data-pl="' + pls[i].id + '" data-en="' + esc(ww[j].en) + '" data-ms="' + esc(ww[j].ms) + '">✕</button></div></div></div>'
          }
        }
        html += '</div><div class="lp-ca"><button class="pl-exp" data-pl="' + pls[i].id + '" data-pln="' + esc(pls[i].name) + '">📤 Export CSV</button><button class="pl-del" data-pl="' + pls[i].id + '">Delete playlist</button></div></div>'
      }
    }
    html += '</div></div>'
    html += '<div class="lp-io"><button id="exportAll" class="btn-s" style="width:100%;margin-top:10px">📤 Export All Data</button><button id="importAll" class="btn-s" style="width:100%;margin-top:6px">📥 Import Data</button><input type="file" id="importFile" accept=".json" style="display:none"></div>'
    c.innerHTML = html
    var toggles = c.querySelectorAll('.lp-toggle')
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].onclick = function() {
        var k = this.dataset.c
        var isOpen = getC(k)
        setC(k, isOpen)
        App.lists()
      }
    }
    document.getElementById('plCr').onclick = function() { var n = document.getElementById('plInp').value.trim(); if (n) { PlaylistManager.create(n); App.lists() } }
    document.getElementById('plInp').onkeydown = function(e) { if (e.key === 'Enter') document.getElementById('plCr').click() }
    var fbtns = c.querySelectorAll('.fav-btn[data-fi]')
    for (var i = 0; i < fbtns.length; i++) {
      fbtns[i].onclick = function() { var f = Favorites.getAll()[parseInt(this.dataset.fi)]; if (f) { Favorites.remove(f); App.lists() } }
    }
    document.getElementById('exportAll').onclick = function() { App.exportAll() }
    document.getElementById('importAll').onclick = function() { document.getElementById('importFile').click() }
    document.getElementById('importFile').onchange = function(e) { if (e.target.files[0]) App.importAll(e.target.files[0]) }
  },

  plDlg(w) {
    var pls = PlaylistManager.list()
    var d = document.createElement('div')
    d.className = 'ovl'
    var h = '<div class="ovl-b"><div class="ovl-h">Add to playlist</div><div class="ovl-w">"' + esc(w.en) + '"</div><div class="ovl-pls">'
    if (pls.length === 0) h += '<p class="ovl-e">No playlists yet</p>'
    else {
      for (var i = 0; i < pls.length; i++) {
        var inPl = PlaylistManager.isInPlaylist(pls[i].id, w)
        h += '<label class="ovl-pl' + (inPl ? ' on' : '') + '"><input type="checkbox" data-pl="' + pls[i].id + '"' + (inPl ? ' checked' : '') + '> ' + esc(pls[i].name) + '</label>'
      }
    }
    h += '</div><button class="btn-s ovl-done">Done</button></div>'
    d.innerHTML = h
    document.body.appendChild(d)
    d.querySelector('.ovl-done').onclick = function() {
      var cbs = d.querySelectorAll('input[type="checkbox"]')
      for (var i = 0; i < cbs.length; i++) {
        if (cbs[i].checked) PlaylistManager.addWord(cbs[i].dataset.pl, w)
        else PlaylistManager.removeWord(cbs[i].dataset.pl, w.en, w.ms)
      }
      d.remove()
    }
  },

  quiz() {
    var c = document.getElementById('cx')
    var favs = Favorites.getAll()
    var pls = PlaylistManager.list()
    var html = '<div class="qp" id="qp"><div id="qs"><h2 class="ph">🧠 Quiz</h2><p class="ps">Test your vocabulary with flashcards</p><div class="qc">'
    html += '<label class="qf"><span class="qfl">Direction</span><select id="qd" class="qs"><option value="en-ms">English → Malay</option><option value="ms-en">Malay → English</option></select></label>'
    html += '<label class="qf"><span class="qfl">Word set</span><select id="qsrc" class="qs"><option value="all">All words (' + WORDS.length + ')</option><option value="favs">Favorites (' + favs.length + ')</option>'
    for (var i = 0; i < pls.length; i++) html += '<option value="pl_' + pls[i].id + '">📁 ' + esc(pls[i].name) + ' (' + pls[i].count + ')</option>'
    html += '</select></label>'
    html += '<label class="qf"><span class="qfl">Mode</span><select id="qmode" class="qs"><option value="type">⌨️ Type answer</option><option value="mc">🔘 Multiple choice</option><option value="fc">🃏 Flashcard</option></select></label>'
    html += '<label class="qf"><span class="qfl">Questions</span><select id="qn" class="qs"><option value="5">5 quick</option><option value="10" selected>10 normal</option><option value="20">20 challenge</option><option value="0">All</option></select></label>'
    html += '<label class="qf"><span class="qfl">Spaced repetition</span><select id="qsr" class="qs"><option value="0">Off - one attempt each</option><option value="1" selected>On - retry wrong words</option></select></label>'
    html += '<button id="qgo" class="btn-p">Start Quiz</button>'
    html += '<button class="btn-s" style="margin-top:10px" data-g="stats">📊 View Progress</button>'
    html += '<button id="qprBtn" class="btn-s" style="margin-top:8px">📈 Word Progress</button>'
    html += '<div id="qprPanel" style="display:none;margin-top:10px"></div>'
    html += '</div></div><div id="qa" style="display:none"></div><div id="qd2" style="display:none"></div></div>'
    c.innerHTML = html
    document.getElementById('qgo').onclick = function() { App.qStart() }
    var stBtn = c.querySelector('[data-g="stats"]')
    if (stBtn) stBtn.onclick = function() { App.go('stats') }
    document.getElementById('qprBtn').onclick = function() {
      var p = document.getElementById('qprPanel')
      if (p.style.display === 'none') {
        p.style.display = 'block'
        var src = document.getElementById('qsrc').value
        var source = src === 'all' ? null : src
        p.innerHTML = ProgressTracker.progressHTML(source, true)
        var resetBtns = p.querySelectorAll('.pr-rw')
        for (var ri = 0; ri < resetBtns.length; ri++) {
          resetBtns[ri].onclick = function(e) {
            var en = this.dataset.en; var ms = this.dataset.ms; var s = this.dataset.src || null
            ProgressTracker.resetWord({ en: en, ms: ms }, s)
            e.target.closest('.pr-gw').remove()
          }
        }
        var raBtn = p.querySelector('.pr-ra')
        if (raBtn) {
          raBtn.onclick = function() {
            if (confirm('Reset all word progress?')) {
              ProgressTracker.resetAll(this.dataset.src || null)
              document.getElementById('qprPanel').innerHTML = '<div style="padding:12px;text-align:center;color:var(--s);font-size:.85rem">Progress cleared.</div>'
            }
          }
        }
      } else p.style.display = 'none'
    }
  },

  qStart() {
    var dir = document.getElementById('qd').value
    var src = document.getElementById('qsrc').value
    var max = parseInt(document.getElementById('qn').value)
    var mode = document.getElementById('qmode').value
    var sr = document.getElementById('qsr').value === '1'
    var pool
    if (src === 'all') { pool = [] ; for (var i = 0; i < WORDS.length; i++) pool.push(WORDS[i]) }
    else if (src === 'favs') { pool = Favorites.getAll() }
    else { pool = PlaylistManager.getWords(src.replace('pl_', '')) }
    if (mode === 'fc') { this.fcStart(pool, dir, sr, src); return }
    if (mode === 'mc' && pool.length < 4) { alert('Need at least 4 words for multiple choice!'); return }
    if (pool.length < 1) { alert('No words selected!'); return }
    pool.sort(function() { return Math.random() - 0.5 })
    if (max > 0 && max < pool.length) pool = pool.slice(0, max)
    QS.start(pool, dir, mode, sr, src)
    this.qShow()
  },

  qShow() {
    var q = QS.current()
    if (!q) { this.qDone(); return }
    var p = QS.progress()
    document.getElementById('qs').style.display = 'none'
    var a = document.getElementById('qa')
    a.style.display = 'block'
    document.getElementById('qd2').style.display = 'none'
    var ie = QS.dir === 'en-ms'
    if (QS.mode === 'mc') {
      var opts = q.options.map(function(o, i) {
        return '<button class="mc-o' + (o === q.answer ? ' mc-c' : '') + '" data-ans="' + esc(o) + '">' + esc(o) + '</button>'
      }).join('')
      a.innerHTML = '<div class="qqp">' + p.done + '/' + p.total + ' · ' + p.correct + ' correct</div><div class="qqb"><div class="qqf" style="width:' + ((p.done / p.total) * 100) + '%"></div></div><div class="qq"><div class="qql">Choose the correct ' + (ie ? 'Malay' : 'English') + ' translation:</div><div class="qqw">' + esc(q.prompt) + '</div></div><div class="mc" id="mc">' + opts + '</div><div id="qfb" class="qfb"></div>'
      var btns = a.querySelectorAll('.mc-o')
      for (var i = 0; i < btns.length; i++) {
        btns[i].onclick = function() { App.qCheckMC(this) }
      }
    } else {
      a.innerHTML = '<div class="qqp">' + p.done + '/' + p.total + ' · ' + p.correct + ' correct</div><div class="qqb"><div class="qqf" style="width:' + ((p.done / p.total) * 100) + '%"></div></div><div class="qq"><div class="qql">Translate this ' + (ie ? 'English' : 'Malay') + ' word:</div><div class="qqw">' + esc(q.prompt) + '</div><div class="qqd">→ ' + (ie ? 'Malay' : 'English') + '</div></div><div class="qqir"><input type="text" id="qai" class="si" placeholder="Your answer..." autocomplete="off"><button id="qas" class="btn-p" style="width:auto;padding:10px 20px">Check</button></div><div id="qfb" class="qfb"></div>'
      document.getElementById('qai').focus()
      document.getElementById('qas').onclick = function() { App.qCheck() }
      document.getElementById('qai').onkeydown = function(e) { if (e.key === 'Enter') App.qCheck() }
    }
  },

  qCheck() {
    var inp = document.getElementById('qai')
    var a = inp.value.trim()
    if (!a) return
    var r = QS.check(a)
    document.getElementById('qfb').innerHTML = r.correct ? '<div class="fb fb-ok">✅ Correct!</div>' : '<div class="fb fb-no">❌ Wrong! Answer: <strong>' + esc(r.answer) + '</strong></div>'
    inp.disabled = true
    document.getElementById('qas').disabled = true
    var self = this
    setTimeout(function() { QS.next() ? self.qShow() : self.qDone() }, 1000)
  },

  qCheckMC(btn) {
    var a = btn.dataset.ans
    var r = QS.check(a)
    var allBtns = document.getElementById('mc').querySelectorAll('.mc-o')
    for (var i = 0; i < allBtns.length; i++) {
      allBtns[i].disabled = true
      if (allBtns[i].classList.contains('mc-c')) allBtns[i].classList.add('mc-c2')
      if (allBtns[i] === btn && !r.correct) btn.classList.add('mc-w')
    }
    document.getElementById('qfb').innerHTML = r.correct ? '<div class="fb fb-ok">✅ Correct!</div>' : '<div class="fb fb-no">❌ Wrong! Answer: <strong>' + esc(r.answer) + '</strong></div>'
    var self = this
    setTimeout(function() { QS.next() ? self.qShow() : self.qDone() }, 1000)
  },

  qDone() {
    var r = QS.results()
    document.getElementById('qs').style.display = 'none'
    document.getElementById('qa').style.display = 'none'
    var d = document.getElementById('qd2')
    d.style.display = 'block'
    var em, msg
    var p = r.pct
    if (p >= 90) { em = '🏆'; msg = 'Luar biasa! Excellent!' }
    else if (p >= 70) { em = '👏'; msg = 'Bagus! Good job!' }
    else if (p >= 50) { em = '💪'; msg = "Keep practicing, you're improving!" }
    else { em = '📚'; msg = 'Keep studying!' }
    d.innerHTML = '<div class="qd2"><div class="qd2e">' + em + '</div><div class="qd2m">' + msg + '</div><div class="qd2s">' + r.correct + ' / ' + r.total + '</div><div class="qd2p">' + p + '%</div><div class="qd2a"><button id="qr1" class="btn-p">Try Again</button><button id="qr2" class="btn-s">Change Settings</button></div></div>'
    document.getElementById('qr1').onclick = function() { App.qStart() }
    document.getElementById('qr2').onclick = function() { App.quiz() }
    this.saveStats(r)
    ProgressTracker.bulkUpdate(QS.wordResults)
    this.goalInc()
  },

  saveStats(r) {
    var key = 'ms_dict_stats'
    var stats
    try { stats = JSON.parse(localStorage.getItem(key)) || { quizzes: 0, totalCorrect: 0, totalQuestions: 0, streak: 0, bestStreak: 0, dates: {} } } catch(e) { stats = { quizzes: 0, totalCorrect: 0, totalQuestions: 0, streak: 0, bestStreak: 0, dates: {} } }
    stats.quizzes++
    stats.totalCorrect += r.correct
    stats.totalQuestions += r.total
    stats.dates = stats.dates || {}
    var today = new Date().toISOString().split('T')[0]
    stats.dates[today] = true
    if (r.pct >= 50) {
      stats.streak++
      if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak
    } else { stats.streak = 0 }
    try { localStorage.setItem(key, JSON.stringify(stats)) } catch(e) {}
  },

  streakHTML() {
    var stats
    try { stats = JSON.parse(localStorage.getItem('ms_dict_stats')) } catch(e) {}
    if (!stats || !stats.dates) return ''

    var html = '<div class="hm-st"><div class="hm-st-h">📆 Recent Activity</div><div class="hm-st-g">'
    var now = new Date()
    for (var i = 13; i >= 0; i--) {
      var d = new Date(now)
      d.setDate(d.getDate() - i)
      var key = d.toISOString().split('T')[0]
      var day = d.getDate()
      var active = stats.dates[key] ? ' active' : ''
      var wd = d.getDay()
      var label = ''
      if (i === 0 || i === 13 || wd === 0) label = (d.getMonth() + 1) + '/' + day
      html += '<div class="hm-st-c' + active + '" title="' + key + '"><span class="hm-st-d">' + day + '</span>' + (label ? '<span class="hm-st-l">' + label + '</span>' : '') + '</div>'
    }
    html += '</div></div>'
    return html
  },

  exportAll() {
    var data = {
      exported: new Date().toISOString().split('T')[0],
      version: 1,
      data: {
        ms_dict_fav: JSON.parse(localStorage.getItem('ms_dict_fav') || '[]'),
        ms_dict_pl: JSON.parse(localStorage.getItem('ms_dict_pl') || '{}'),
        ms_dict_stats: JSON.parse(localStorage.getItem('ms_dict_stats') || '{}'),
        ms_dict_progress: JSON.parse(localStorage.getItem('ms_dict_progress') || '{}')
      }
    }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'malaysia_dictionary_backup_' + data.exported + '.json'; a.click()
    URL.revokeObjectURL(url)
  },

  importAll(file) {
    var reader = new FileReader()
    reader.onload = function(e) {
      try {
        var d = JSON.parse(e.target.result)
        if (!d || !d.data || !d.version) { alert('Invalid backup file!'); return }
        if (!confirm('This will replace ALL your current data (favorites, playlists, stats, progress). Continue?')) return
        var keys = ['ms_dict_fav', 'ms_dict_pl', 'ms_dict_stats', 'ms_dict_progress']
        for (var i = 0; i < keys.length; i++) {
          if (d.data[keys[i]]) localStorage.setItem(keys[i], JSON.stringify(d.data[keys[i]]))
        }
        alert('Data imported! Reloading...')
        window.location.reload()
      } catch(err) { alert('Failed to import: ' + err.message) }
    }
    reader.readAsText(file)
  },

  stats() {
    var key = 'ms_dict_stats'
    var stats
    try { stats = JSON.parse(localStorage.getItem(key)) } catch(e) {}
    if (!stats || !stats.quizzes) {
      var pref2; try { pref2 = JSON.parse(localStorage.getItem('ms_dict_notif')) || { enabled: false, last: '' } } catch(e) { pref2 = { enabled: false, last: '' } }
      document.getElementById('cx').innerHTML = '<div class="sp"><div class="sr-e"><div class="sr-ei">📊</div><p>No quiz data yet.<br>Complete a quiz to see your progress!</p></div>' +
        '<div class="notif-b"><div><div class="notif-l">🔔 Daily Notification</div><div class="notif-s">Get Word of the Day</div></div><button class="toggle' + (pref2.enabled ? ' on' : '') + '" id="notifToggle2"></button></div>' +
        '<button class="btn-s" style="width:100%;margin-top:10px" id="stGoalBtn2">🎯 Set Daily Goal (' + (this.goalGet().target) + ' words)</button></div>'
      document.getElementById('notifToggle2').onclick = function() {
        var key = 'ms_dict_notif'
        var p
        try { p = JSON.parse(localStorage.getItem(key)) || { enabled: false, last: '' } } catch(e) { p = { enabled: false, last: '' } }
        p.enabled = !p.enabled
        if (p.enabled && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission()
        try { localStorage.setItem(key, JSON.stringify(p)) } catch(e) {}
        App.stats()
      }
      document.getElementById('stGoalBtn2').onclick = function() { App.goalDialog() }
      return
    }
    var pct = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0
    var pref; try { pref = JSON.parse(localStorage.getItem('ms_dict_notif')) || { enabled: false, last: '' } } catch(e) { pref = { enabled: false, last: '' } }
    document.getElementById('cx').innerHTML =
      '<div class="sp"><h2 class="ph">📊 Progress</h2>' +
      '<div class="st-g"><div class="st-i"><span class="st-v">' + stats.quizzes + '</span><span class="st-l">Quizzes taken</span></div>' +
      '<div class="st-i"><span class="st-v">' + stats.totalCorrect + '/' + stats.totalQuestions + '</span><span class="st-l">Correct</span></div>' +
      '<div class="st-i"><span class="st-v">' + pct + '%</span><span class="st-l">Accuracy</span></div>' +
      '<div class="st-i"><span class="st-v">' + stats.streak + '</span><span class="st-l">Streak</span></div>' +
      '<div class="st-i"><span class="st-v">' + stats.bestStreak + '</span><span class="st-l">Best streak</span></div></div>' +
      '<div class="st-bb"><div class="st-b" style="width:' + pct + '%"></div></div>' +
      '<div class="notif-b"><div><div class="notif-l">🔔 Daily Notification</div><div class="notif-s">Get Word of the Day</div></div><button class="toggle' + (pref && pref.enabled ? ' on' : '') + '" id="notifToggle"></button></div>' +
      '<button class="btn-s" style="width:100%;margin-bottom:10px" id="stGoalBtn">🎯 Set Daily Goal (' + (App.goalGet().target) + ' words)</button>' +
      '<button id="stClr" class="btn-s" style="margin-top:0">Clear stats</button></div>'
    document.getElementById('stClr').onclick = function() {
      if (confirm('Clear all progress stats?')) { localStorage.removeItem('ms_dict_stats'); App.stats() }
    }
    document.getElementById('stGoalBtn').onclick = function() { App.goalDialog() }
    document.getElementById('notifToggle').onclick = function() {
      var key = 'ms_dict_notif'
      var p
      try { p = JSON.parse(localStorage.getItem(key)) || { enabled: false, last: '' } } catch(e) { p = { enabled: false, last: '' } }
      p.enabled = !p.enabled
      if (p.enabled) {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
      }
      try { localStorage.setItem(key, JSON.stringify(p)) } catch(e) {}
      App.stats()
    }
  },

  grammar() {
    document.getElementById('cx').innerHTML =
      '<div class="gr"><h2 class="ph">📖 Malay Grammar</h2><p class="ps">Quick reference — tap any topic to learn how it works</p>' +
      '<div class="gr-s"><div class="gr-h">🎯 Active Verb Prefix: meN-</div><p class="gr-st">The <strong>meN-</strong> prefix turns a root word into an active verb. The <strong>N</strong> changes to match the first letter of the root — this is called <strong>nasal assimilation</strong>. Follow the first sound of the root to know which form to use:</p>' +
      '<div class="gr-nt"><div class="gr-nt-i"><span class="gr-nt-l">mem-</span><div class="gr-nt-r">Before <strong>b, p, f</strong>. The <em>p</em> drops and the prefix becomes <em>mem-</em>.<br><em>baca</em> → <em>membaca</em> &nbsp;·&nbsp; <em>pukul</em> → <em>memukul</em> (p drops)</div></div><div class="gr-nt-i"><span class="gr-nt-l">men-</span><div class="gr-nt-r">Before <strong>c, d, j, sy, t, z</strong>. The <em>t</em> drops.<br><em>cari</em> → <em>mencari</em> &nbsp;·&nbsp; <em>tulis</em> → <em>menulis</em> (t drops) &nbsp;·&nbsp; <em>dengar</em> → <em>mendengar</em></div></div><div class="gr-nt-i"><span class="gr-nt-l">meng-</span><div class="gr-nt-r">Before vowels (<strong>a, e, i, o, u</strong>) and <strong>g, h, k</strong>. The <em>k</em> drops.<br><em>ambil</em> → <em>mengambil</em> &nbsp;·&nbsp; <em>kirim</em> → <em>mengirim</em> (k drops) &nbsp;·&nbsp; <em>goreng</em> → <em>menggoreng</em></div></div><div class="gr-nt-i"><span class="gr-nt-l">meny-</span><div class="gr-nt-r">Before <strong>s</strong>. The <em>s</em> drops and the prefix becomes <em>meny-</em>.<br><em>sapu</em> → <em>menyapu</em> &nbsp;·&nbsp; <em>simpan</em> → <em>menyimpan</em></div></div></div>' +
      '<div class="gr-tip">💡 <strong>Tip to spot it:</strong> If you see a word starting with <em>mem-</em>, <em>men-</em>, <em>meng-</em>, or <em>meny-</em>, it\'s likely a meN- active verb! The original root is the word without those extra letters.</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Other Prefixes</div><p class="gr-st">Malay uses several other prefixes to change a word\'s meaning or part of speech:</p>' +
      '<div class="gr-eg"><span class="gr-label">ber-</span></div><div class="gr-hl">Makes intransitive verbs or indicates having something. Think of it as "to be doing" or "to have".<br><strong>jalan</strong> (road) → <strong>berjalan</strong> (to walk) · <strong>renang</strong> (swim n.) → <strong>berenang</strong> (to swim) · <strong>isteri</strong> (wife) → <strong>beristeri</strong> (has a wife)</div>' +
      '<div class="gr-eg"><span class="gr-label">ter-</span></div><div class="gr-hl">Shows an accidental/unintentional action, or the superlative ("most").<br><strong>jatuh</strong> (fall) → <strong>terjatuh</strong> (accidentally fell) · <strong>ambil</strong> (take) → <strong>terambil</strong> (accidentally taken) · <strong>cantik</strong> (beautiful) → <strong>tercantik</strong> (most beautiful)</div>' +
      '<div class="gr-eg"><span class="gr-label">di-</span></div><div class="gr-hl">Makes passive verbs — the subject receives the action. The opposite of meN-.<br><strong>makan</strong> (eat) → <strong>dimakan</strong> (to be eaten) · <strong>tulis</strong> (write) → <strong>ditulis</strong> (to be written) · <strong>buat</strong> (make) → <strong>dibuat</strong> (to be made)</div>' +
      '<div class="gr-eg"><span class="gr-label">pe-</span></div><div class="gr-hl">Creates a noun meaning "a person who does X" (agent noun). Follows same nasal rules as meN-.<br><strong>makan</strong> → <strong>pemakan</strong> (eater) · <strong>tulis</strong> → <strong>penulis</strong> (writer) · <strong>nyanyi</strong> → <strong>penyanyi</strong> (singer)</div>' +
      '<div class="gr-eg"><span class="gr-label">per-</span></div><div class="gr-hl">Makes causative verbs — "to make something become X" or "to intensify".<br><strong>besar</strong> (big) → <strong>perbesar</strong> (enlarge) · <strong>kenal</strong> (know) → <strong>perkenal</strong> (introduce)</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Suffixes</div><p class="gr-st">Suffixes attach to the end of a root word. They usually change the verb\'s relationship to the object.</p>' +
      '<div class="gr-eg"><span class="gr-label">-kan</span></div><div class="gr-hl">Makes a verb causative or benefactive — "to do something for someone" or "to cause something to happen".<br><strong>letak</strong> (place) → <strong>letakkan</strong> (to place something somewhere) · <strong>buat</strong> (make) → <strong>buatkan</strong> (to make for someone) · <strong>buka</strong> (open) → <strong>bukakan</strong> (to open for someone)</div>' +
      '<div class="gr-eg"><span class="gr-label">-i</span></div><div class="gr-hl">Makes a verb locative or repetitive — "to do something to/at a place" or "to do repeatedly".<br><strong>datang</strong> (come) → <strong>datangi</strong> (to visit repeatedly) · <strong>isi</strong> (fill) → <strong>isikan/isikan</strong>... Actually: <strong>duduk</strong> (sit) → <strong>duduki</strong> (to sit on/at) · <strong>turun</strong> (descend) → <strong>turuni</strong> (to descend upon)</div>' +
      '<div class="gr-eg"><span class="gr-label">-an</span></div><div class="gr-hl">Nominalizer — turns a verb into a noun (the result or object of the action).<br><strong>makan</strong> (eat) → <strong>makanan</strong> (food) · <strong>minum</strong> (drink) → <strong>minuman</strong> (beverage) · <strong>main</strong> (play) → <strong>mainan</strong> (toy)</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Circumfixes (Ring Affixes)</div><p class="gr-st">These wrap around a root — both a prefix and suffix are added at the same time.</p>' +
      '<div class="gr-eg"><span class="gr-label">ke-...-an</span></div><div class="gr-hl">Creates abstract nouns (states or conditions) or shows "too much".<br><strong>gembira</strong> (happy) → <strong>kegembiraan</strong> (happiness) · <strong>besar</strong> (big) → <strong>kebesaran</strong> (greatness) · <strong>hujan</strong> (rain) → <strong>kehujanan</strong> (caught in rain — negative)</div>' +
      '<div class="gr-eg"><span class="gr-label">pe-...-an</span></div><div class="gr-hl">Creates a noun for a process, system, or place related to the action.<br><strong>makan</strong> (eat) → <strong>pemakanan</strong> (nutrition/consumption) · <strong>tanam</strong> (plant) → <strong>penanaman</strong> (planting process) · <strong>sekolah</strong> (school) → <strong>persekolahan</strong> (schooling)</div>' +
      '<div class="gr-eg"><span class="gr-label">per-...-an</span></div><div class="gr-hl">Creates nouns for a field, domain, or collection.<br><strong>dagang</strong> (trade) → <strong>perdagangan</strong> (commerce/trade sector) · <strong>kebun</strong> (garden) → <strong>perkebunan</strong> (plantation/agriculture)</div>' +
      '<div class="gr-eg"><span class="gr-label">se-...-nya</span></div><div class="gr-hl">Means "as ... as possible".<br><strong>cepat</strong> (fast) → <strong>secepatnya</strong> (as fast as possible) · <strong>baik</strong> (good) → <strong>sebaiknya</strong> (as good as possible / preferably)</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Measure Words (Penjodoh Bilangan)</div><p class="gr-st">In Malay, when counting things you must use a <strong>measure word</strong> (classifier) between the number and the noun — just like English "two <em>loaves of</em> bread" or "three <em>sheets of</em> paper".</p><table class="gr-table"><tr><td>orang</td><td>People</td><td>lima orang pelajar (5 students)</td></tr><tr><td>ekor</td><td>Animals</td><td>dua ekor kucing (2 cats)</td></tr><tr><td>buah</td><td>Large objects / buildings / abstract</td><td>sebuah rumah (1 house), sebuah negara (1 country)</td></tr><tr><td>batang</td><td>Long / cylindrical objects</td><td>sebatang pen (1 pen), sebatang sungai (1 river)</td></tr><tr><td>helai</td><td>Flat / thin things (clothes, paper, leaves)</td><td>sehelai baju (1 shirt), sehelai kertas (1 sheet of paper)</td></tr><tr><td>keping</td><td>Flat pieces / slices</td><td>sekeping roti (1 slice of bread), sekeping wang (1 banknote)</td></tr><tr><td>biji</td><td>Small round objects / fruits</td><td>sebiji telur (1 egg), sebiji epal (1 apple)</td></tr><tr><td>bidang</td><td>Land / mats / fabric</td><td>sebidang tanah (1 plot of land)</td></tr></table></div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Particles</div><p class="gr-st">Small words that add nuance, mostly used in everyday speech:</p>' +
      '<div class="gr-ex"><strong>lah</strong> — Adds emphasis, softens a command, or makes speech casual. Very common in spoken Malay.<br>"Nanti <strong>lah</strong>!" = "Later <strong>ok</strong>!" · "Dia <strong>lah</strong> yang buat" = "He is <strong>the one</strong> who did it"</div>' +
      '<div class="gr-ex"><strong>kah</strong> — Turns a sentence into a yes/no question (more formal than just using intonation).<br>"Betul<strong>kah</strong>?" = "Is it <strong>truly</strong> correct?" · "Suka<strong>kah</strong> awak?" = "Do <strong>you</strong> like it?"</div>' +
      '<div class="gr-ex"><strong>pun</strong> — Means "also", "too", or "even".<br>"Saya <strong>pun</strong> mahu" = "I want it <strong>too</strong>" · "Dia <strong>pun</strong> tidak tahu" = "<strong>Even</strong> he doesn\'t know"</div>' +
      '<div class="gr-ex"><strong>kan</strong> — Question tag like "right?" or "isn\'t it?". Very common colloquially.<br>"Bagus <strong>kan</strong>?" = "It\'s nice, <strong>right?</strong>" · "Dia datang <strong>kan</strong>?" = "He\'s coming, <strong>isn\'t he?</strong>"</div>' +
      '<div class="gr-ex"><strong>-nya</strong> — Marks possession ("his/her/its/the") or makes a word definite.<br>"Rumah<strong>nya</strong> besar" = "<strong>His</strong> house is big" · "Baju<strong>nya</strong> merah" = "<strong>The</strong> shirt is red"</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Negation — Which Word to Use?</div><p class="gr-st">There are <strong>4 different words</strong> for "no/not" in Malay. Using the right one depends on what you\'re negating:</p>' +
      '<div class="gr-ex"><strong>tidak / tak</strong> — Negates <u>verbs</u> and <u>adjectives</u>. The most common negator.<br>"Saya <strong>tidak</strong> mahu" = "I <strong>don\'t</strong> want" · "Rumah itu <strong>tak</strong> besar" = "That house is <strong>not</strong> big"</div>' +
      '<div class="gr-ex"><strong>bukan</strong> — Negates <u>nouns</u> and <u>noun phrases</u>. Use when the thing itself is wrong.<br>"<strong>Bukan</strong> saya" = "<strong>Not</strong> me" · "Ini <strong>bukan</strong> buku" = "This is <strong>not</strong> a book" · "Dia <strong>bukan</strong> guru" = "He is <strong>not</strong> a teacher"</div>' +
      '<div class="gr-ex"><strong>belum</strong> — Means "not yet". Negates completed actions.<br>"<strong>Belum</strong> makan" = "Haven\'t eaten <strong>yet</strong>" · "Dia <strong>belum</strong> sampai" = "He hasn\'t arrived <strong>yet</strong>"</div>' +
      '<div class="gr-ex"><strong>jangan</strong> — Used for <u>prohibitions</u> (don\'t!). Commands someone not to do something.<br>"<strong>Jangan</strong> pergi!" = "<strong>Don\'t</strong> go!" · "<strong>Jangan</strong> buat itu!" = "<strong>Don\'t</strong> do that!"</div>' +
      '</div>' +
      '<div class="gr-s"><div class="gr-h">🎯 Sentence Structure</div><p class="gr-st">Malay sentence structure is <strong>Subject-Predicate</strong> — just like English. The key differences are that <strong>adjectives come after nouns</strong> and <strong>possessors come after possessions</strong>.</p>' +
      '<div class="gr-ex"><strong>Basic sentence:</strong> Saya makan nasi. = I eat rice.<br><span style="color:var(--s)">Subject (Saya) + Verb (makan) + Object (nasi) — same order as English.</span></div>' +
      '<div class="gr-ex"><strong>Adjective follows noun:</strong> Rumah <em>besar</em> = A big house (literally "house <em>big</em>")<br><span style="color:var(--s)">Don\'t say "besar rumah" — the noun always comes first.</span></div>' +
      '<div class="gr-ex"><strong>Possession:</strong> Buku <em>Ali</em> = Ali\'s book (literally "book <em>Ali</em>")<br><span style="color:var(--s)">The owner comes after the thing owned — opposite of English.</span></div>' +
      '<div class="gr-ex"><strong>Plural by repetition:</strong> Buku-<em>buku</em> = books<br><span style="color:var(--s)">Repeat the word (sometimes with a hyphen) to make it plural. No "s" suffix needed.</span></div>' +
      '<div class="gr-ex"><strong>No tense changes:</strong> Saya makan nasi = I eat / ate / will eat rice<br><span style="color:var(--s)">Verbs don\'t change for past/future. Use time words instead: <em>semalam</em> (yesterday), <em>esok</em> (tomorrow).</span></div>' +
      '</div>' +
      '</div>';
    document.querySelector('.gr').onclick = function(e) {
      var h = e.target.closest('.gr-s > .gr-h');
      if (h) h.parentElement.classList.toggle('gr-open');
    };
  },

  fcStart(pool, dir, sr, src) {
    this.fcPool = pool.slice()
    this.fcIndex = 0
    this.fcDir = dir
    this.fcSr = sr
    this.fcSrc = src
    this.fcFlipped = false
    this.fcResults = []
    this.fcWrong = []
    this.fcShow()
  },

  fcShow() {
    if (this.fcIndex >= this.fcPool.length) {
      if (this.fcSr && this.fcWrong.length) {
        this.fcPool = this.fcWrong.slice()
        this.fcWrong = []
        this.fcPool.sort(function() { return Math.random() - 0.5 })
        this.fcIndex = 0
      } else { this.fcDone(); return }
    }
    var w = this.fcPool[this.fcIndex]
    var prompt = this.fcDir === 'en-ms' ? w.en : w.ms
    var answer = this.fcDir === 'en-ms' ? w.ms : w.en
    this.fcWord = w
    this.fcAnswer = answer
    this.fcFlipped = false
    document.getElementById('qs').style.display = 'none'
    var a = document.getElementById('qa')
    a.style.display = 'block'
    document.getElementById('qd2').style.display = 'none'
    var total = this.fcPool.length + this.fcWrong.length
    a.innerHTML =
      '<div class="qqp">' + this.fcIndex + '/' + total + '</div>' +
      '<div class="qqb"><div class="qqf" style="width:' + ((this.fcIndex / total) * 100) + '%"></div></div>' +
      '<div class="fc"><div class="fc-card" id="fcCard"><div class="fc-label">' + (this.fcDir === 'en-ms' ? 'ENGLISH' : 'MELAYU') + '</div><div class="fc-word">' + esc(prompt) + '</div><div class="fc-hint">Tap to flip</div></div>' +
      '<div class="fc-acts" id="fcActs" style="display:none"><button class="fc-btn easy" data-r="3">👍 Easy</button><button class="fc-btn good" data-r="2">👌 Good</button><button class="fc-btn hard" data-r="1">💪 Hard</button></div></div>'
    var self = this
    document.getElementById('fcCard').onclick = function() { self.fcFlip() }
  },

  fcFlip() {
    if (this.fcFlipped) return
    this.fcFlipped = true
    var card = document.getElementById('fcCard')
    card.classList.add('flipped')
    card.innerHTML = '<div class="fc-label">' + (this.fcDir === 'en-ms' ? 'MELAYU' : 'ENGLISH') + '</div><div class="fc-word">' + esc(this.fcAnswer) + '</div>'
    document.getElementById('fcActs').style.display = 'flex'
    var self = this
    var btns = document.querySelectorAll('.fc-btn')
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function() { self.fcRate(parseInt(this.dataset.r)) }
    }
  },

  fcRate(rating) {
    var correct = rating >= 2
    var w = this.fcWord
    this.fcResults.push({ en: w.en, ms: w.ms, correct: correct, source: this.fcSrc })
    if (!correct && this.fcSr) this.fcWrong.push(w)
    this.fcIndex++
    var self = this
    setTimeout(function() { self.fcShow() }, 300)
  },

  fcDone() {
    var r = { correct: this.fcResults.filter(function(x) { return x.correct }).length, total: this.fcResults.length, pct: this.fcResults.length > 0 ? Math.round((this.fcResults.filter(function(x) { return x.correct }).length / this.fcResults.length) * 100) : 0 }
    document.getElementById('qs').style.display = 'none'
    document.getElementById('qa').style.display = 'none'
    var d = document.getElementById('qd2')
    d.style.display = 'block'
    var em, msg
    var p = r.pct
    if (p >= 90) { em = '🏆'; msg = 'Luar biasa! Excellent!' }
    else if (p >= 70) { em = '👏'; msg = 'Bagus! Good job!' }
    else if (p >= 50) { em = '💪'; msg = "Keep practicing!" }
    else { em = '📚'; msg = 'Keep studying!' }
    d.innerHTML = '<div class="qd2"><div class="qd2e">' + em + '</div><div class="qd2m">' + msg + '</div><div class="qd2s">' + r.correct + ' / ' + r.total + '</div><div class="qd2p">' + p + '%</div><div class="qd2a"><button id="qr1" class="btn-p">Try Again</button><button id="qr2" class="btn-s">Change Settings</button></div></div>'
    document.getElementById('qr1').onclick = function() { App.fcStart(App.fcPool, App.fcDir, App.fcSr, App.fcSrc) }
    document.getElementById('qr2').onclick = function() { App.quiz() }
    this.saveStats(r)
    ProgressTracker.bulkUpdate(this.fcResults)
    this.goalInc()
  },

  goalGet() {
    try { var g = JSON.parse(localStorage.getItem('ms_dict_goal') || '{"target":10,"done":0,"date":""}'); return g } catch(e) { return { target: 10, done: 0, date: '' } }
  },

  goalSave(g) { try { localStorage.setItem('ms_dict_goal', JSON.stringify(g)) } catch(e) {} },

  goalInc() {
    var g = this.goalGet()
    var today = new Date().toISOString().split('T')[0]
    if (g.date !== today) { g.date = today; g.done = 0 }
    g.done++
    this.goalSave(g)
  },

  goalHTML() {
    var g = this.goalGet()
    var today = new Date().toISOString().split('T')[0]
    if (g.date !== today) { g.date = today; g.done = 0; this.goalSave(g) }
    var pct = g.target > 0 ? Math.min(Math.round((g.done / g.target) * 100), 100) : 0
    return '<div class="dg" id="goalBar"><div class="dg-ring" style="--pct:' + pct + '%"><div class="dg-ring-in">' + g.done + '</div></div><div class="dg-info"><div class="dg-t">Daily Goal: ' + g.done + ' / ' + g.target + '</div><div class="dg-s">Words studied today</div><div class="dg-bar"><div class="dg-fill" style="width:' + pct + '%"></div></div><button class="dg-set" id="goalSetBtn">Change goal</button></div></div>'
  },

  goalDialog() {
    var g = this.goalGet()
    var d = document.createElement('div')
    d.className = 'goal-dlg'
    d.innerHTML = '<div class="goal-dlg-b"><div class="goal-dlg-h">Set Daily Goal</div><label class="goal-dlg-l">Words per day</label><select id="goalSelect" class="qs"><option value="5"' + (g.target === 5 ? ' selected' : '') + '>5 words</option><option value="10"' + (g.target === 10 ? ' selected' : '') + '>10 words</option><option value="15"' + (g.target === 15 ? ' selected' : '') + '>15 words</option><option value="20"' + (g.target === 20 ? ' selected' : '') + '>20 words</option><option value="30"' + (g.target === 30 ? ' selected' : '') + '>30 words</option><option value="50"' + (g.target === 50 ? ' selected' : '') + '>50 words</option></select><button class="btn-p" id="goalSaveBtn">Save</button></div>'
    document.body.appendChild(d)
    d.querySelector('#goalSaveBtn').onclick = function() {
      var g = App.goalGet()
      g.target = parseInt(document.getElementById('goalSelect').value)
      App.goalSave(g)
      d.remove()
      var gb = document.getElementById('goalBar')
      if (gb) { gb.outerHTML = App.goalHTML(); var btn = document.getElementById('goalSetBtn'); if (btn) btn.onclick = function() { App.goalDialog() } }
    }
  },

  checkNotification() {
    var key = 'ms_dict_notif'
    var pref
    try { pref = JSON.parse(localStorage.getItem(key)) } catch(e) {}
    if (!pref || !pref.enabled) return
    var today = new Date().toISOString().split('T')[0]
    if (pref.last === today) return
    if ('Notification' in window && Notification.permission === 'granted') {
      var w = this.wotd()
      var lab = CATEGORIES[w.cat] ? CATEGORIES[w.cat].label : w.cat
      var n = new Notification('Malaysia Dictionary - Word of the Day', {
        body: w.en + ' → ' + w.ms + ' (' + lab + ')' + (w.ex ? ' — "' + w.ex + '"' : ''),
        icon: 'icon.svg'
      })
      n.onclick = function() { window.focus() }
      pref.last = today
      try { localStorage.setItem(key, JSON.stringify(pref)) } catch(e) {}
    }
  }

}

var QS = {
  words: [], index: 0, correct: 0, dir: 'en-ms', mode: 'type', sr: false, wrong: [], wordResults: [], source: 'all',
  start: function(w, d, m, sr_, src) { this.words = w.slice(); this.index = 0; this.correct = 0; this.dir = d; this.mode = m; this.sr = sr_; this.wrong = []; this.wordResults = []; this.source = src || 'all' },
  current: function() {
    if (this.index >= this.words.length) {
      if (this.sr && this.wrong.length) {
        this.words = this.wrong.slice()
        this.wrong = []
        this.words.sort(function() { return Math.random() - 0.5 })
        this.index = 0
      } else return null
    }
    var w = this.words[this.index]
    var prompt = this.dir === 'en-ms' ? w.en : w.ms
    var answer = this.dir === 'en-ms' ? w.ms : w.en
    if (this.mode === 'mc') {
      var opts = [answer]
      var pool = this.words.length > 4 ? this.words : (window.WORDS || [])
      var attempts = 0
      while (opts.length < 4 && attempts < 100) {
        attempts++
        var r = pool[Math.floor(Math.random() * pool.length)]
        var alt = this.dir === 'en-ms' ? r.ms : r.en
        if (opts.indexOf(alt) === -1) opts.push(alt)
      }
      opts.sort(function() { return Math.random() - 0.5 })
      return { prompt: prompt, answer: answer, options: opts }
    }
    return { prompt: prompt, answer: answer }
  },
  check: function(a) {
    var c = this.current()
    if (!c) return null
    var ok = a.trim().toLowerCase() === c.answer.trim().toLowerCase()
    if (ok) { this.correct++ }
    else if (this.sr) { this.wrong.push(this.words[this.index]) }
    var w = this.words[this.index]
    this.wordResults.push({ en: w.en, ms: w.ms, correct: ok, source: this.source })
    return { correct: ok, answer: c.answer }
  },
  next: function() { this.index++; return this.current() },
  progress: function() { return { done: this.index, total: this.words.length + this.wrong.length, correct: this.correct } },
  results: function() { return { correct: this.correct, total: this.index, pct: this.index > 0 ? Math.round((this.correct / this.index) * 100) : 0 } }
}

function esc(s) {
  if (typeof s !== 'string') return ''
  var d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

document.addEventListener('DOMContentLoaded', function() { App.init() })
