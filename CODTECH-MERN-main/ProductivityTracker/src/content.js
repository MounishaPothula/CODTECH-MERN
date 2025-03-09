// Execute as early as possible
if (document.documentElement) {
  checkAndBlockSite();
} else {
  document.addEventListener('DOMContentLoaded', checkAndBlockSite);
}

function checkAndBlockSite() {
  console.log('Content script checking site:', window.location.href);
  
  chrome.runtime.sendMessage({ 
    action: 'checkIfBlocked', 
    url: window.location.href 
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      return;
    }

    console.log('Blocking check response:', response);
    if (response && response.blocked) {
      console.log('Site should be blocked. Reason:', response.reason);
      replaceContent(response.reason || 'This site has been blocked to help you stay focused.');
    }
  });
}

function replaceContent(reason) {
  // Clear any existing content
  document.documentElement.innerHTML = '';
  
  // Create new document structure
  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Site Blocked - Productivity Tracker</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
          }
          .container {
            background-color: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
            animation: fadeIn 0.5s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          h1 {
            color: #e53935;
            margin-bottom: 1rem;
            font-size: 28px;
          }
          p {
            color: #424242;
            margin-bottom: 2rem;
            line-height: 1.6;
            font-size: 16px;
          }
          .reason {
            background-color: #ffebee;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            color: #c62828;
          }
          .button {
            background-color: #2196f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 0 10px;
          }
          .button:hover {
            background-color: #1976d2;
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .button.secondary {
            background-color: #757575;
          }
          .button.secondary:hover {
            background-color: #616161;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Access Blocked</h1>
          <div class="reason">
            ${reason}
          </div>
          <p>Remember: Every moment spent productively brings you closer to your goals.</p>
          <div>
            <button class="button" onclick="window.history.back()">Go Back</button>
            <a class="button secondary" href="chrome-extension://${chrome.runtime.id}/popup.html" target="_blank">Open Settings</a>
          </div>
        </div>
      </body>
    </html>
  `;

  // Prevent any further loading or modifications
  window.stop();
  
  // Prevent navigation
  window.onbeforeunload = function() {
    return false;
  };
  
  // Block any attempts to modify the page
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target !== document.documentElement) {
        mutation.target.remove();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
} 