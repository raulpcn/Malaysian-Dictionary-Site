var CACHE = 'ms-dict-v6'
var URLS = ['index.html','css/style.css','js/app.js','js/data.js','js/progress.js','js/favorites.js','js/playlist.js','manifest.json','icon.svg']

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(URLS) }))
})

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(ks) {
    return Promise.all(ks.filter(function(k) { return k !== CACHE }).map(function(k) { return caches.delete(k) }))
  }))
})

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(res) {
        if (e.request.url.indexOf('http') === 0 && res.ok) {
          var cacheRes = res.clone()
          caches.open(CACHE).then(function(c) { c.put(e.request, cacheRes) })
        }
        return res
      })
    })
  )
})
