console.log("Student Management JS loaded.");
// This script handles the display of the student management page, including fetching data from the API and populating the table.

function validateStudentForm(form, errorDiv) {

    const pathwayId = form.querySelector('[name="pathway_id"]').value.trim();
    const firstName = form.querySelector('[name="first_name"]').value.trim();
    const lastName = form.querySelector('[name="last_name"]').value.trim();
    const studyStatusId = form.querySelector('[name="study_status_id"]').value.trim();
    const entryLevelId = form.querySelector('[name="entry_level_id"]').value.trim();
    const currentLevelId = form.querySelector('[name="current_level_id"]').value.trim();
    const enrollmentYear = form.querySelector('[name="enrollment_year"]').value.trim();

    //query for checking positive integers
    const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

    // Presence check for all fields
    if (!pathwayId) return showError('Please select a pathway.');
    if (!firstName) return showError('First name is required.');
    if (!lastName) return showError('Last name is required.');
    if (!studyStatusId) return showError('Study Status ID is required.');
    if (!entryLevelId) return showError('Entry Level ID is required.');
    if (!currentLevelId) return showError('Current Level ID is required.');
    if (!enrollmentYear) return showError('Enrollment Year is required.');

    // Format check for individual fields
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
    if (!isPositiveInteger(currentLevelId))
        return showError('Please select a valid Current Level.');
    if (!isPositiveInteger(enrollmentYear))
        return showError('Enrollment Year must be a positive whole number');
    if (parseInt(enrollmentYear) < 2000 || parseInt(enrollmentYear) > 2099)
        return showError('Enrollment Year must be a valid year (between 2000 and 2099).');

    return null;

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('d-none');
        return msg;
    }

}


//Client-side add student form with client-side validation
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
                    return; 
                }

                successDiv.textContent = data.message || 'Student added successfully!';
                successDiv.classList.remove('d-none');

                
                setTimeout(() => {
                    window.location.href = '/studentmanagement'; 
                }, 2000); 




            } catch (err) {
                console.error('Error submitting form:', err);
                errorDiv.textContent = 'A network error occurred.';
                errorDiv.classList.remove('d-none');
            }


        });
    }
});

