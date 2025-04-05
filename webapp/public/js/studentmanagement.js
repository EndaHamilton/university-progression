//Client-side validation for add student form
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector('#addStudentModal form');


    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevent form submission for validation

            // Clear previous error message
            const errorDiv = document.getElementById('addError');
            errorDiv.classList.add('d-none');
            errorDiv.textContent = '';

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

            try {
                const response = await fetch('/studentmanagement/add-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.log("API Error: ", data);
                    errorDiv.textContent = data.error || 'An error occurred.';
                    errorDiv.classList.remove('d-none');
                    return; // stay in modal
                }

                // If successful, reload or redirect
                window.location.href = '/studentmanagement';

            } catch (err) {
                console.error('Error submitting form:', err);
                errorDiv.textContent = 'A network error occurred.';
                errorDiv.classList.remove('d-none');
            }


        });
    }
});