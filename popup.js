document.getElementById("generateQuiz").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "extract_text" }, async (response) => {
            if (response && response.text) {
                console.log("Extracted Text:", response.text); // Debugging step
                let quizData = await generateQuiz(response.text);
                console.log("Generated Quiz Data:", quizData); // Debugging step
                displayQuiz(quizData);
            }
        });
    });
});

async function generateQuiz(text) {
    const apiKey = "AIzaSyDmgk4XM9cw2BsnuC09NiO8D8KHBwWL_kU"; // Replace with your actual API key
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate 10 multiple-choice questions with 4 answer choices and indicate the correct answer at the end. Format as:\n\n1. Question text?\n(a) Option 1\n(b) Option 2\n(c) Option 3\n(d) Option 4\nAnswer: (c)\n\nOnly output the formatted quiz.Content:
"${text}"` }] }]
        })
    });

    const data = await response.json();
    console.log("API Response:", data); // Debugging step
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function displayQuiz(quizText) {
    let quizContainer = document.getElementById("quizContainer");
    quizContainer.innerHTML = "";

    let questions = quizText.split("\n").filter(line => line.trim() !== "");
    let currentQuestion = "";
    let options = [];
    let correctAnswer = "";
    let questionIndex = 0;

    questions.forEach((line) => {
        if (line.match(/^\d+\./)) { 
            // New Question Detected
            if (currentQuestion) {
                appendQuestion();
            }
            currentQuestion = line;
            options = [];
        } else if (line.match(/^\([a-d]\)/)) {
            // Answer Choice Detected
            options.push(line);
        } else if (line.match(/^Answer:/)) {
            // Correct Answer Detected
            correctAnswer = line.split(":")[1].trim().replace(/[()]/g, ""); 
        }
    });

    if (currentQuestion) {
        appendQuestion();
    }

    function appendQuestion() {
        let questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.dataset.correct = correctAnswer; // Store correct answer in dataset

        let optionsHtml = options.map((opt, i) => 
            `<input type="radio" name="q${questionIndex}" value="${opt[1].toUpperCase()}"> ${opt}`
        ).join("<br>");

        questionDiv.innerHTML = `<p>${currentQuestion}</p> ${optionsHtml}`;
        quizContainer.appendChild(questionDiv);
        questionIndex++;
    }

    document.getElementById("submitQuiz").style.display = "block";
}

document.getElementById("submitQuiz").addEventListener("click", () => {
    let score = 0;
    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = ""; // Clear previous results

    let questions = document.querySelectorAll(".question");

    questions.forEach((questionDiv, index) => {
        let selectedOption = questionDiv.querySelector("input:checked");
        let correctAnswer = questionDiv.dataset.correct.trim().toLowerCase(); // Ensure correct answer is in lowercase

        let feedbackDiv = questionDiv.querySelector(".feedback");
        if (!feedbackDiv) {
            feedbackDiv = document.createElement("p");
            feedbackDiv.classList.add("feedback");
            questionDiv.appendChild(feedbackDiv);
        }

        if (selectedOption) {
            let userAnswer = selectedOption.value.trim().toLowerCase(); // Convert user answer to lowercase
            if (userAnswer === correctAnswer) {
                score++;
                feedbackDiv.innerHTML = `✅ Correct!`;
                feedbackDiv.style.color = "green";
            } else {
                feedbackDiv.innerHTML = `❌ Incorrect! The correct answer is <strong>${correctAnswer.toUpperCase()}</strong>.`;
                feedbackDiv.style.color = "red";
            }
        } else {
            feedbackDiv.innerHTML = `⚠️ Not Answered! The correct answer is <strong>${correctAnswer.toUpperCase()}</strong>.`;
            feedbackDiv.style.color = "orange";
        }
    });

    let understandingLevel, bgColor;
    if (score >= 8) {
        understandingLevel = "🚀 Expert";
        bgColor = "#4CAF50"; // Green for high scores
    } else if (score >= 5) {
        understandingLevel = "📘 Intermediate";
        bgColor = "#FFC107"; // Yellow for medium scores
    } else {
        understandingLevel = "🛠️ Beginner";
        bgColor = "#F44336"; // Red for low scores
    }

    // Display result with styling
    resultDiv.innerHTML = `
        <h3 style="color: ${bgColor}; font-size: 20px;">You scored <strong>${score}</strong> out of <strong>${questions.length}</strong>.</h3>
        <div style="background-color: ${bgColor}; color: white; padding: 10px; border-radius: 5px; font-size: 18px; text-align: center;">
            <strong>${understandingLevel}</strong>
        </div>
    `;

    document.getElementById("submitQuiz").style.display = "none";});


