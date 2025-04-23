console.log("Student Management JS loaded.");
// This script handles the display of the student management page, including fetching data from the API and populating the table.

function validateStudentForm(form, errorDiv) {

    // const studentNumber = form.querySelector('[name="student_number"]').value.trim();
    const userId = form.querySelector('[name="user_id"]').value.trim();
    const pathwayId = form.querySelector('[name="pathway_id"]').value.trim();
    const firstName = form.querySelector('[name="first_name"]').value.trim();
    const lastName = form.querySelector('[name="last_name"]').value.trim();
    const studyStatusId = form.querySelector('[name="study_status_id"]').value.trim();
    const entryLevelId = form.querySelector('[name="entry_level_id"]').value.trim();
    const enrollmentYear = form.querySelector('[name="enrollment_year"]').value.trim();

    //query for checking positive integers
    const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

    // 1. Presence check for all fields
    // if (!studentNumber) return showError('Student number is required.');
    if (!pathwayId) return showError('Please select a pathway.');
    if (!firstName) return showError('First name is required.');
    if (!lastName) return showError('Last name is required.');
    if (!studyStatusId) return showError('Study Status ID is required.');
    if (!entryLevelId) return showError('Entry Level ID is required.');
    if (!enrollmentYear) return showError('Enrollment Year is required.');

    // 2. Format check for individual fields
    // if (studentNumber.length < 5 || studentNumber.length > 15)
    //     return showError('Student number must be between 5 and 15 characters.');
    if (userId && !isPositiveInteger(userId))
        return showError('User ID must be a positive whole number.');
    if (!isNaN(firstName) || !isNaN(lastName))
        return showError('Name entries must not be numeric.');
    if (firstName.length < 2 || lastName.length < 2)
        return showError('Name entries must be more than 1 character long.');
    if (firstName.length > 50 || lastName.length > 50)
        return showError('Name entries must be less than 50 characters long.');
    if (!isPositiveInteger(studyStatusId))
        return showError('Please select a valid Study Status.');
    if (!isPositiveInteger(entryLevelId))
        return showError('Please select a valid Entry Level.');
    if (!isPositiveInteger(enrollmentYear))
        return showError('Enrollment Year must be a positive whole number');
    if (parseInt(enrollmentYear) < 2000 || parseInt(enrollmentYear) > 2099)
        return showError('Enrollment Year must be a valid year (between 2000 and 2099).');

    return null; // No errors found

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('d-none');
        return msg;
    }

}


//Client-side add student form with client-side validation
// This script handles the form submission for adding a student, including client-side validation and error handling.
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('#addStudentModal form');


    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevent form submission for validation

            // Clear previous error message and success box each time
            const errorDiv = document.getElementById('addError');
            errorDiv.classList.add('d-none');
            errorDiv.textContent = '';
            const successDiv = document.getElementById('addSuccess');
            successDiv.classList.add('d-none');
            successDiv.textContent = '';

            const error = validateStudentForm(form, errorDiv);
            if (error) return; // If validation fails, show error and return

            /*if all client-side validation passes, the form will submit and hit the API endpoint (database)
            Only at this point can the check against duplicate student numbers be made, which is validated
            with the below (keeping the modal open)*/

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());


            /*Using fetch here instead of standard form submission to preserve modal state and 
            provide in-modal validation feedback */
            // Allows form to get to server side for duplicate student number check
            try {
                const response = await fetch('/studentmanagement/add-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {

                    const status = response.status;
                    const errorMessage = data.error ||
                        (status === 400 ? 'Invalid input data.' :
                            status === 409 ? 'Student number already exists.' :
                                status === 500 ? 'Server error. Please try again later.' :
                                    'An unknown error occurred.'
                        );

                    console.error("API Error: ", errorMessage);

                    errorDiv.textContent = data.error || 'An error occurred.';
                    errorDiv.classList.remove('d-none');
                    return; // stay in modal
                }
                // If successful, redirect to the student management page with a success message

                successDiv.textContent = data.message || 'Student added successfully!';
                successDiv.classList.remove('d-none');

                //delay redirect to allow user to see success message
                setTimeout(() => {
                    window.location.href = '/studentmanagement'; // Redirect to student management page
                }, 2000); // 2 seconds delay before redirecting




            } catch (err) {
                console.error('Error submitting form:', err);
                errorDiv.textContent = 'A network error occurred.';
                errorDiv.classList.remove('d-none');
            }


        });
    }
});

