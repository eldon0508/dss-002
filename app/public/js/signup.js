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

document.getElementById("signup_form").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("signup_form"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const usernameInput = formData.get("username");
  const emailInput = formData.get("email");
  const passwordInput = formData.get("password");
  const repasswordInput = formData.get("repassword");
  const signupError = document.getElementById("signup_error");
  const csrfToken = document.getElementById("csrfTokenInput").value;

  if (
    usernameInput.length <= 0 ||
    emailInput.length <= 0 ||
    passwordInput.length <= 0 ||
    repasswordInput.length <= 0 ||
    usernameInput === null ||
    emailInput.length === null ||
    passwordInput === null ||
    repasswordInput.length === null
  ) {
    signupError.textContent = "Please fill out the all fields.";
    signupError.classList.add("error");
  } else {
    signupError.textContent = "";
    signupError.classList.remove("error");
  }

  try {
    const result = await fetch("/signup", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput,
        email: emailInput,
        password: passwordInput,
        repassword: repasswordInput,
        captcha: captchaResponse,
        _csrf: csrfToken, // Include the CSRF token
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      signupError.textContent = data.message;
      signupError.classList.add("error");
    } else {
      alert("Sign up successfully, please login.");
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    signupError.textContent = "Network error. Please try again later.";
    signupError.classList.add("error");
  }
};
