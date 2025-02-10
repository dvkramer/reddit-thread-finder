if (typeof browser === "undefined") {
  var browser = chrome;
}

function showDialog(message) {
  const dialog = document.getElementById('dialog');
  const dialogMessage = document.getElementById('dialogMessage');
  const dialogClose = document.getElementById('dialogClose');

  dialogMessage.textContent = message;
  dialog.style.display = 'block';

  dialogClose.addEventListener('click', () => {
    dialog.style.display = 'none';
    window.close();
  });
}

function findRedditThreads(url) {
  const loadingIndicator = document.getElementById('loading');
  let timeoutId;

  loadingIndicator.style.display = 'block';

  timeoutId = setTimeout(() => {
    loadingIndicator.style.display = 'none';
    showDialog("No Reddit threads found (timeout).");
  }, 10000);

  // Extract the base URL without query parameters or fragment
  const baseUrl = new URL(url);
  baseUrl.search = ''; // Remove query parameters
  baseUrl.hash = '';   // Remove fragment

  const searchUrl = `https://www.reddit.com/search.json?q=url:${encodeURIComponent(baseUrl.toString())}&limit=100`;

  fetch(searchUrl)
    .then(response => response.json())
    .then(data => {
      clearTimeout(timeoutId);
      loadingIndicator.style.display = 'none';

      if (data && data.data && data.data.children) {
        const cleanUrl = (url) => new URL(url).origin + new URL(url).pathname;
        const targetCleanUrl = cleanUrl(baseUrl.toString()); // Use the cleaned base URL

        const matches = data.data.children.filter(child => {
          return cleanUrl(child.data.url) === targetCleanUrl;
        });

        if (matches.length > 0) {
          const firstMatch = matches[0].data;
          const redditThreadUrl = `https://www.reddit.com${firstMatch.permalink}`;
          browser.tabs.update({ url: redditThreadUrl });
          window.close();
        } else {
          showDialog("No Reddit threads found for this URL.");
        }
      } else {
        showDialog("No Reddit threads found for this URL.");
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      loadingIndicator.style.display = 'none';
      console.error("Error:", error);
      showDialog("Error searching Reddit: " + error.message);
    });
}

browser.tabs.query({ active: true, currentWindow: true }, tabs => {
  const currentUrl = tabs[0].url;
  findRedditThreads(currentUrl);
});