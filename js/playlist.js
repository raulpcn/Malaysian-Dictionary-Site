const PlaylistManager = {
  STORAGE_KEY: 'ms_dict_pl',
  getAll() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)||'{}') } catch { return {} } },
  save(d) { localStorage.setItem(this.STORAGE_KEY,JSON.stringify(d)) },
  create(n) { const id='pl_'+Date.now(); const a=this.getAll(); a[id]={name:n.trim(),words:[]}; this.save(a); return id },
  delete(id) { const a=this.getAll(); delete a[id]; this.save(a) },
  addWord(plId,w) { const a=this.getAll(); const p=a[plId]; if(!p)return; if(!p.words.some(x=>x.en===w.en&&x.ms===w.ms)){p.words.push({en:w.en,ms:w.ms,cat:w.cat});this.save(a)} },
  removeWord(plId,en,ms) { const a=this.getAll(); const p=a[plId]; if(!p)return; p.words=p.words.filter(x=>!(x.en===en&&x.ms===ms)); this.save(a) },
  getWords(plId) { const a=this.getAll(); return a[plId]?a[plId].words:[] },
  isInPlaylist(plId,w) { return this.getWords(plId).some(x=>x.en===w.en&&x.ms===w.ms) },
  list() { return Object.entries(this.getAll()).map(([id,p])=>({id,name:p.name,count:p.words.length})) },
  getWordPlaylists(w) { return Object.entries(this.getAll()).filter(([id,p])=>p.words.some(x=>x.en===w.en&&x.ms===w.ms)).map(([id,p])=>({id,name:p.name})) }
}
