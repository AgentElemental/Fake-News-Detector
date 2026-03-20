// Fake News Detector Script
const analyzeBtn = document.getElementById('analyze-btn');
const newsText = document.getElementById('news-text');
const resultSection = document.getElementById('result-section');
const historyList = document.getElementById('history-list');
const emptyMessage = document.getElementById('empty-message');
const btnText = document.getElementById("btn-text");
const loader = document.getElementById("loader");
const clearBtn = document.getElementById("clear-history-btn");

// Sample AI analysis function
async function analyzeNews(text) {
  if (!text.trim()) {
    alert('Please enter some news text');
    return;
  }

  // 🔄 START LOADING
  analyzeBtn.disabled = true;
  btnText.innerText = "Analyzing...";
  loader.style.display = "inline-block";

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    const isSuspicious = data.analysis.verdict === "false";
    const confidence = Math.round(data.analysis.confidence * 100);
    const reason = data.analysis.reason;

    displayResult(text, isSuspicious, confidence, reason, data.searchResults);
    addToHistory(text, isSuspicious);

  } catch (error) {
    console.error(error);
    alert("Error connecting to server");
  } finally {
    // ✅ STOP LOADING
    analyzeBtn.disabled = false;
    btnText.innerText = "Analyze Content";
    loader.style.display = "none";
  }
}

function displayResult(text, isSuspicious, confidence, reason, sources) {
  const status = isSuspicious ? 'Suspicious Content' : 'Credible Content';
  const cardClass = isSuspicious ? 'suspicious' : '';

  resultSection.innerHTML = `
    <div class="result-card ${cardClass}">
      <h2 class="result-title">
        ${isSuspicious ? '⚠' : '✓'} ${status}
      </h2>
      
      <div class="confidence-meter">
        <div class="confidence-label">
          <span>Confidence</span>
          <span>${confidence}%</span>
        </div>
        <div class="confidence-bar">
          <div class="confidence-fill" style="width: ${confidence}%"></div>
        </div>
      </div>

      <p class="reason-text">${reason}</p>

      <div class="divider"></div>

      <div class="sources-section">
        <h3 class="sources-title">Sources</h3>
        <ul class="sources-list">
          ${sources.map(s => `
            <li><a href="${s.link}" target="_blank">${s.title}</a></li>
          `).join("")}
        </ul>
      </div>
    </div>
  `;

  resultSection.style.display = 'block';
}

function addToHistory(text, isSuspicious) {
  // Remove empty message if present
  emptyMessage.style.display = 'none';

  // Create new history item
  const li = document.createElement('li');
  const preview = text.substring(0, 60) + (text.length > 60 ? '...' : '');
  const status = isSuspicious ? 'Suspicious' : 'Credible';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  li.innerHTML = `${preview} <span style="color: var(--text-tertiary); font-size: 0.8rem; margin-left: auto;">• ${status}</span>`;
  li.onclick = () => {
    newsText.value = text;
    newsText.focus();
  };

  historyList.insertBefore(li, historyList.firstChild);

  // Keep only last 10 items
  while (historyList.children.length > 10) {
    historyList.removeChild(historyList.lastChild);
  }
}

// Event listeners
analyzeBtn.addEventListener('click', () => analyzeNews(newsText.value));
newsText.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    analyzeNews(newsText.value);
  }
});

function clearHistory() {
  historyList.innerHTML = "";
  emptyMessage.style.display = "block";
}

clearBtn.addEventListener("click", clearHistory);
