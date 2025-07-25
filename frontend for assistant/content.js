console.log("Email Writer Extension Loaded");

function getEmailContent() {
  const selectors = [
    '.h7',                  // Gmail thread message
    '.a3s.aiL',             // Gmail body
    '.gmail_quote',         // Quoted content
    '[role="presentation"]' // General presentation content
  ];
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }
  return '';
}

function findComposeToolbar() {
  const selectors = ['.aDh', '.btC', '[role="toolbar"]', '.gU.Up'];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }
  return null;
}

function createAIButton() {
  const button = document.createElement('div');
  button.className = 'T-I J-J5-Ji aoO V7 T-I-atl l3 ai-reply-button';
  button.style.marginRight = '8px';
  button.textContent = "AI Reply";
  button.setAttribute('data-tooltip', 'Generate AI reply');
  return button;
}

function injectButton() {
  const existingButton = document.querySelector('.ai-reply-button');
  if (existingButton) {
    existingButton.remove(); // Avoid duplicates
  }

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Compose toolbar not found");
    return;
  }

  const button = createAIButton();
  button.addEventListener('click', async () => {
    button.textContent = "Generating...";
    button.disabled = true;

    try {
      const emailContent = getEmailContent();
      if (!emailContent) {
        alert("No email content found.");
        return;
      }

      const response = await fetch('http://localhost:8080/api/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: "professional"
        })
      });

      if (!response.ok) {
        throw new Error("API request failed: " + response.status);
      }

      const generatedReply = await response.text();
      const composeBox = document.querySelector('[role="textbox"][contenteditable="true"]');
      if (composeBox) {
        composeBox.focus();
        document.execCommand('insertText', false, generatedReply);
      } else {
        alert("Could not find Gmail compose box.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating reply. Check console.");
    } finally {
      button.textContent = "AI Reply";
      button.disabled = false;
    }
  });

  toolbar.insertBefore(button, toolbar.firstChild);
}

// Monitor DOM for Gmail Compose
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasCompose = addedNodes.some(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (
        (typeof node.matches === "function" && node.matches('div.aDh, div.btC, [role="dialog"]')) ||
        (typeof node.querySelector === "function" && node.querySelector('div.aDh, div.btC, [role="dialog"]'))
      )
    );

    if (hasCompose) {
      setTimeout(injectButton, 500); // Allow DOM to settle
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
