console.log("Module Management JS loaded");

console.log("Module JS loaded, hooking form...");



// Validate Add/Edit Form
function validateModuleForm(form, errorDiv) {

    const subjectId = form.querySelector('[name="subject_id"]').value.trim();
    const defaultProgramLevel = form.querySelector('[name="default_program_level"]').value.trim();


    const title = form.querySelector('[name="title"]').value.trim();
    const credits = form.querySelector('[name="credits"]').value.trim();
    const semesterId = form.querySelector('[name="semester_id"]').value.trim();



    const isPositiveInteger = val => /^\d+$/.test(val);

    // Presence checks
    if (!subjectId) return showError('Subject ID is required.');
    if (!defaultProgramLevel) return showError('Default Program Level is required.');
    if (!title) return showError('Title is required.');
    if (!credits) return showError('Credits is required.');
    if (!semesterId) return showError('Semester is required.');


    // Format check for individual fields
    if (!isPositiveInteger(subjectId))
        return showError('Subject ID must be a whole positive number.');
    if (defaultProgramLevel < 1 || defaultProgramLevel > 2)
        return showError('Default Program Level must be either 1 or 2');

    if (title.length < 3 || title.length > 50)
        return showError('Title must be between 3 and 50 characters long.');
    if (isNaN(credits))
        return showError('Credits must be a number.');
    if (!ALLOWED_CREDIT_VALUES.includes(parseInt(credits))) {
        return showError(`Credits must be one of: ${ALLOWED_CREDIT_VALUES.join(", ")}`);
    }
    if (semesterId < 1 || semesterId > 3) {
        return showError('Semester must be be one of: SPR, AUT, or FYR.');
    }


    return null; 

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove("d-none");
        return msg;
    }
}

//Add Module Modal
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#addModuleModal form");

    console.log("Form element:", form);

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Form submission intercepted");

            // Clear previous error message and success box each time
            const errorDiv = document.getElementById('addError');
            errorDiv.classList.add('d-none');
            errorDiv.textContent = '';
            const successDiv = document.getElementById('addSuccess');
            successDiv.classList.add('d-none');
            successDiv.textContent = '';

            const error = validateModuleForm(form, errorDiv);
            if (error) return;


            const formData = new FormData(form);


            const payload = Object.fromEntries(formData.entries());

            console.log("Submitting form with payload: ", payload);


            try {
                const response = await fetch("/modulemanagement/add-module", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                console.log("Fetch response:", response);
                console.log("Fetch data:", data);


                if (!response.ok) {

                    const status = response.status;
                    const errorMessage = data.error ||
                        (status === 400 ? 'Invalid input data.' :
                            status === 409 ? 'Module with same subj code, title and catalogue code already exists.' :
                                status === 500 ? 'Server error. Please try again later.' :
                                    'An unknown error occurred.'
                        );

                    console.error("API Error: ", errorMessage);

                    errorDiv.textContent = data.error || 'An error occurred.';
                    errorDiv.classList.remove('d-none');
                    return;
                }

                successDiv.textContent = data.message || "Module added successfully!";
                successDiv.classList.remove("d-none");

                setTimeout(() => {
                    window.location.href = '/modulemanagement'; 
                }, 2000); 

            } catch (err) {
                console.error("Add module failed:", err);
                errorDiv.textContent = "A network error occurred.";
                errorDiv.classList.remove("d-none");
            }
        });
    }
});

