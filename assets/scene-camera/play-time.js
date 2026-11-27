// A page's monotonic clock never represents time spent between visits.
let playRanch81 = null, playMark81 = null, pageAway81 = false;
function normalizePlayTime81(ranch) {
  if (!Number.isSafeInteger(ranch.playMillis81) || ranch.playMillis81<0) ranch.playMillis81=0;
}

function accountPlayTime81(now=performance.now()) {
  if (!state) return;
  if (playRanch81!==state) { playRanch81=state; playMark81=null; }
  if (!claimedSave12556 || lostSaveOwner12556) { playMark81=null; return; }
  const mark=Math.floor(now);
  if (playMark81!==null) {
    state.playMillis81=Math.min(Number.MAX_SAFE_INTEGER,state.playMillis81+Math.max(0,mark-playMark81));
  }
  playMark81=pageAway81||document.hidden?null:mark;
}

function renderPlayTime81() {
  accountPlayTime81();
  const seconds=Math.floor(state.playMillis81/1000);
  const clock=Math.floor(seconds/3600)+'時間 '+String(Math.floor(seconds/60)%60).padStart(2,'0')+'分 '+
    String(seconds%60).padStart(2,'0')+'秒';
  const value=$('ranchPlayTime81');
  if (value.textContent!==clock) value.textContent=clock;
}

window.addEventListener('pageshow',()=>{
  pageAway81=false;
  accountPlayTime81();
});
