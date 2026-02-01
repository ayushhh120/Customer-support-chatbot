(function () {
    // 1. Read client id from script tag
    const scriptTag = document.currentScript;
    const clientId = scriptTag.getAttribute("data-client-id");
  
    if (!clientId) {
      console.error("Chatbot: client-id missing");
      return;
    }
  
    // 2. Create floating button
    const button = document.createElement("div");
    button.innerHTML = "💬";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.width = "56px";
    button.style.height = "56px";
    button.style.borderRadius = "50%";
    button.style.background = "#2563eb";
    button.style.color = "#fff";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.cursor = "pointer";
    button.style.zIndex = "9999";
    button.style.fontSize = "24px";
  
    // 3. Create iframe (hidden initially)
    const iframe = document.createElement("iframe");
    iframe.src = "https://chat.yourdomain.com/embed?client_id=${clientId}";
    iframe.style.position = "fixed";
    iframe.style.bottom = "90px";
    iframe.style.right = "20px";
    iframe.style.width = "360px";
    iframe.style.height = "500px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
    iframe.style.zIndex = "9999";
    iframe.style.display = "none";
  
    // 4. Toggle open / close
    button.onclick = () => {
      iframe.style.display =
        iframe.style.display === "none" ? "block" : "none";
    };
  
    // 5. Inject into page
    document.body.appendChild(button);
    document.body.appendChild(iframe);
  })();