//Edit Module Modal
document.addEventListener("DOMContentLoaded", function () {
    const editForm = document.querySelector("#editModuleForm");

    //Attach click handlers to Edit buttons
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const moduleId = this.getAttribute("data-id");

            try {
                const response = await fetch(`/modulemanagement/module/${moduleId}`);
                const module = await response.json();

                // Fill form with student data
                editForm.setAttribute("data-id", module.id);
                editForm.querySelector('[name="subject_id"]').value = module.subject_id;
                editForm.querySelector('[name="default_program_level"]').value = module.default_program_level;
                editForm.querySelector('[name="title"]').value = module.title;
                editForm.querySelector('[name="credits"]').value = module.credits;
                editForm.querySelector('[name="semester_id"]').value = module.semester_id;

                // Show modal
                $('#editModuleModal').modal('show');

            } catch (err) {
                console.error("Failed to fetch module for editing", err);
            }
        });
    });

    // 2. Submit handler for Edit Form
    console.log("Registering edit form submit event");

    editForm.addEventListener("submit", async function (e) {

        console.log("Edit form submitted");

        e.preventDefault();
        const moduleId = editForm.getAttribute("data-id");
        const formData = new FormData(editForm);

        const payload = Object.fromEntries(formData.entries());

        // Clear previous feedback
        const errorDiv = document.getElementById("editError");
        const successDiv = document.getElementById("editSuccess");
        errorDiv.classList.add("d-none");
        errorDiv.textContent = "";
        successDiv.classList.add("d-none");
        successDiv.textContent = "";

        const error = validateModuleForm(editForm, errorDiv);
        if (error) return; // If validation fails, show error and return

        try {
            const response = await fetch(`/modulemanagement/edit-module/${moduleId}`, {
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
                        status === 404 ? "Module not found." :
                            status === 409 ? "Module with same module code already exists.." :
                                "An unexpected error occurred."
                    );
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove("d-none");

                return;
            }

            successDiv.textContent = data.message || "Module updated successfully!";
            successDiv.classList.remove("d-none");

            setTimeout(() => {
                window.location.href = "/modulemanagement";
            }, 2000);

        } catch (err) {
            console.error("Error submitting update:", err);
            errorDiv.textContent = "A network error occurred.";
            errorDiv.classList.remove("d-none");
        }
    });
});

// Delete Module functionality
document.querySelectorAll(".delete-btn").forEach(button => {

    button.addEventListener("click", async function () {
        const moduleId = this.getAttribute("data-id");

        // Clear previous feedback
        const errorDiv = document.getElementById("deleteError");
        const successDiv = document.getElementById("deleteSuccess");
        errorDiv.classList.add("d-none");
        errorDiv.textContent = "";
        successDiv.classList.add("d-none");
        successDiv.textContent = "";

        if (!confirm("Are you sure you want to delete this module?")) {
            return; // User cancelled
        }

        try {
            const response = await fetch(`/modulemanagement/delete-module/${moduleId}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                const status = response.status;
                const errorMessage = data.error ||
                    (status === 400 ? "Invalid input." :
                        status === 404 ? "Module not found." :
                            status === 409 ? "An error occurred while deleting the module." : "An unexpected error occurred"
                    );
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove("d-none");

                return;
            }

            successDiv.textContent = data.message || "Module deleted successfully!";
            successDiv.classList.remove("d-none");

            setTimeout(() => {
                window.location.href = "/modulemanagement";
            }, 2000);

        } catch (err) {
            console.error("Error deleting module:", err);
            alert("A network error occurred while deleting the module.");
        }
    });
});

// View grades for a specific module
document.querySelectorAll(".view-grades-btn").forEach(button => {
    button.addEventListener("click", async () => {
        const moduleId = button.dataset.id;

        try {
            const response = await fetch(`/modulemanagement/grades/module/${moduleId}`);
            const data = await response.json();

            const tabNav = document.createElement("ul");
            tabNav.className = "nav nav-tabs";
            tabNav.role = "tablist";

            const tabContent = document.createElement("div");
            tabContent.className = "tab-content";

            let isFirst = true;
            Object.entries(data).forEach(([year, students]) => {
                const tabId = `mod-tab-${year.replace(/[^a-zA-Z0-9]/g, '')}`;

                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `
                    <a class="nav-link ${isFirst ? 'active' : ''}" data-toggle="tab" href="#${tabId}" role="tab">${year}</a>
                `;
                tabNav.appendChild(li);

                const tabPane = document.createElement("div");
                tabPane.className = `tab-pane fade ${isFirst ? 'show active' : ''}`;
                tabPane.id = tabId;
                tabPane.role = "tabpanel";

                const table = document.createElement("table");
                table.className = "table table-sm table-bordered";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Student Number</th>
                            <th>1st Grade</th>
                            <th>1st Result</th>
                            <th>Resit Grade</th>
                            <th>Resit Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr>
                                <td>${s.first_name} ${s.last_name}</td>
                                <td>${s.student_number}</td>
                                <td>${s.first_grade}</td>
                                <td>${s.grade_result}</td>
                                <td>${s.resit_grade || ''}</td>
                                <td>${s.resit_result || ''}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                `;

                tabPane.appendChild(table);
                tabContent.appendChild(tabPane);
                isFirst = false;
            });

            const modalBody = document.getElementById("moduleGradesContent");
            modalBody.innerHTML = ""; // Clear old content
            modalBody.appendChild(tabNav);
            modalBody.appendChild(tabContent);

            $('#moduleGradesModal').modal('show');

        } catch (err) {
            console.error("Error loading module grades:", err);
            alert("Failed to load grades for this module.");
        }
    });
});
