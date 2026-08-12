(function () {
  var DISQUS_SHORTNAME = 'djweirdnasty-com';

  function injectDisqus() {
    var article = document.querySelector('article.info, main article');
    if (!article) article = document.querySelector('main');
    if (!article) return;

    var disqusContainer = document.createElement('div');
    disqusContainer.id = 'disqus_thread';
    disqusContainer.style.marginTop = '2rem';
    disqusContainer.style.paddingTop = '1.5rem';
    disqusContainer.style.borderTop = '1px solid rgba(255,255,255,0.15)';

    var heading = document.createElement('h3');
    heading.textContent = 'Comments';
    heading.style.color = '#4fa8ff';
    heading.style.marginBottom = '1rem';
    disqusContainer.appendChild(heading);

    var threadDiv = document.createElement('div');
    threadDiv.id = 'disqus_thread_inner';
    disqusContainer.appendChild(threadDiv);

    article.appendChild(disqusContainer);

    var disqus_config = function () {
      this.page.url = window.location.href;
      this.page.identifier = window.location.pathname;
    };

    (function () {
      var d = document, s = d.createElement('script');
      s.src = 'https://' + DISQUS_SHORTNAME + '.disqus.com/embed.js';
      s.setAttribute('data-timestamp', +new Date());
      (d.head || d.body).appendChild(s);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDisqus);
  } else {
    injectDisqus();
  }
})();