// Client-side edit student form with client-side validation
document.addEventListener("DOMContentLoaded", function () {
    const editForm = document.querySelector("#editStudentForm");

    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const studentId = this.getAttribute("data-id");

            try {
                const response = await fetch(`/studentmanagement/student/${studentId}`);
                const student = await response.json();

                editForm.setAttribute("data-id", student.id);
                editForm.querySelector('[name="pathway_id"]').value = student.pathway_id;
                editForm.querySelector('[name="first_name"]').value = student.first_name;
                editForm.querySelector('[name="last_name"]').value = student.last_name;
                editForm.querySelector('[name="study_status_id"]').value = student.study_status_id;
                editForm.querySelector('[name="entry_level_id"]').value = student.entry_level_id;
                editForm.querySelector('[name="current_level_id"]').value = student.current_level_id;
                editForm.querySelector('[name="enrollment_year"]').value = student.enrollment_year;

                $('#editStudentModal').modal('show');

            } catch (err) {
                console.error("Failed to fetch student for editing", err);
            }
        });
    });

    // Submit handler for Edit Form
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
        if (error) return; 

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

        const errorDiv = document.getElementById("deleteError");
        const successDiv = document.getElementById("deleteSuccess");
        errorDiv.classList.add("d-none");
        errorDiv.textContent = "";
        successDiv.classList.add("d-none");
        successDiv.textContent = "";

        if (!confirm("Are you sure you want to delete this student?")) {
            return;
        }

        try {
            const response = await fetch(`/studentmanagement/delete-student/${studentId}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                const status = response.status;
                const errorMessage = data.error ||
                    (status === 400 ? "Invalid input." :
                        status === 404 ? "Student not found." :
                            status === 409 ? "An error occurred while deleting the student." : "An unexpected error occurred"
                    );
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove("d-none");

                return;
            }

            successDiv.textContent = data.message || "Student deleted successfully!";
            successDiv.classList.remove("d-none");

            setTimeout(() => {
                window.location.href = "/studentmanagement";
            }, 2000);


        } catch (err) {
            console.error("Error deleting student:", err);
            errorDiv.textContent = "A network error occurred.";
            errorDiv.classList.remove("d-none");
        }
    });
});

// Functionality for assign / enroll modules form
document.querySelectorAll(".assign-modules-btn").forEach(button => {
    button.addEventListener("click", async function () {
        const studentId = this.getAttribute("data-id");
        const res = await fetch(`/studentmanagement/student/${studentId}/available-modules`);
        const data = await res.json();


        document.getElementById("assignModulesModal").setAttribute("data-student-id", studentId);

        // Student details
        document.getElementById("studentModuleDetails").innerHTML = `
          <strong>Student:</strong> ${data.first_name} ${data.last_name} (${data.student_number})<br>
          <strong>Pathway:</strong> ${data.pathway_name}<br>
          <strong>Current Level:</strong> ${data.current_level_name}
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

        // All other available modules (non-core)
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
    let autumn = 0;
    let spring = 0;
    let fullYear = 0;

    checkboxes.forEach(cb => {
        const credits = parseInt(cb.getAttribute("data-credits"));
        const semester = cb.getAttribute("data-semester");
        total += credits;

        switch (semester) {
            case "AUT":
                autumn += credits;
                break;
            case "SPR":
                spring += credits;
                break;
            case "FYR":
                fullYear += credits;
                break;
        }
    });

    document.getElementById("catsCounter").textContent = total;

    const coreModuleCheckboxes = document.querySelectorAll('#mandatoryCoreModules .module-checkbox');
    const optionalCoreCheckboxes = document.querySelectorAll('#optionalCoreModules .module-checkbox');

    const hasCoreModules = coreModuleCheckboxes.length > 0;
    const hasOptionalCoreModules = optionalCoreCheckboxes.length > 0;

    const coreSelected = Array.from(coreModuleCheckboxes).some(cb => cb.checked);
    const optionalCoreSelected = Array.from(optionalCoreCheckboxes).some(cb => cb.checked);

    const coreWarningDiv = document.getElementById("coreWarning");
    if (hasCoreModules && !coreSelected) {
        coreWarningDiv.textContent = "You must select at least one mandatory core module.";
        coreWarningDiv.classList.remove("d-none");
    } else {
        coreWarningDiv.textContent = "";
        coreWarningDiv.classList.add("d-none");
    }


    const optionalCoreWarningDiv = document.getElementById("optionalCoreWarning");
    if (hasOptionalCoreModules && !optionalCoreSelected) {
        optionalCoreWarningDiv.textContent = "You must select at least one optional core module (EITHER/OR).";
        optionalCoreWarningDiv.classList.remove("d-none");
    } else {
        optionalCoreWarningDiv.textContent = "";
        optionalCoreWarningDiv.classList.add("d-none");
    }

    const submitButton = document.getElementById("submitEnrollmentBtn");
    const meetsCreditRequirement = total >= 120;
    const meetsCoreRequirement = !hasCoreModules || coreSelected;
    const meetsOptionalCoreRequirement = !hasOptionalCoreModules || optionalCoreSelected;


    submitButton.disabled = !(meetsCreditRequirement && meetsCoreRequirement && meetsOptionalCoreRequirement);

    document.getElementById("autumnCATS").textContent = `Autumn: ${autumn} CATS`;
    document.getElementById("springCATS").textContent = `Spring: ${spring} CATS`;
    document.getElementById("fullYearCATS").textContent = `Full Year: ${fullYear} CATS`;

    // Warning if over 60 CATS in a semester
    const warningDiv = document.getElementById("semesterWarning");
    if (autumn > 60 || spring > 60) {
        let msg = "You're enrolling more than 60 CATS in:";
        if (autumn > 60) msg += ` Autumn (${autumn})`;
        if (spring > 60) msg += ` Spring (${spring})`;
        warningDiv.textContent = msg;
        warningDiv.classList.remove("d-none");
    } else {
        warningDiv.classList.add("d-none");
        warningDiv.textContent = '';
    }

    // Show/hide the warning if over 120 CATS
    const exceedCATSDiv = document.getElementById("exceedCATS");
    if (total > 120) {
        exceedCATSDiv.textContent = "Be aware you are enrolling for more CATs than are required";
        exceedCATSDiv.classList.remove("d-none");
    } else {
        exceedCATSDiv.classList.add("d-none");
        exceedCATSDiv.textContent = "";
    }
}

// Functionality for submitting enrollment button
document.getElementById("submitEnrollmentBtn").addEventListener("click", async function () {
    const studentId = document.getElementById("assignModulesModal").getAttribute("data-student-id");

    const errorDiv = document.getElementById("enrollError");
    const successDiv = document.getElementById("enrollSuccess");
    errorDiv.classList.add("d-none");
    errorDiv.textContent = "";
    successDiv.classList.add("d-none");
    successDiv.textContent = "";


    const selectedModules = Array.from(document.querySelectorAll(".module-checkbox:checked"))
        .map(cb => ({
            module_id: parseInt(cb.value),
            credits: parseInt(cb.getAttribute("data-credits")),
            semester: cb.getAttribute("data-semester")
        }));

    const totalCredits = selectedModules.reduce((sum, mod) => sum + mod.credits, 0);

    if (totalCredits < 120) {
        errorDiv.textContent = "You must select at least 120 CATS.";
        errorDiv.classList.remove("d-none");
        return;
    }

    try {
        const acadYrId = document.getElementById("academicYearSelect").value;

        const response = await fetch(`/studentmanagement/student/${studentId}/enroll`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ modules: selectedModules, acad_yr_id: acadYrId })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || "Unknown error occurred while enrolling modules";
            errorDiv.innerHTML = errorMessage.replace(/\n/g, "<br>"); 
            errorDiv.classList.remove("d-none");

            return;
        }

        successDiv.textContent = data.message || "Modules assigned successfully!";
        successDiv.classList.remove("d-none");

        setTimeout(() => {
            window.location.href = "/studentmanagement";
        }, 3000);

    } catch (err) {
        console.error("Error deleting student:", err);
        errorDiv.textContent = err.message || "A network error occurred.";
        errorDiv.classList.remove("d-none");
    }
});


