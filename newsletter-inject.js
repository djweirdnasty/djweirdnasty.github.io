(function () {
  if (document.getElementById('newsletter')) return;

  const container = document.querySelector('main') || document.body;
  if (!container) return;

  const section = document.createElement('section');
  section.id = 'newsletter';
  section.className = 'info newsletter-section';
  section.innerHTML =
    '<h2>Newsletter</h2>' +
    '<p>Sign up for exclusive updates, new mixtapes, events, and content drops.</p>' +
    '<form action="https://formspree.io/f/mvkpzwzj" method="POST" id="newsletter-form" target="_blank">' +
    '<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">' +
    '<label for="newsletter-name">Name</label>' +
    '<input id="newsletter-name" name="NAME" type="text" placeholder="Your name" required>' +
    '<label for="newsletter-email">Email</label>' +
    '<input id="newsletter-email" name="EMAIL" type="email" placeholder="you@example.com" required>' +
    '<button type="submit" class="submit-btn">Subscribe</button>' +
    '</form>' +
    '<p id="newsletter-status" class="form-status" aria-live="polite"></p>';

  const footer = container.querySelector('footer');
  if (footer && footer.parentNode === container) {
    container.insertBefore(section, footer);
  } else {
    container.appendChild(section);
  }
})();
