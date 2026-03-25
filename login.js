const loginForm = document.getElementById("login-form");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

function showError(message) {
  if (!loginError) {
    return;
  }

  loginError.textContent = message;
  loginError.removeAttribute("hidden");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = loginPassword?.value || "";
  loginError?.setAttribute("hidden", "");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Login failed" }));
      throw new Error(payload.error || "Login failed");
    }

    window.location.href = "/admin.html";
  } catch (error) {
    showError(error.message || "فشل تسجيل الدخول");
  }
});
