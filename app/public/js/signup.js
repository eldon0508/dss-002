document.getElementById("signup_form").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("signup_form"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const usernameInput = formData.get("username");
  const passwordInput = formData.get("password");
  const repasswordInput = formData.get("repassword");
  const signupError = document.getElementById("signup_error");

  if (
    usernameInput.length <= 0 ||
    passwordInput.length <= 0 ||
    repasswordInput.length <= 0 ||
    usernameInput === null ||
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
        password: passwordInput,
        repassword: repasswordInput,
        captcha: captchaResponse,
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      signupError.textContent = data.message;
      signupError.classList.add("error");
    } else {
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    signupError.textContent = "Network error. Please try again later.";
    signupError.classList.add("error");
  }
};
