const Favorites = {
  STORAGE_KEY: 'ms_dict_fav',
  getAll() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)||'[]') } catch { return [] } },
  add(w) { const f=this.getAll(); if(!f.some(x=>x.en===w.en&&x.ms===w.ms)){f.push({en:w.en,ms:w.ms,cat:w.cat});localStorage.setItem(this.STORAGE_KEY,JSON.stringify(f))} },
  remove(w) { localStorage.setItem(this.STORAGE_KEY,JSON.stringify(this.getAll().filter(x=>!(x.en===w.en&&x.ms===w.ms)))) },
  isFavorite(w) { return this.getAll().some(x=>x.en===w.en&&x.ms===w.ms) },
  toggle(w) { if(this.isFavorite(w)){this.remove(w);return false}else{this.add(w);return true} }
}
