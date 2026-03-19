async function renderAiReview() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">AI Review</h1>
            <p class="page-subtitle">Get an honest analysis of your last 30 days</p>
        </div>
        <div id="review-area">
            <button id="review-btn" class="btn btn-primary">Get AI Review</button>
        </div>
        <div id="review-result"></div>
    `;

    const btn = document.getElementById('review-btn');
    const result = document.getElementById('review-result');

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Analyzing...';
        result.innerHTML = '';

        try {
            const data = await API.getAiReview();
            result.innerHTML = `<div class="card card-glow"><div class="review-content">${markdownToHtml(data.review)}</div></div>`;
            btn.textContent = 'Get Another Review';
            btn.disabled = false;
        } catch (e) {
            result.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
            btn.textContent = 'Get AI Review';
            btn.disabled = false;
        }
    });
}

function markdownToHtml(md) {
    return md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}
