const button = document.getElementById("button");
const form = document.getElementById("contact-form");
const statusMessage = document.getElementById("form-status");
const videoButtons = document.querySelectorAll(".video-play-button");
const emailAddress = "djweirdnasty@gmail.com";

if (button) {
  button.addEventListener("click", () => {
    alert("Welcome to my website!");
  });
}

videoButtons.forEach(button => {
  const targetId = button.dataset.videoTarget;
  if (!targetId) return;
  const targetVideo = document.getElementById(targetId);
  if (!targetVideo) return;

  button.addEventListener("click", () => {
    targetVideo.play().catch(() => {
      // Some browsers require user interaction; this button counts as that.
    });
    button.textContent = "Playing Now";
    button.disabled = true;
    targetVideo.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

if (form && statusMessage) {
  form.addEventListener("submit", async event => {
  event.preventDefault();

  statusMessage.textContent = "Sending your message...";

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: form.method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(formData).toString()
    });

    const data = await response.json();

    if (response.ok && data.success) {
      form.reset();
      statusMessage.textContent = "Thanks! Your message was sent successfully.";
    } else {
      throw new Error(data.message || "Submission failed");
    }
  } catch (error) {
    statusMessage.textContent = error.message || `Sorry, something went wrong. Please email ${emailAddress} directly.`;
  }
});
}