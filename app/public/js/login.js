async function fetchCsrfToken() {
  try {
    const response = await fetch("/csrf-token");
    const data = await response.json();
    document.getElementById("csrfTokenInput").value = data.csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
  }
}
fetchCsrfToken();

document.getElementById("login_form").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("login_form"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const usernameInput = formData.get("username");
  const passwordInput = formData.get("password");
  const otpInput = formData.get("otp");
  const loginError = document.getElementById("login_error");
  const csrfToken = document.getElementById("csrfTokenInput").value;

  if (usernameInput.length <= 0 || passwordInput.length <= 0 || usernameInput === null || passwordInput === null) {
    loginError.textContent = "Please fill in the login fields.";
    loginError.classList.add("error");
    return;
  }
  if (otpInput.length <= 0 || otpInput === null) {
    loginError.textContent = "Please fill in the OTP field.";
    loginError.classList.add("error");
    return;
  }
  loginError.textContent = "";
  loginError.classList.remove("error");

  try {
    const result = await fetch("/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
        otp: otpInput,
        captcha: captchaResponse,
        _csrf: csrfToken, // Include the CSRF token
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      loginError.textContent = data.message;
      loginError.classList.add("error");
    } else {
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    loginError.textContent = "Network error. Please try again later.";
    loginError.classList.add("error");
  }
};

const otpButton = document.getElementById("otp-button");

otpButton.onclick = async function () {
  const formData = new FormData(document.getElementById("login_form"));
  const usernameInput = formData.get("username");
  const loginError = document.getElementById("login_error");

  if (usernameInput.length <= 0 || usernameInput === null) {
    loginError.textContent = "Please fill in the username field.";
    loginError.classList.add("error");
    return;
  }
  loginError.textContent = "";
  loginError.classList.remove("error");

  try {
    const result = await fetch(`/generate-otp/${usernameInput}`);
    const data = await result.json();

    if (data.success === false) {
      loginError.textContent = data.message;
      loginError.classList.add("error");
    } else {
      loginError.textContent = data.message;
      postRequestOTP();
    }
  } catch (error) {
    console.error(error);
    loginError.textContent = "Network error. Please try again later.";
    loginError.classList.add("error");
  }
};

const otpCounterElement = document.getElementById("otp-counter"); // Cache the element
let time = 5 * 60;

function postRequestOTP() {
  otpButton.disabled = true;
  setInterval(() => {
    updateCounter();
  }, 1000);
}

function updateCounter() {
  if (time <= 0) {
    otpButton.disabled = false;
    otpCounterElement.innerHTML = "";
    return;
  }

  const min = Math.floor(time / 60);
  const sec = (time % 60).toString().padStart(2, "0"); // Add leading zero using padStart

  otpCounterElement.innerHTML = `${min}:${sec}`;
  time--;
}
