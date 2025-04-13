console.log("Module Management JS loaded");

console.log("Module JS loaded, hooking form...");



// Validate Add/Edit Form
function validateModuleForm(form, errorDiv) {
    const subjectCode = form.querySelector('[name="subject_code"]').value.trim();
    const catalogueCode = form.querySelector('[name="catalogue_code"]').value.trim();
    const title = form.querySelector('[name="title"]').value.trim();
    const credits = form.querySelector('[name="credits"]').value.trim();
    const semesterId = form.querySelector('[name="semester_id"]').value.trim();

    const isPositiveInteger = val => /^\d+$/.test(val);

    //1. Presence checks
    if (!subjectCode) return showError('Subject code is required.');
    if (!catalogueCode) return showError('Catalogue code is required.');
    if (!title) return showError('Title is required.');
    if (!credits) return showError('Credits is required.');
    if (!semesterId) return showError('Semester is required.');

    // 2. Format check for individual fields
    if (subjectCode.length !== 4)
        return showError('Subject code must be 4 characters exactly.');
    if (!isNaN(subjectCode))
        return showError('Subject code must not be numeric.');
    if (catalogueCode.length !== 3)
        return showError('Catalogue code must be 3 characters exactly.');
    if (title.length < 3 || title.length > 50)
        return showError('Title must be between 3 and 50 characters long.');
    if (isNaN(credits))
        return showError('Credits must be a number.');
    if (!ALLOWED_CREDIT_VALUES.includes(parseInt(credits))) {
        return showError(`Credits must be one of: ${ALLOWED_CREDIT_VALUES.join(", ")}`);
    }
    if (semesterId < 1 || semesterId > 3)
        return showError('Semester must be be one of: SPR, AUT, or FYR.');

    return null; // No errors found

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
            console.log("Submitting form with payload:", payload);


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

                //delay redirect to allow user to see success message
                setTimeout(() => {
                    window.location.href = '/modulemanagement'; // Redirect to module management page
                }, 2000); // 2 seconds delay before redirecting

            } catch (err) {
                console.error("Add module failed:", err);
                errorDiv.textContent = "A network error occurred.";
                errorDiv.classList.remove("d-none");
            }
        });
    }
});