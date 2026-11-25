// quiz-loader.js — loads questions from window.quizData and renders them per section
(function () {
    console.log('Quiz loader starting...');

    // Function to render quizzes
    function renderQuizzes() {
        const db = window.quizData;
        if (!db) {
            console.error('quiz-loader: window.quizData not found. Make sure data/questions.js is loaded.');
            return;
        }

        document.querySelectorAll('.section-quiz[data-topic][data-section]').forEach(el => {
            const topicId = el.dataset.topic;
            const sectionId = el.dataset.section;
            const sectionData = db[topicId]?.[sectionId];

            if (!sectionData || !sectionData.questions || sectionData.questions.length === 0) {
                console.warn(`No questions found for topic: ${topicId}, section: ${sectionId}`);
                return;
            }

            const title = sectionData.title || sectionId;
            const questions = sectionData.questions;

            let html = `
                <div class="quiz">
                    <h3>🧠 Quick Check — ${title}</h3>
                    <div class="qitems">
            `;

            questions.forEach((qObj, index) => {
                const qId = `q-${topicId}-${sectionId}-${index}`;

                let answerText = "Λείπει η απάντηση";
                if (qObj.options) {
                    const correctOpt = qObj.options.find(o => o.correct);
                    if (correctOpt) {
                        answerText = correctOpt.text;
                    }
                } else if (qObj.a) {
                    answerText = qObj.a;
                }

                html += `
                    <div class="qitem">
                        <div class="qq">${qObj.q}</div>
                        <div class="qa" id="${qId}" style="display: none;">${answerText}</div>
                        <button class="qa-toggle" onclick="toggleAnswer('${qId}', this)">Δες απάντηση</button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            el.innerHTML = html;
        });
    }

    // Run when script loads (or when DOM is ready if preferred)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderQuizzes);
    } else {
        renderQuizzes();
    }
})();

function toggleAnswer(id, btn) {
    const el = document.getElementById(id);
    if (el.style.display === 'none') {
        el.style.display = 'block';
        btn.textContent = 'Κρύψε απάντηση';
        btn.classList.add('active');
    } else {
        el.style.display = 'none';
        btn.textContent = 'Δες απάντηση';
        btn.classList.remove('active');
    }
}
// Theory flashcard reveal (hint / answer) — keeps custom button labels intact
function fcToggle(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const hidden = el.style.display === 'none' || el.style.display === '';
    el.style.display = hidden ? 'block' : 'none';
    btn.classList.toggle('active', hidden);
}