// Client-side edit student form with client-side validation
// This script handles the form submission for editing a student, including client-side validation and error handling.
document.addEventListener("DOMContentLoaded", function () {
    const editForm = document.querySelector("#editStudentForm");

    // 1. Attach click handlers to all "Edit" buttons
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const studentId = this.getAttribute("data-id");

            try {
                const response = await fetch(`/studentmanagement/student/${studentId}`);
                const student = await response.json();

                // Fill form with student data
                editForm.setAttribute("data-id", student.id);
                editForm.querySelector('[name="student_number"]').value = student.student_number;
                editForm.querySelector('[name="user_id"]').value = student.user_id || '';
                editForm.querySelector('[name="pathway_id"]').value = student.pathway_id;
                editForm.querySelector('[name="first_name"]').value = student.first_name;
                editForm.querySelector('[name="last_name"]').value = student.last_name;
                editForm.querySelector('[name="study_status_id"]').value = student.study_status_id;
                editForm.querySelector('[name="entry_level_id"]').value = student.entry_level_id;

                // Show modal
                $('#editStudentModal').modal('show');

            } catch (err) {
                console.error("Failed to fetch student for editing", err);
            }
        });
    });

    // 2. Submit handler for Edit Form
    editForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const studentId = editForm.getAttribute("data-id");
        const formData = new FormData(editForm);
        const payload = Object.fromEntries(formData.entries());

        // Clear previous feedback
        const errorDiv = document.getElementById("editError");
        const successDiv = document.getElementById("editSuccess");
        errorDiv.classList.add("d-none");
        errorDiv.textContent = "";
        successDiv.classList.add("d-none");
        successDiv.textContent = "";

        const error = validateStudentForm(editForm, errorDiv);
        if (error) return; // If validation fails, show error and return

        try {
            const response = await fetch(`/studentmanagement/edit-student/${studentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                const status = response.status;
                const errorMessage = data.error ||
                    (status === 400 ? "Invalid input." :
                        status === 404 ? "Student not found." :
                            status === 409 ? "Duplicate student number." :
                                "An unexpected error occurred."
                    );
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove("d-none");

                return;
            }

            successDiv.textContent = data.message || "Student updated successfully!";
            successDiv.classList.remove("d-none");

            setTimeout(() => {
                window.location.href = "/studentmanagement";
            }, 2000);

        } catch (err) {
            console.error("Error submitting update:", err);
            errorDiv.textContent = "A network error occurred.";
            errorDiv.classList.remove("d-none");
        }
    });
});

// Client-side delete student functionality
document.querySelectorAll(".delete-btn").forEach(button => {

    button.addEventListener("click", async function () {
        const studentId = this.getAttribute("data-id");

        if (!confirm("Are you sure you want to delete this student?")) {
            return; // User cancelled
        }

        try {
            const response = await fetch(`/studentmanagement/delete-student/${studentId}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "An error occurred while deleting the student.");
                return;
            }

            alert(data.message || "Student deleted successfully!");
            window.location.href = "/studentmanagement"; // Redirect to student management page
        } catch (err) {
            console.error("Error deleting student:", err);
            alert("A network error occurred while deleting the student.");
        }
    });
});

// Functionality for assign / enroll modules form
document.querySelectorAll(".assign-modules-btn").forEach(button => {
    button.addEventListener("click", async function () {
        const studentId = this.getAttribute("data-id");
        const res = await fetch(`/studentmanagement/student/${studentId}/available-modules`);
        const data = await res.json();

        // Student details - update this to include student number and name
        document.getElementById("studentModuleDetails").innerHTML = `
          <strong>Student ID:</strong> ${data.studentId}<br>
          <strong>Pathway ID:</strong> ${data.pathway_id}<br>
          <strong>Level:</strong> ${data.entry_level_id}
        `;

        // Mandatory Core modules
        const mandatoryCoreContainer = document.getElementById("mandatoryCoreModules");
        mandatoryCoreContainer.innerHTML = '';
        data.coreModules.forEach(module => {
            mandatoryCoreContainer.innerHTML += `
            <div class="form-check mr-3">
              <input class="form-check-input module-checkbox" type="checkbox"
                     data-credits="${module.credits}" value="${module.id}" id="core-${module.id}">
              <label class="form-check-label" for="core-${module.id}">
                ${module.module_code} - ${module.title} (${module.credits} CATS, ${module.semester_name})
              </label>
            </div>
          `;
        });


        // Optional Core (EITHER OR) modules
        const optionalCoreContainer = document.getElementById("optionalCoreModules");
        optionalCoreContainer.innerHTML = '';
        Object.values(data.optionalCoreGroups).forEach(group => {
            group.forEach(module => {
                optionalCoreContainer.innerHTML += `
              <div class="form-check mr-3">
                <input class="form-check-input module-checkbox" type="checkbox"
                       data-credits="${module.credits}" value="${module.id}" id="optcore-${module.id}">
                <label class="form-check-label" for="optcore-${module.id}">
                  ${module.module_code} - ${module.title} (${module.credits} CATS, ${module.semester_name})
                </label>
              </div>
            `;
            });
        });

        const nonCoreContainer = document.querySelector("#availableModules .d-flex");
        nonCoreContainer.innerHTML = '';
        data.availableModules.forEach(module => {
            nonCoreContainer.innerHTML += `<div class="form-check mr-3">
                <input class="form-check-input module-checkbox" type="checkbox"
                  data-credits="${module.credits}" data-semester="${module.semester_name}"
                  value="${module.id}" id="mod-${module.id}">
                <label class="form-check-label" for="mod-${module.id}">
                  ${module.module_code} - ${module.title} (${module.credits} CATS, ${module.semester_name})
                </label>
            </div>`;
        });

        updateCatsCounter();

        // Show modal
        $('#assignModulesModal').modal('show');
    });
});

document.addEventListener('change', function (e) {
    if (e.target.classList.contains('module-checkbox')) {
        updateCatsCounter();
    }
});

function updateCatsCounter() {
    const checkboxes = document.querySelectorAll(".module-checkbox:checked");
    let total = 0;
    checkboxes.forEach(cb => total += parseInt(cb.getAttribute("data-credits")));
    document.getElementById("catsCounter").textContent = total;
    document.getElementById("submitEnrollmentBtn").disabled = total < 120;
}


