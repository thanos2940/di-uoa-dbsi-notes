/**
 * flashcards.js — renders theory flip-cards from window.flashcardData.
 *  • On chapter pages: fills every [data-fc-deck="topicN"] with that chapter's cards.
 *  • On flashcards.html: drives the "test" experience (#fc-test) across all chapters.
 */
(function () {
  const DB = window.flashcardData || {};

  /* ---------- shared card markup ---------- */
  function faceFront(card) {
    return (
      '<div class="flip-face flip-front">' +
        '<span class="fc-tag">' + card.tag + '</span>' +
        '<div class="fc-q">' + card.q + '</div>' +
        '<div class="fc-hint" style="display:none"><span class="fc-hint-lbl">💡 Υπόδειξη</span>' + card.hint + '</div>' +
        '<div class="fc-foot">' +
          '<button class="fc-hint-btn" type="button">💡 Υπόδειξη</button>' +
          '<span class="fc-cue">κλικ για απάντηση ↻</span>' +
        '</div>' +
      '</div>'
    );
  }
  function faceBack(card) {
    return (
      '<div class="flip-face flip-back">' +
        '<span class="fc-tag" style="color:var(--green);background:rgba(63,185,80,.12);border-color:rgba(63,185,80,.3)">✓ Απάντηση</span>' +
        '<div class="fc-a">' + card.a + '</div>' +
        '<span class="fc-cue">κλικ για ερώτηση ↻</span>' +
      '</div>'
    );
  }
  function buildCard(card) {
    const el = document.createElement('div');
    el.className = 'flip-card';
    el.tabIndex = 0;
    el.innerHTML = '<div class="flip-inner">' + faceFront(card) + faceBack(card) + '</div>';
    wire(el);
    return el;
  }
  function wire(el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "true";

    el.addEventListener('click', function (e) {
      const hintBtn = e.target.closest('.fc-hint-btn');
      if (hintBtn) {
        e.stopPropagation();
        const hint = el.querySelector('.fc-hint');
        if (hint) {
          const show = hint.style.display === 'none';
          hint.style.display = show ? 'block' : 'none';
          hintBtn.classList.toggle('active', show);
        }
        return;
      }
      el.classList.toggle('flipped');
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.classList.toggle('flipped'); }
    });
  }

  /* ---------- chapter decks ---------- */
  function renderDecks() {
    document.querySelectorAll('[data-fc-deck]').forEach(function (container) {
      const topic = DB[container.getAttribute('data-fc-deck')];
      if (!topic) return;
      const grid = document.createElement('div');
      grid.className = 'fc-grid';
      topic.cards.forEach(function (c) { grid.appendChild(buildCard(c)); });
      container.appendChild(grid);
    });
  }

  /* ---------- test app ---------- */
  function initTest() {
    const app = document.getElementById('fc-test');
    if (!app) return;

    const startEl = document.getElementById('fc-start');
    const stageEl = document.getElementById('fc-stage');
    const resultEl = document.getElementById('fc-results');
    const topicGrid = document.getElementById('fc-topic-grid');
    const startBtn = document.getElementById('fc-start-btn');
    const shuffleChk = document.getElementById('fc-shuffle');

    const selected = new Set();
    let deck = [], idx = 0, known = 0;

    // build topic chooser (All + each chapter)
    const order = Object.keys(DB);
    const allBtn = mkTopicBtn('all', 'Όλα τα κεφάλαια', order.reduce((n, k) => n + DB[k].cards.length, 0));
    topicGrid.appendChild(allBtn);
    order.forEach(function (k) { topicGrid.appendChild(mkTopicBtn(k, DB[k].title, DB[k].cards.length)); });

    function mkTopicBtn(id, label, count) {
      const b = document.createElement('button');
      b.className = 'fc-topic-btn';
      b.dataset.id = id;
      b.innerHTML = label + '<span class="fct-count">' + count + ' κάρτες</span>';
      b.addEventListener('click', function () {
        if (id === 'all') {
          const turningOn = !b.classList.contains('sel');
          selected.clear();
          topicGrid.querySelectorAll('.fc-topic-btn').forEach(x => x.classList.remove('sel'));
          if (turningOn) { order.forEach(k => selected.add(k)); topicGrid.querySelectorAll('.fc-topic-btn').forEach(x => x.classList.add('sel')); }
        } else {
          b.classList.toggle('sel');
          b.classList.contains('sel') ? selected.add(id) : selected.delete(id);
          allBtn.classList.toggle('sel', selected.size === order.length);
        }
        startBtn.disabled = selected.size === 0;
      });
      return b;
    }

    function buildDeck() {
      deck = [];
      order.forEach(function (k) {
        if (selected.has(k)) DB[k].cards.forEach(function (c) { deck.push(Object.assign({ topic: DB[k].title }, c)); });
      });
      if (shuffleChk && shuffleChk.checked) {
        for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      }
    }

    function show(el) { [startEl, stageEl, resultEl].forEach(x => x.style.display = 'none'); el.style.display = 'block'; }

    function renderCard() {
      const card = deck[idx];
      document.getElementById('fc-stage-card').innerHTML = '<div class="flip-inner">' + faceFront(card) + faceBack(card) + '</div>';
      const holder = document.getElementById('fc-stage-card');
      holder.className = 'flip-card fctest-stage-card';
      holder.tabIndex = 0;
      wire(holder);
      document.getElementById('fc-cur').textContent = idx + 1;
      document.getElementById('fc-tot').textContent = deck.length;
      document.getElementById('fc-chap').textContent = card.topic;
      document.getElementById('fc-fill').style.width = ((idx) / deck.length * 100) + '%';
      document.getElementById('fc-prev').disabled = idx === 0;
    }

    function advance(wasKnown) {
      if (wasKnown) known++;
      if (idx < deck.length - 1) { idx++; renderCard(); }
      else finish();
    }
    function finish() {
      show(resultEl);
      const pct = Math.round(known / deck.length * 100);
      document.getElementById('fc-score').textContent = pct + '%';
      document.getElementById('fc-score-detail').textContent = 'Ήξερες ' + known + ' από ' + deck.length + ' κάρτες.';
    }

    startBtn.addEventListener('click', function () {
      buildDeck(); idx = 0; known = 0;
      if (!deck.length) return;
      show(stageEl); renderCard();
    });
    document.getElementById('fc-flip').addEventListener('click', function () { document.getElementById('fc-stage-card').classList.toggle('flipped'); });
    document.getElementById('fc-know').addEventListener('click', function () { advance(true); });
    document.getElementById('fc-dunno').addEventListener('click', function () { advance(false); });
    document.getElementById('fc-prev').addEventListener('click', function () { if (idx > 0) { idx--; renderCard(); } });
    document.getElementById('fc-restart').addEventListener('click', function () { show(startEl); });
  }

  document.addEventListener('DOMContentLoaded', function () { renderDecks(); initTest(); });
})();
