let hcaptchaReady = false;
let hcaptchaSiteKey = null;

// Load config from server
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    
    // Set reward amount
    document.getElementById('reward-amount').textContent = config.pumpAmount;
    
    // Handle captcha
    hcaptchaSiteKey = config.hcaptchaSiteKey;
    const captchaSection = document.getElementById('captcha-section');
    const captchaContainer = document.getElementById('captcha-container');
    
    if (hcaptchaSiteKey && hcaptchaSiteKey !== 'your_hcaptcha_site_key_here' && hcaptchaSiteKey !== '') {
      // Load hCaptcha script dynamically
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.onload = () => {
        captchaContainer.innerHTML = `<div class="h-captcha" data-sitekey="${hcaptchaSiteKey}"></div>`;
        hcaptchaReady = true;
      };
      document.head.appendChild(script);
    } else {
      // Show demo mode message
      captchaContainer.innerHTML = `
        <div class="captcha-placeholder">
          <p>⚙️ <strong>Demo Mode</strong></p>
          <p style="font-size: 14px; color: #666;">Captcha disabled - configure hCaptcha keys in .env</p>
        </div>
      `;
    }
    
    if (!config.configured) {
      console.log('⚠️ Faucet not fully configured - running in demo mode');
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

// Handle form submission
document.getElementById('faucet-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const walletInput = document.getElementById('wallet');
  const button = document.getElementById('claim-btn');
  const message = document.getElementById('message');
  
  const walletAddress = walletInput.value.trim();
  
  // Basic validation
  if (!walletAddress) {
    showMessage('Please enter your wallet address', 'error');
    return;
  }
  
  // Solana address validation (base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    showMessage('Invalid Solana wallet address', 'error');
    return;
  }
  
  // Get captcha response if captcha is enabled
  let captchaResponse = '';
  if (hcaptchaReady && typeof hcaptcha !== 'undefined') {
    captchaResponse = hcaptcha.getResponse();
    if (!captchaResponse) {
      showMessage('Please complete the captcha', 'error');
      return;
    }
  }
  
  // Disable button and show loading
  button.disabled = true;
  button.classList.add('loading');
  hideMessage();
  
  try {
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        captchaToken: captchaResponse
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      const explorerLink = data.explorer 
        ? `<a href="${data.explorer}" target="_blank">View on Solscan →</a>`
        : '';
      showMessage(`🎉 Success! Tokens sent to your wallet! ${explorerLink}`, 'success');
      walletInput.value = '';
    } else {
      showMessage(data.error || 'Something went wrong', 'error');
    }
  } catch (err) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    
    // Reset captcha
    if (hcaptchaReady && typeof hcaptcha !== 'undefined') {
      hcaptcha.reset();
    }
  }
});

function showMessage(text, type) {
  const message = document.getElementById('message');
  message.innerHTML = text;
  message.className = `message show ${type}`;
}

function hideMessage() {
  const message = document.getElementById('message');
  message.className = 'message';
}

// Init
loadConfig();
