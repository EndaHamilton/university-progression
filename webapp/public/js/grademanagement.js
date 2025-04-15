
// Validate add/edit Student Grade form
function validateGradeForm(form, errorDiv) {
    const studentId = form.querySelector('[name="student_id"]').value.trim();
    const moduleId = form.querySelector('[name="module_id"]').value.trim();
    const academicYearId = form.querySelector('[name="academic_year_id"]').value.trim();
    const entryLevelId = form.querySelector('[name="entry_level_id"]').value.trim();
    const studyStatusId = form.querySelector('[name="study_status_id"]').value.trim();

    const firstGrade = form.querySelector('[name="first_grade"]').value.trim();
    const gradeResult = form.querySelector('[name="grade_result"]').value.trim();
    const resitGrade = form.querySelector('[name="resit_grade"]').value.trim();
    const resitResult = form.querySelector('[name="resit_result"]').value.trim();

    // Helpers
    const isPositiveInteger = val => /^\d+$/.test(val);
    const allowedResults = ['pass', 'fail', 'pass capped', 'excused', 'absent'];

    //1. Presence checks
    if (!studentId) return showError("Student is required.");
    if (!moduleId) return showError("Module is required.");
    if (!academicYearId) return showError("Academic year is required.");
    if (!entryLevelId) return showError("Entry level is required.");
    if (!studyStatusId) return showError("Study status is required.");
    if (!firstGrade) return showError("First grade is required.");
    if (!gradeResult) return showError("First result is required.");


    //2. Format checks for individual fields
    if (!isPositiveInteger(studentId)) return showError('Invalid student.');
    if (!isPositiveInteger(moduleId)) return showError('Invalid module.');
    if (!isPositiveInteger(academicYearId)) return showError('Invalid academic year.');
    if (!isPositiveInteger(entryLevelId)) return showError('Invalid entry level.');
    if (!isPositiveInteger(studyStatusId)) return showError('Invalid study status.');

    const gradeVal = Number(firstGrade);
    if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
        return showError('First grade must be a number between 0 and 100.');
    }

    if (!allowedResults.includes(gradeResult.toLowerCase())) {
        return showError('Invalid first result.');
    }

    // 3. Optional resit fields
    if (resitGrade && (isNaN(resitGrade) || resitGrade < 0 || resitGrade > 100)) {
        return showError('Resit grade must be a number between 0 and 100.');
    }

    if (resitResult && resitResult !== "Select Result" && !allowedResults.includes(resitResult.toLowerCase())) {
        return showError('Invalid resit result.');
    }

    return null;

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove("d-none");
        return msg;
    }
}

// Add Student Grade Modal
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#addGradeForm");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Intercepted grade form submission");

            const errorDiv = document.getElementById("addGradeError");
            const successDiv = document.getElementById("addGradeSuccess");

            // Clear previous feedback
            errorDiv.classList.add("d-none");
            errorDiv.textContent = "";
            successDiv.classList.add("d-none");
            successDiv.textContent = "";

            const error = validateGradeForm(form, errorDiv);
            if (error) return;

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            // Remove optional resit fields if empty
            if (!payload.resit_grade || payload.resit_grade === "") delete payload.resit_grade;
            if (!payload.resit_result || payload.resit_result === "Select Result" || payload.resit_result === "") delete payload.resit_result;

            console.log("Form is valid! Payload would be:", payload);
            showSuccess("Form is valid! Data logged to console.");

            console.log("Submitting grade with payload:", payload);

            try {
                const response = await fetch("/grades", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                console.log("Response:", data);

                if (!response.ok) {
                    const status = response.status;
                    const errorMessage = data.error ||
                        (status === 400 ? "Invalid input data." :
                            status === 409 ? "This student already has a grade for that module and academic year." :
                                status === 500 ? 'Server error. Please try again later.' :
                                    'An unknown error occurred.');
                    errorDiv.textContent = errorMessage;
                    errorDiv.classList.remove("d-none");
                    return;
                }

                successDiv.textContent = data.message || "Grade added successfully!";
                successDiv.classList.remove("d-none");

                setTimeout(() => {
                    window.location.href = "/grademanagement"; // or reload for consistency
                }, 2000);

            } catch (err) {
                console.error("Error submitting grade:", err);
                errorDiv.textContent = "A network error occurred.";
                errorDiv.classList.remove("d-none");
            }
        });
    }
});
