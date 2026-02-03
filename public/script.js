let mathAnswer = 0;

// Generate math problem
function generateMathProblem() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];
  
  let answer;
  let display;
  
  switch(op) {
    case '+':
      answer = num1 + num2;
      display = `${num1} + ${num2} = `;
      break;
    case '-':
      // Make sure result is positive
      const bigger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      answer = bigger - smaller;
      display = `${bigger} - ${smaller} = `;
      break;
    case '×':
      answer = num1 * num2;
      display = `${num1} × ${num2} = `;
      break;
  }
  
  mathAnswer = answer;
  document.getElementById('math-problem').textContent = display;
  document.getElementById('captcha-answer').value = '';
}

// Handle form submission
document.getElementById('faucet-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const walletInput = document.getElementById('wallet');
  const captchaInput = document.getElementById('captcha-answer');
  const honeypot = document.getElementById('honeypot');
  const button = document.getElementById('claim-btn');
  
  const walletAddress = walletInput.value.trim();
  const userAnswer = parseInt(captchaInput.value);
  
  // Check honeypot (bots fill this)
  if (honeypot.value) {
    showMessage('Nice try, bot! 🤖', 'error');
    return;
  }
  
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
  
  // Check math answer
  if (userAnswer !== mathAnswer) {
    showMessage('Wrong answer! Try again.', 'error');
    generateMathProblem();
    return;
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
        mathAnswer: userAnswer,
        mathExpected: mathAnswer
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
    generateMathProblem();
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
generateMathProblem();
