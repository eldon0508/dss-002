async function checkLogin() {
  const loginError = document.getElementById("login_error");

  const usernameInput = document.getElementById("username").value;
  const passwordInput = document.getElementById("password").value;

  if (usernameInput.length <= 0 || passwordInput.length <= 0 || usernameInput === null || passwordInput === null) {
    loginError.textContent = "Please fill out the login fields.";
    loginError.classList.add("error");
  }

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
}

document.getElementById("login_form").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("login_form"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const usernameInput = formData.get("username");
  const passwordInput = formData.get("password");
  const loginError = document.getElementById("login_error");

  if (usernameInput.length <= 0 || passwordInput.length <= 0 || usernameInput === null || passwordInput === null) {
    loginError.textContent = "Please fill out the login fields.";
    loginError.classList.add("error");
  } else {
    loginError.textContent = "";
    loginError.classList.remove("error");
  }

  // if (!captchaResponse) {
  //   loginError.textContent = "Please verify the reCAPTCHA.";
  //   loginError.classList.add("error");
  // } else {
  //   loginError.textContent = "";
  //   loginError.classList.remove("error");
  // }

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
        captcha: captchaResponse,
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
