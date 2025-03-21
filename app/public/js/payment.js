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
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      paymentError.textContent = data.message;
      paymentError.classList.add("error");
    } else {
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    paymentError.textContent = "Network error. Please try again later.";
    paymentError.classList.add("error");
  }
};
