
// Added by patch: hide 'Watch the episode' heading on blog when no video is present
(function(){
  function hideEmptyEpisodeBlocks(){
    var wraps = document.querySelectorAll('.media#ytWrap[data-youtube=""]');
    wraps.forEach(function(wrap){
      // hide wrap just in case CSS didn't
      wrap.style.display = 'none';
      // hide fallback vid if present
      var next = wrap.nextElementSibling;
      if (next && next.id === 'fallbackVid') next.style.display = 'none';
      // hide preceding heading if it's the "Watch the episode" h3
      var prev = wrap.previousElementSibling;
      if (prev && prev.tagName && prev.tagName.toLowerCase() === 'h3') {
        var txt = (prev.textContent||'').trim().toLowerCase();
        if (txt.includes('watch the episode')) {
          prev.style.display = 'none';
        }
      }
    });
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', hideEmptyEpisodeBlocks);
  } else {
    hideEmptyEpisodeBlocks();
  }
})();
