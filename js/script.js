// ==========================
// DARK MODE
// ==========================

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

window.onload = function () {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    createFAQ();
};

// ==========================
// CONTACT FORM VALIDATION
// ==========================

function validateForm() {

    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let message = document.getElementById("message").value.trim();

    if (name === "" || email === "" || message === "") {
        alert("Please fill all fields.");
        return false;
    }

    let emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (message.length < 10) {
        alert("Message should be at least 10 characters.");
        return false;
    }

    alert("Message submitted successfully!");

    return true;
}

// ==========================
// FAQ ACCORDION
// ==========================

function createFAQ() {

    const questions =
        document.querySelectorAll(".faq-question");

    questions.forEach(question => {

        question.addEventListener("click", () => {

            question.classList.toggle("active");

            const answer =
                question.nextElementSibling;

            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight =
                    answer.scrollHeight + "px";
            }
        });
    });
}
// Social Login Simulation

document.addEventListener("DOMContentLoaded", () => {

    const socialButtons =
        document.querySelectorAll(".social-btn");

    socialButtons.forEach(button => {

        button.addEventListener("click", () => {

            const provider =
                button.textContent.trim();

            alert("Redirecting to " + provider);
        });
    });

});

// ==========================
// SCROLL TO TOP BUTTON
// ==========================

window.addEventListener("scroll", function () {

    const btn =
        document.getElementById("topBtn");

    if (!btn) return;

    if (window.scrollY > 300) {
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
});

function topFunction() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}