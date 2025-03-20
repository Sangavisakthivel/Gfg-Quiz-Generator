chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_text") {
        let mainContent = document.querySelector("article, main, .content, #content, .post");
        let text = mainContent ? mainContent.innerText : document.body.innerText;
        text = text.replace(/\s+/g, " ").trim();
        sendResponse({ text });
    }
});

