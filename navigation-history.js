// Browser Back follows screen navigation. The first entry retains normal exit behavior.
(() => {
  const key='renaxNavigation';
  let restoring=false,pending=null;
  const settings=document.getElementById('index2SettingsPanel');
  const backdrop=document.getElementById('index2SettingsBackdrop');
  function capture(){return {
    tab:document.querySelector('#mobileTabs button.active')?.dataset.tab||'visu',
    settings:settings.classList.contains('open'),
    songs:window.RENAX_SONGS.navigation
  };}
  let current=capture();
  function restore(state){
    restoring=true;clearTimeout(pending);
    window.RENAX_SONGS.restoreNavigation(state.songs);
    switchTab(state.tab||'visu');
    settings.classList.toggle('open',!!state.settings);
    backdrop.classList.toggle('open',!!state.settings);
    current=capture();restoring=false;
  }
  const previous=history.state?.[key];
  if(previous?.screen)restore(previous.screen);
  history.replaceState({...history.state,[key]:{screen:current,depth:previous?.depth||0}},'');
  function record(){
    if(restoring)return;
    const next=capture();
    if(JSON.stringify(next)===JSON.stringify(current))return;
    // Editing or duplicating a song changes its identity, not the screen.
    // Keep the playlist as the preceding entry instead of adding another detail entry.
    const sameScreen=next.tab===current.tab&&next.settings===current.settings&&
      next.songs.pane===current.songs.pane&&next.songs.view===current.songs.view;
    const depth=(history.state?.[key]?.depth||0)+(sameScreen?0:1);
    history[sameScreen?'replaceState':'pushState']({...history.state,[key]:{screen:next,depth}},'');current=next;
  }
  document.addEventListener('click',event=>{
    const back=event.target.closest('.song-back,#index2SettingsClose,#index2SettingsBackdrop');
    if(back&&(history.state?.[key]?.depth||0)>0){event.preventDefault();event.stopImmediatePropagation();history.back();return;}
    clearTimeout(pending);pending=setTimeout(record,0);
  },true);
  document.addEventListener('keyup',event=>{
    if(event.key==='Enter'||event.key===' '){clearTimeout(pending);pending=setTimeout(record,0);}
  },true);
  window.addEventListener('popstate',event=>{const state=event.state?.[key];if(state?.screen)restore(state.screen);});
})();
