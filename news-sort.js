(function() {
  'use strict';

  var newsListings = {
    '/news.html': true,
    '/news-national.html': true,
    '/news-entertainment.html': true,
    '/news-sports.html': true,
    '/news-music.html': true
  };

  if (!newsListings[window.location.pathname]) return;

  var months = {January:0, February:1, March:2, April:3, May:4, June:5, July:6, August:7, September:8, October:9, November:10, December:11};

  var parseCardDate = function(card) {
    var em = card.querySelector('em');
    if (!em) return 0;
    var m = (em.textContent || '').match(/Published:\s*(\w+),\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/);
    if (!m) return 0;
    var mon = months[m[2]];
    if (mon === undefined) return 0;
    return new Date(parseInt(m[4], 10), mon, parseInt(m[3], 10)).getTime();
  };

  var allCards = Array.from(document.querySelectorAll('article.event-card'));
  if (allCards.length <= 1) return;

  var parents = [];
  allCards.forEach(function(card) {
    var p = card.parentNode;
    for (var i = 0; i < parents.length; i++) {
      if (parents[i].parent === p) {
        parents[i].cards.push(card);
        return;
      }
    }
    parents.push({parent: p, cards: [card]});
  });

  parents.forEach(function(g) {
    g.cards.sort(function(a, b) {
      return parseCardDate(b) - parseCardDate(a);
    });
    g.cards.forEach(function(card) {
      g.parent.appendChild(card);
    });
  });
})();
