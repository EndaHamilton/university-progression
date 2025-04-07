console.log("Student Management JS loaded.");
// This script handles the display of the student management page, including fetching data from the API and populating the table.

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

            const studentNumber = document.querySelector('[name="student_number"]').value.trim();
            const userId = document.querySelector('[name="user_id"]').value.trim();
            const pathwayId = document.querySelector('[name="pathway_id"]').value.trim();
            const firstName = document.querySelector('[name="first_name"]').value.trim();
            const lastName = document.querySelector('[name="last_name"]').value.trim();
            const studyStatusId = document.querySelector('[name="study_status_id"]').value.trim();
            const entryLevelId = document.querySelector('[name="entry_level_id"]').value.trim();

            //query for checking positive integers
            const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

            //1. Presence check for all fields individually (so user knows which one)
            if (!studentNumber) {
                e.preventDefault();
                errorDiv.textContent = 'Student number is required.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!pathwayId) {
                e.preventDefault();
                errorDiv.textContent = 'Please select a pathway.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!firstName) {
                e.preventDefault();
                errorDiv.textContent = 'First name is required.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!lastName) {
                e.preventDefault();
                errorDiv.textContent = 'Last name is required.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!studyStatusId) {
                e.preventDefault();
                errorDiv.textContent = 'Study Status ID is required.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!entryLevelId) {
                e.preventDefault();
                errorDiv.textContent = 'Entry Level ID is required.';
                errorDiv.classList.remove('d-none');
                return;
            }

            //2. Format check for individual fields
            if (studentNumber.length < 5 || studentNumber.length > 15) {
                e.preventDefault();
                errorDiv.textContent = 'Student number must be between 5 and 15 characters.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (userId && !isPositiveInteger(userId)) {
                e.preventDefault();
                errorDiv.textContent = 'User ID must be a positive whole number.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!isNaN(firstName) || !isNaN(lastName)) {
                e.preventDefault();
                errorDiv.textContent = 'Name entries must not be numeric.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (firstName.length < 2 || lastName.length < 2) {
                e.preventDefault();
                errorDiv.textContent = 'Name entries must be more than 1 character long.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (firstName.length > 50 || lastName.length > 50) {
                e.preventDefault();
                errorDiv.textContent = 'Name entries must be less than 50 characters long.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!isPositiveInteger(studyStatusId)) {
                e.preventDefault();
                errorDiv.textContent = 'Please selecte a Study Status.';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (!isPositiveInteger(entryLevelId)) {
                e.preventDefault();
                errorDiv.textContent = 'Please select an entry level.';
                errorDiv.classList.remove('d-none');
                return;
            }

            /*if all client-side validation passes, the form will submit and hit the API endpoint (database)
            Only at this point can the check against duplicate student numbers be made, which is validated
            with the below (keeping the modal open)*/

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());




            /*Using fetch here instead of standard form submission to preserve modal state and 
            provide in-modal validation feedback */
            //Allows form to get to server side for duplicate student number check
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
    const editModalEl = document.getElementById("editStudentModal");

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