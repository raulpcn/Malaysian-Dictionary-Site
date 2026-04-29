const ProgressTracker = {
  STORAGE_KEY: 'ms_dict_progress',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}') } catch { return {} }
  },

  save(d) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(d)) },

  _key(w, source) {
    return (w.en.toLowerCase().trim() + '|' + w.ms.toLowerCase().trim() + '|' + (source || 'all')).toLowerCase()
  },

  bulkUpdate(results) {
    var d = this.getAll()
    for (var i = 0; i < results.length; i++) {
      var r = results[i]
      var key = this._key(r, r.source || 'all')
      if (!d[key]) d[key] = { ok: 0, tot: 0 }
      d[key].ok += r.correct ? 1 : 0
      d[key].tot += 1
      if (d[key].tot > 200) { d[key].ok = Math.ceil(d[key].ok / 2); d[key].tot = Math.ceil(d[key].tot / 2) }
    }
    this.save(d)
  },

  get(w, source) {
    var d = this.getAll()
    return d[this._key(w, source)] || null
  },

  getPct(w, source) {
    var p = this.get(w, source)
    if (!p || p.tot === 0) return -1
    return Math.round((p.ok / p.tot) * 100)
  },

  colorClass(pct) {
    if (pct < 0) return 'pr-none'
    if (pct < 20) return 'pr-bad'
    if (pct < 40) return 'pr-poor'
    if (pct < 60) return 'pr-ok'
    if (pct < 80) return 'pr-good'
    return 'pr-perfect'
  },

  bar(w, source) {
    var pct = this.getPct(w, source)
    if (pct < 0) return ''
    var cls = this.colorClass(pct)
    return '<span class="pr-bar ' + cls + '"><span class="pr-fill" style="width:' + pct + '%"></span><span class="pr-lbl">' + pct + '%</span></span>'
  },

  sortedWords(source) {
    var d = this.getAll()
    var plData = null
    if (source && source.indexOf('pl_') === 0) {
      try { plData = JSON.parse(localStorage.getItem('ms_dict_pl') || '{}') } catch(e) {}
    }
    var arr = []
    for (var key in d) {
      if (!source) {
        var parts = key.split('|')
        var en = parts[0]; var ms = parts[1]
        var pct = Math.round((d[key].ok / d[key].tot) * 100)
        var found = false
        for (var i = 0; i < WORDS.length; i++) {
          if (WORDS[i].en.toLowerCase() === en && WORDS[i].ms.toLowerCase() === ms) {
            arr.push({ word: WORDS[i], pct: pct, ok: d[key].ok, tot: d[key].tot }); found = true; break
          }
        }
        if (!found) arr.push({ word: { en: en, ms: ms }, pct: pct, ok: d[key].ok, tot: d[key].tot })
        continue
      }
      var parts = key.split('|')
      if (parts.length < 3) continue
      var en = parts[0]; var ms = parts[1]
      var entrySource = parts.slice(2).join('|')
      if (entrySource !== source) continue
      if (plData && !plData[source]) continue
      if (plData) {
        var pl = plData[source]
        if (!pl || !pl.words.some(function(x) { return x.en.toLowerCase() === en && x.ms.toLowerCase() === ms })) continue
      }
      var pct = Math.round((d[key].ok / d[key].tot) * 100)
      var found = false
      for (var i = 0; i < WORDS.length; i++) {
        if (WORDS[i].en.toLowerCase() === en && WORDS[i].ms.toLowerCase() === ms) {
          arr.push({ word: WORDS[i], pct: pct, ok: d[key].ok, tot: d[key].tot }); found = true; break
        }
      }
      if (!found) arr.push({ word: { en: en, ms: ms }, pct: pct, ok: d[key].ok, tot: d[key].tot })
    }
    arr.sort(function(a, b) { return a.pct - b.pct })
    return arr
  },

  resetWord(w, source) {
    var d = this.getAll()
    var key = this._key(w, source)
    if (d[key]) { delete d[key]; this.save(d) }
  },

  resetAll(source) {
    var d = this.getAll()
    if (source) {
      var prefix = '|' + source.toLowerCase().trim()
      for (var key in d) {
        if (key.indexOf(prefix, key.length - prefix.length) !== -1) delete d[key]
      }
    } else {
      for (var key in d) delete d[key]
    }
    this.save(d)
  },

  progressHTML(source, showReset) {
    var arr = this.sortedWords(source)
    if (!arr.length) return ''

    var groups = { perfect: [], good: [], ok: [], poor: [], bad: [] }
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i]
      if (p.pct >= 80) groups.perfect.push(p)
      else if (p.pct >= 60) groups.good.push(p)
      else if (p.pct >= 40) groups.ok.push(p)
      else if (p.pct >= 20) groups.poor.push(p)
      else groups.bad.push(p)
    }

    var labels = {
      perfect: { icon: '✅', title: 'Mastered', cls: 'pr-g-perfect' },
      good: { icon: '👍', title: 'Good', cls: 'pr-g-good' },
      ok: { icon: '📝', title: 'Needs work', cls: 'pr-g-ok' },
      poor: { icon: '🔴', title: 'Struggling', cls: 'pr-g-poor' },
      bad: { icon: '⛔', title: 'Bad', cls: 'pr-g-bad' }
    }

    var order = ['perfect', 'good', 'ok', 'poor', 'bad']
    var html = '<div class="pr-panel"><div class="pr-panel-h">📊 Word Progress</div>'
    for (var g = 0; g < order.length; g++) {
      var k = order[g]
      var items = groups[k]
      if (!items.length) continue
      var l = labels[k]
      html += '<div class="pr-g ' + l.cls + '"><div class="pr-gh">' + l.icon + ' ' + l.title + ' (' + items.length + ')</div>'
      for (var j = items.length - 1; j >= 0; j--) {
        var item = items[j]
        html += '<div class="pr-gw"><span class="pr-ge">' + esc(item.word.en) + '</span><span class="pr-gar">→</span><span class="pr-gm">' + esc(item.word.ms) + '</span>' + this.bar(item.word, source) + (showReset ? '<button class="pr-rw" data-en="' + esc(item.word.en) + '" data-ms="' + esc(item.word.ms) + '" data-src="' + esc(source || '') + '">✕</button>' : '') + '</div>'
      }
      html += '</div>'
    }
    if (showReset) html += '<button class="pr-ra" data-src="' + esc(source || '') + '">Reset All Progress</button>'
    html += '</div>'
    return html
  }
}
