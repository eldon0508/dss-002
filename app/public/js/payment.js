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

async function loadMyPayment() {
  const result = await fetch("/loadMyPayment");
  const data = await result.json();

  document.querySelector("#login_link").textContent = data.user.username;

  const payment = data.payment;
  if (payment) {
    document.getElementById("cnn").value = payment.cnn;
    document.getElementById("eDate").value = payment.edate;
  } else {
    console.log("Payment data not found.");
    document.getElementById("cnn").value = "";
    document.getElementById("eDate").value = "";
  }
}
loadMyPayment();

document.getElementById("paymentForm").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("paymentForm"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const cnn = formData.get("cnn");
  const eDate = formData.get("eDate");
  const csrfToken = document.getElementById("csrfTokenInput").value;

  const paymentError = document.getElementById("payment_error");

  try {
    const result = await fetch("/payment-update", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cnn,
        eDate,
        captcha: captchaResponse,
        _csrf: csrfToken, // Include the CSRF token
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      paymentError.textContent = data.message;
      paymentError.classList.add("error");
    } else {
      alert("Card details have been updated successfully!");
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    paymentError.textContent = "Network error. Please try again later.";
    paymentError.classList.add("error");
  }
};
