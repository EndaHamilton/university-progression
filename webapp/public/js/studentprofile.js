document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#editStudentProfile");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const secondaryEmail = form.querySelector('[name="secondary_email"]').value.trim();

        const payload = { secondary_email: secondaryEmail === "" ? null : secondaryEmail };

        // Reset messages
        const successDiv = document.getElementById("profileSuccess");
        const errorDiv = document.getElementById("profileError");
        successDiv.classList.add("d-none");
        errorDiv.classList.add("d-none");
        successDiv.textContent = "";
        errorDiv.textContent = "";

        try {
            const res = await fetch(`/studentprofile/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                errorDiv.textContent = data.error || "Update failed.";
                errorDiv.classList.remove("d-none");
                return;
            }

            successDiv.textContent = "Profile updated successfully.";
            successDiv.classList.remove("d-none");

            setTimeout(() => {
                successDiv.classList.add("d-none");
                window.location.href = '/studentprofile';
            }, 2000);



        } catch (err) {
            console.error("Error updating profile:", err);
            errorDiv.textContent = data.error || "Network error.";
            errorDiv.classList.remove("d-none");
        }
    });
});
