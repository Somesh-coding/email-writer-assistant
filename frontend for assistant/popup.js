document.getElementById("generate").addEventListener("click", async () => {
  const content = document.getElementById("emailContent").value.trim();
  const tone = document.getElementById("tone").value;

  if (!content) {
    alert("Please enter the email content.");
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/api/email/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emailContent: content,
        tone: tone
      })
    });

    const result = await response.text();
    document.getElementById("result").innerText = result;
  } catch (error) {
    document.getElementById("result").innerText = "Error generating email: " + error.message;
  }
});
