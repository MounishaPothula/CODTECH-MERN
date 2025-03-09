(()=>{function n(){console.log("Content script checking site:",window.location.href),chrome.runtime.sendMessage({action:"checkIfBlocked",url:window.location.href},(n=>{var e;chrome.runtime.lastError?console.error("Runtime error:",chrome.runtime.lastError):(console.log("Blocking check response:",n),n&&n.blocked&&(console.log("Site should be blocked. Reason:",n.reason),e=n.reason||"This site has been blocked to help you stay focused.",document.documentElement.innerHTML="",document.documentElement.innerHTML=`\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Site Blocked - Productivity Tracker</title>\n        <style>\n          body {\n            margin: 0;\n            padding: 0;\n            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;\n            background-color: #f5f5f5;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            min-height: 100vh;\n            overflow: hidden;\n          }\n          .container {\n            background-color: white;\n            padding: 2rem;\n            border-radius: 12px;\n            box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n            text-align: center;\n            max-width: 500px;\n            width: 90%;\n            animation: fadeIn 0.5s ease-in-out;\n          }\n          @keyframes fadeIn {\n            from { opacity: 0; transform: translateY(-20px); }\n            to { opacity: 1; transform: translateY(0); }\n          }\n          h1 {\n            color: #e53935;\n            margin-bottom: 1rem;\n            font-size: 28px;\n          }\n          p {\n            color: #424242;\n            margin-bottom: 2rem;\n            line-height: 1.6;\n            font-size: 16px;\n          }\n          .reason {\n            background-color: #ffebee;\n            padding: 1rem;\n            border-radius: 8px;\n            margin-bottom: 2rem;\n            color: #c62828;\n          }\n          .button {\n            background-color: #2196f3;\n            color: white;\n            border: none;\n            padding: 12px 24px;\n            border-radius: 8px;\n            cursor: pointer;\n            font-size: 16px;\n            font-weight: 500;\n            transition: all 0.3s ease;\n            text-decoration: none;\n            display: inline-block;\n            margin: 0 10px;\n          }\n          .button:hover {\n            background-color: #1976d2;\n            transform: translateY(-2px);\n            box-shadow: 0 2px 4px rgba(0,0,0,0.2);\n          }\n          .button.secondary {\n            background-color: #757575;\n          }\n          .button.secondary:hover {\n            background-color: #616161;\n          }\n        </style>\n      </head>\n      <body>\n        <div class="container">\n          <h1>Access Blocked</h1>\n          <div class="reason">\n            ${e}\n          </div>\n          <p>Remember: Every moment spent productively brings you closer to your goals.</p>\n          <div>\n            <button class="button" onclick="window.history.back()">Go Back</button>\n            <a class="button secondary" href="chrome-extension://${chrome.runtime.id}/popup.html" target="_blank">Open Settings</a>\n          </div>\n        </div>\n      </body>\n    </html>\n  `,window.stop(),window.onbeforeunload=function(){return!1},new MutationObserver((function(n){n.forEach((function(n){n.target!==document.documentElement&&n.target.remove()}))})).observe(document.documentElement,{childList:!0,subtree:!0})))}))}document.documentElement?n():document.addEventListener("DOMContentLoaded",n)})();