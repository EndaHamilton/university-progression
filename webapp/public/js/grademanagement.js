
// Validate add/edit Student Grade form
function validateGradeForm(form, errorDiv) {
  const studentId = form.querySelector('[name="student_id"]').value.trim();
  const moduleId = form.querySelector('[name="module_id"]').value.trim();
  const academicYearId = form.querySelector('[name="academic_year_id"]').value.trim();

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

  const normalizedGradeResult = gradeResult.trim().toLowerCase();
  if (!firstGrade && normalizedGradeResult !== "excused") {
    return showError("First grade is required unless result is 'excused'.");
  }

  if (!gradeResult) return showError("First result is required.");


  //2. Format checks for individual fields
  if (!isPositiveInteger(studentId)) return showError('Invalid student.');
  if (!isPositiveInteger(moduleId)) return showError('Invalid module.');
  if (!isPositiveInteger(academicYearId)) return showError('Invalid academic year.');

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

// Helper function for dealing with nullable fields
function cleanOptionalFields(payload) {
  if (payload.resit_grade === "") payload.resit_grade = null;
  if (payload.resit_result === "" || payload.resit_result === "Select Result") payload.resit_result = null;
  return payload;
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
      const payload = cleanOptionalFields(Object.fromEntries(formData.entries())); // convers optional fields to null if empty

      // // Convert optional fields to null if empty
      // if (!payload.resit_grade || payload.resit_grade === "") payload.resit_grade = null;
      // if (!payload.resit_result || payload.resit_result === "Select Result" || payload.resit_result === "") payload.resit_result = null;

      console.log("Form is valid! Payload would be:", payload);

      console.log("Submitting grade with payload:", payload);

      try {
        const response = await fetch("/grademanagement/add-grade", {
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

        const currentPath = window.location.pathname;

        setTimeout(() => {
          if (currentPath.includes("/by-module")) {
            window.location.href = "/grademanagement/";
          } else {
            window.location.href = "/grademanagement";
          }
        }, 2000);

      } catch (err) {
        console.error("Error submitting grade:", err);
        errorDiv.textContent = "A network error occurred.";
        errorDiv.classList.remove("d-none");
      }
    });
  }
});

// Edit Grade Modal
document.addEventListener("DOMContentLoaded", function () {
  const editForm = document.querySelector("#editGradeForm");

  // Attach click handlers to Edit buttons
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", async function () {
      const gradeId = this.getAttribute("data-id");

      try {
        const response = await fetch(`/grademanagement/${gradeId}`);
        const grade = await response.json();

        // Fill form with grade data
        editForm.setAttribute("data-id", grade.id);
        editForm.querySelector('[name="student_id"]').value = grade.student_id;
        editForm.querySelector('[name="module_id"]').value = grade.module_id;
        editForm.querySelector('[name="academic_year_id"]').value = grade.academic_year_id;
        editForm.querySelector('[name="first_grade"]').value = grade.first_grade;
        editForm.querySelector('[name="grade_result"]').value = grade.grade_result;
        editForm.querySelector('[name="resit_grade"]').value = grade.resit_grade || "";
        editForm.querySelector('[name="resit_result"]').value = grade.resit_result || "";

        // Show the modal
        $('#editGradeModal').modal('show');

      } catch (err) {
        console.error("Failed to fetch grade for editing:", err);
      }
    });
  });

  // Submit handler for Edit Grade Form
  editForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const gradeId = editForm.getAttribute("data-id");
    const formData = new FormData(editForm);
    const payload = cleanOptionalFields(Object.fromEntries(formData.entries()));

    // // Convert optional fields to null if empty
    // if (!payload.resit_grade || payload.resit_grade === "") payload.resit_grade = null;
    // if (!payload.resit_result || payload.resit_result === "Select Result" || payload.resit_result === "") payload.resit_result = null;


    // Clear previous feedback
    const errorDiv = document.getElementById("editGradeError");
    const successDiv = document.getElementById("editGradeSuccess");
    errorDiv.classList.add("d-none");
    errorDiv.textContent = "";
    successDiv.classList.add("d-none");
    successDiv.textContent = "";

    const error = validateGradeForm(editForm, errorDiv);
    if (error) return;

    try {
      const response = await fetch(`/grademanagement/edit-grade/${gradeId}`, {
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
            status === 404 ? "Grade not found." :
              status === 409 ? "This student already has a grade for that module and academic year." :
                status === 500 ? 'Server error. Please try again later.' :
                  "An unexpected error occurred."
          );
        errorDiv.textContent = errorMessage
        errorDiv.classList.remove("d-none");
        return;
      }

      successDiv.textContent = data.message || "Grade updated successfully!";
      successDiv.classList.remove("d-none");

      //Gets view user had before opening modal - i.e. grouped by module or by student
      const currentPath = window.location.pathname;

      setTimeout(() => {
        if (currentPath.includes("/by-module")) {
          window.location.href = "/grademanagement/by-module";
        } else {
          window.location.href = "/grademanagement";
        }
      }, 2000);

    } catch (err) {
      console.error("Error submitting grade update:", err);
      errorDiv.textContent = "A network error occurred.";
      errorDiv.classList.remove("d-none");
    }
  });
});

// Delete Grade functionality
document.querySelectorAll(".delete-btn").forEach(button => {

  button.addEventListener("click", async function () {
    const gradeId = this.getAttribute("data-id");

    if (!confirm("Are you sure you want to delete this grade?")) {
      return; // User cancelled
    }

    try {
      const response = await fetch(`/grademanagement/delete-grade/${gradeId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "An error occurred while deleting the grade.");
        return;
      }

      //Gets view user had before opening modal - i.e. grouped by module or by student
      const currentPath = window.location.pathname;

      alert(data.message || "Grade deleted successfully!");

      if (currentPath.includes("/by-module")) {
        window.location.href = "/grademanagement/by-module";
      } else {
        window.location.href = "/grademanagement";
      }

    } catch (err) {
      console.error("Error deleting module:", err);
      alert("A network error occurred while deleting the module.");
    }
  });
});

// Modal to display grades for each student
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".view-grades-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const studentId = btn.dataset.id;

      // Error msg in case of failure to load modal
      const errorDiv = document.getElementById("modalLoadError");
      errorDiv.classList.add("d-none");
      errorDiv.textContent = "";

      try {
        const response = await fetch(`/grademanagement/student/${studentId}`);
        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Error fetching student grades");
          return;
        }

        // Show student info
        const s = data.student;
        document.getElementById("modalStudentInfo").innerHTML = `
            <strong>${s.first_name} ${s.last_name}</strong> (${s.student_number})<br>
            Pathway: ${s.pathway_name}<br>
            Current Level: ${s.current_level}, Study Status: ${s.study_status}
          `;


        // Populate navigatable table of students grades
        const tabNav = document.createElement("ul");
        tabNav.className = "nav nav-tabs";
        tabNav.id = "gradeTabs";
        tabNav.role = "tablist";

        const tabContent = document.createElement("div");
        tabContent.className = "tab-content";

        let isFirst = true;

        const gradeEntries = Object.entries(data.studentGrades);
        for (const [year, grades] of gradeEntries) {
          // const tabId = `tab-${year.replace(/[^a-zA-Z0-9]/g, '')}`;
          const tabId = `tab-${year}`;

          // Tab nav item
          const li = document.createElement("li");
          li.className = "nav-item";
          li.innerHTML = `
          <a class="nav-link ${isFirst ? "active" : ""}" id="${tabId}-tab" data-toggle="tab" href="#${tabId}" role="tab">${year}</a>
          `;
          tabNav.appendChild(li);

          // Tab pane
          const tabPane = document.createElement("div");
          tabPane.className = `tab-pane fade ${isFirst ? "show active" : ""}`;
          tabPane.id = tabId;
          tabPane.role = "tabpanel";
          tabPane.dataset.acadYearId = grades[0]?.academic_year_id || "";

          const summaryDiv = document.createElement("div");
          summaryDiv.className = "mb-2 font-weight-bold text-info";
          summaryDiv.textContent = "Loading summary...";
          tabPane.appendChild(summaryDiv);

          const table = document.createElement("table");
          table.className = "table table-sm table-striped";
          table.innerHTML = `
        <thead class="thead-light">
          <tr>
            <th>Module</th>
            <th>1st Grade</th>
            <th>1st Result</th>
            <th>Resit Grade</th>
            <th>Resit Result</th>
          </tr>
        </thead>
    <tbody>
      ${grades.map(g => `
        <tr>
          <td>${g.module_title} (${g.module_code})<br><strong> CATS: ${g.credits} </strong><br><small class="badge badge-secondary">${g.semester_name}</small></td>
          <td><input type="number" class="form-control form-control-sm" value="${g.first_grade}" data-id="${g.id}" data-type="first_grade"></td>
          <td>
            <select class="form-control form-control-sm" data-id="${g.id}" data-type="grade_result">
              ${["pass", "fail", "pass capped", "excused", "absent"].map(opt =>
            `<option value="${opt}" ${opt === g.grade_result ? "selected" : ""}>${opt}</option>`).join("")}
            </select>
          </td>
          <td><input type="number" class="form-control form-control-sm" value="${g.resit_grade || ""}" data-id="${g.id}" data-type="resit_grade"></td>
          <td>
            <select class="form-control form-control-sm" data-id="${g.id}" data-type="resit_result">
              <option value=""></option>
              ${["pass", "fail", "pass capped", "excused", "absent"].map(opt =>
              `<option value="${opt}" ${opt === g.resit_result ? "selected" : ""}>${opt}</option>`).join("")}
            </select>
          </td>
        </tr>
      `).join("")}
    </tbody>
    `;

          tabPane.appendChild(table);

          // Fetch summary for this academic year
          if (grades[0]?.academic_year_id) {
            try {
              const summaryRes = await fetch(`/grademanagement/student/${studentId}/summary/${grades[0].academic_year_id}`);
              const summary = await summaryRes.json();

              summaryDiv.innerHTML = `<span class="text-primary h4 font-weight-bold">
                                      Total CATs acquired: ${summary.total_credits_achieved || 0}
                                      <br>
                                      Average Grade: ${summary.average_grade || 0}
                                      </span>
                                      `;
            } catch (err) {
              console.error("Error fetching grade summary:", err);
              summaryDiv.textContent = "Failed to load summary.";
            }
          }

          tabContent.appendChild(tabPane);
          isFirst = false;
        }

        const modalBody = document.querySelector("#studentGradeModal .modal-body");
        modalBody.innerHTML = `
                            <div id="modalStudentInfo" class="mb-3">
                            <strong>${s.first_name} ${s.last_name}</strong> (${s.student_number})<br>
                            Pathway: ${s.pathway_name}<br>
                            Current Level: ${s.current_level}, Study Status: ${s.study_status}
                            </div>
                            `;

        modalBody.appendChild(tabNav);
        modalBody.appendChild(tabContent);

        // // Populate grades
        // const tbody = document.getElementById("modalGradeTableBody");
        // tbody.innerHTML = "";

        // data.studentGrades.forEach(g => {
        //   const row = document.createElement("tr");
        //   row.innerHTML = `
        //       <td>${g.module_title} (${g.module_code})</td>
        //       <td>${g.academic_year}</td>
        //       <td><input type="number" class="form-control form-control-sm" value="${g.first_grade}" data-id="${g.id}" data-type="first_grade"></td>
        //       <td>
        //         <select class="form-control form-control-sm" data-id="${g.id}" data-type="grade_result">
        //           ${["pass", "fail", "pass capped", "excused", "absent"].map(opt =>
        //     `<option value="${opt}" ${opt === g.grade_result ? "selected" : ""}>${opt}</option>`
        //   ).join("")}
        //         </select>
        //       </td>
        //       <td><input type="number" class="form-control form-control-sm" value="${g.resit_grade || ""}" data-id="${g.id}" data-type="resit_grade"></td>
        //       <td>
        //         <select class="form-control form-control-sm" data-id="${g.id}" data-type="resit_result">
        //           <option value=""></option>
        //           ${["pass", "fail", "pass capped", "excused", "absent"].map(opt =>
        //     `<option value="${opt}" ${opt === g.resit_result ? "selected" : ""}>${opt}</option>`
        //   ).join("")}
        //         </select>
        //       </td>
        //       <td>
        //         <button class="btn btn-sm btn-success save-grade-btn" data-id="${g.id}">Save</button>
        //       </td>
        //     `;
        //   tbody.appendChild(row);
        // });

        $('#studentGradeModal').modal('show');
      } catch (err) {
        console.error("Error fetching grades:", err);
        errorDiv.textContent = "Failed to load student grades modal.";
      }
    });
  });

  // Handle Save all grades click
  document.getElementById("saveAllGradesBtn").addEventListener("click", async () => {
    const rows = document.querySelectorAll("#studentGradeModal tbody tr");
    const updates = [];
    const errorDiv = document.getElementById("gradeError");
    const successDiv = document.getElementById("gradeSuccess");

    errorDiv.classList.add("d-none");
    errorDiv.textContent = "";
    successDiv.classList.add("d-none");
    successDiv.textContent = "";

    for (const row of rows) {
      const gradeId = row.querySelector('[data-type="first_grade"]').dataset.id;

      const payload = {
        first_grade: row.querySelector('[data-type="first_grade"]').value,
        grade_result: row.querySelector('[data-type="grade_result"]').value,
        resit_grade: row.querySelector('[data-type="resit_grade"]').value || null,
        resit_result: row.querySelector('[data-type="resit_result"]').value || null
      };

      // Make a PUT request for each updated row
      try {
        const response = await fetch(`/grademanagement/edit-grade/${gradeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
          updates.push(gradeId); // Keep track of successful updates
        } else if (result.error !== "No changes detected. Student grade data is identical.") {
          errorDiv.textContent = result.error || "Error updating grades.";
          errorDiv.classList.remove("d-none");
          return;
        }

      } catch (err) {
        console.error("Error saving grade ID " + gradeId, err);
        errorDiv.textContent = "Network error while updating grades.";
        errorDiv.classList.remove("d-none");
        return;
      }
    }

    if (updates.length > 0) {
      successDiv.textContent = `${updates.length} grade(s) updated successfully!`;
      successDiv.classList.remove("d-none");
      setTimeout(() => {
        successDiv.classList.add("d-none");
        successDiv.textContent = "";
      }, 3000);
    } else {
      errorDiv.textContent = "No changes detected in any row.";
      errorDiv.classList.remove("d-none");
      setTimeout(() => {
        errorDiv.classList.add("d-none");
        errorDiv.textContent = "";
      }, 3000);
    }
  });


});

// Modal to display progression details for each student
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".view-progression-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const studentId = btn.dataset.id;

      // Error msg in case of failure to load modal - wipe previous error msg
      let errorDiv = document.getElementById("modalLoadError");
      errorDiv.classList.add("d-none");
      errorDiv.textContent = "";

      let successDiv = document.getElementById("progressionSuccess");
      successDiv.classList.add("d-none");
      successDiv.textContent = "";



      try {
        // 1. Fetch all academic years the student has grades for
        const studentRes = await fetch(`/grademanagement/student/${studentId}`);
        const studentData = await studentRes.json();

        if (!studentRes.ok) {
          alert(studentData.error || "Error fetching student data.");
          return;
        }

        const progressionModalBody = document.querySelector("#progressionModal .modal-body");
        progressionModalBody.innerHTML = ""; // Clear old content

        const tabNav = document.createElement("ul");
        tabNav.className = "nav nav-tabs";
        tabNav.role = "tablist";

        const tabContent = document.createElement("div");
        tabContent.className = "tab-content";

        let isFirst = true;

        const gradeEntries = Object.entries(studentData.studentGrades);

        for (const [year, grades] of gradeEntries) {
          const tabId = `prog-${year}`;

          const li = document.createElement("li");
          li.className = "nav-item";
          li.innerHTML = `
            <a class="nav-link ${isFirst ? "active" : ""}" id="${tabId}-tab" data-toggle="tab" href="#${tabId}" role="tab">${year}</a>
          `;
          tabNav.appendChild(li);

          const tabPane = document.createElement("div");
          tabPane.className = `tab-pane fade ${isFirst ? "show active" : ""}`;
          tabPane.id = tabId;
          tabPane.role = "tabpanel";

          const loadingDiv = document.createElement("div");
          loadingDiv.className = "font-weight-bold";
          loadingDiv.textContent = "Loading progression decision...";
          tabPane.appendChild(loadingDiv);

          // Fetch progression outcome for this academic year
          if (grades[0]?.academic_year_id) {
            try {
              const progressionRes = await fetch(`/grademanagement/student/${studentId}/progression/${grades[0].academic_year_id}`);
              const progressionData = await progressionRes.json();

              let finalisedProgression = null;
              try {
                const historyRes = await fetch(`/grademanagement/progression-result/${studentId}/${grades[0].academic_year_id}`);
                if (historyRes.ok) {
                  const historyData = await historyRes.json();
                  finalisedProgression = historyData.progression_result || null;
                }
              } catch (err) {
                console.error("Failed to fetch finalised progression result:", err);
              }


              if (progressionRes.ok) {
                loadingDiv.innerHTML = `
                <div class="mb-3">
                  <h5><strong>Current Level:</strong> ${progressionData.current_level}</h5>
                </div>

                <div class="mb-3">
                  <h6><strong>Credits Overview:</strong></h6>
                  <ul>
                    <li><strong>Total Credits Attempted:</strong> ${progressionData.total_credits_attempted}</li>
                    <li><strong>Total Credits Passed:</strong> ${progressionData.total_credits_passed}</li>
                    <li><strong>Level 1 Credits Attempted:</strong> ${progressionData.level1_credits_attempted}</li>
                    <li><strong>Level 1 Credits Passed:</strong> ${progressionData.level1_credits_passed}</li>
                    <li><strong>Level 2 Credits Attempted:</strong> ${progressionData.level2_credits_attempted}</li>
                    <li><strong>Level 2 Credits Passed:</strong> ${progressionData.level2_credits_passed}</li>
                  </ul>
                </div>

                <div class="mb-3">
                  <h6><strong>Module Failures:</strong></h6>
                  <ul>
                    <li><strong>Failed Core Modules:</strong> ${progressionData.failed_core_modules.length}</li>
                    <ul>
                      <li>${progressionData.failed_core_modules.map(m => `${m.module_code} (${m.module_title})`).join(', ')}</li>
                    </ul>
                    <li><strong>Outstanding Failed Modules:</strong> ${progressionData.outstanding_fails.length}</li>
                    <ul>
                      <li>${progressionData.outstanding_fails.map(m => `${m.module_code} ${m.title} (CATS: ${m.credits})`).join('; ')}</li>
                    </ul>
                  </ul>
                </div>

                <div class="mb-3">
                <h6><strong>Module Resits / Reenrollments:</strong></h6>
                <ul>
                  <li><strong>Resits Required:</strong> ${progressionData.modules_needing_resit.length}</li>
                  <ul>
                    <li>${progressionData.modules_needing_resit.map(m => `${m.module_code} ${m.title} (CATS: ${m.credits})`).join('; ')}</li>
                  </ul>
                  <li><strong>Reenrollments Required:</strong> ${progressionData.modules_needing_reenrollment.length}</li> 
                  <ul>
                    <li>${progressionData.modules_needing_reenrollment.map(m => `${m.module_code} ${m.title} (CATS: ${m.credits})`).join('; ')}</li>
                  </ul>
                </ul>
                </div>

                <div class="mb-3">
                  <h6><strong>Progression Decision:</strong></h6>
                  <p class="${progressionData.can_progress ? 'badge badge-success' : 'badge badge-danger'} p-2" style="font-size: 1rem;">
                    ${progressionData.can_progress ? 'CAN PROGRESS' : 'CANNOT PROGRESS'}
                  </p>
                </div>

                <div>
                  <h6><strong>Reason(s):</strong></h6>
                  <ul>
                    ${Array.isArray(progressionData.reason) ? progressionData.reason.map(r => `<li>${r}</li>`).join('') : `<li>${progressionData.reason}</li>`}
                  </ul>
                </div>
              `;

                // Show current finalised progression decision if available
                loadingDiv.innerHTML += `
                <h6><strong>Finalised Progression Decision (Admin):</strong></h6>
                <p class="badge ${finalisedProgression ? 'badge-info' : 'badge-secondary'} p-2" style="font-size: 1rem;">
                  ${finalisedProgression || "- (Not finalised yet)"}
                </p>
              `;

                loadingDiv.innerHTML += `
              <div class="mt-4">
              <h6><strong>Admin Progression Action:</strong></h6>
    
              <div class="form-group">
                <label for="progressionDecision-${tabId}">Select Final Outcome:</label>
                <select id="progressionDecision-${tabId}" class="form-control progression-decision-dropdown">
                  <option value="">-- Select Outcome --</option>
                  ${progressionData.can_progress ? `
                    <option value="Progress to Level ${(progressionData.current_level) + 1}">Progress to Level ${(progressionData.current_level) + 1}</option> 
                  ` : `
                    <option value="Resit Required">Resit Required</option>
                    <option value="Student Deciding (Withdraw/Repeat Year)">Student Deciding (Withdraw/Repeat Year)</option>
                    <option value="Contact Advisor of Studies">Contact Advisor of Studies</option>
                    <option class="font-weight bold" value="Progress to Level ${(progressionData.current_level) + 1} with Mitigating Circumstances">Progress to Level ${(progressionData.current_level) + 1} with Mitigating Circumstances</option>
                  `}
                </select>
              </div>

              <div class="form-group d-none" id="mitigatingCommentBox-${tabId}">
                <label for="mitigatingComment-${tabId}">Mitigating Circumstances Details:</label>
                <textarea id="mitigatingComment-${tabId}" class="form-control" rows="3" placeholder="Enter details..."></textarea>
              </div>

              <button class="btn btn-primary mt-2 finalise-progression-btn" data-student-id="${studentId}" data-acad-year-id="${grades[0].academic_year_id}" data-tab-id="${tabId}" disabled>
                Finalise Progression
              </button>
            </div>
              `;

                // Handle dropdown selection within progression modal and enabling/disabling the finalise button
                const decisionDropdown = tabPane.querySelector(`#progressionDecision-${tabId}`);
                const commentBox = tabPane.querySelector(`#mitigatingCommentBox-${tabId}`);
                const finaliseBtn = tabPane.querySelector(`.finalise-progression-btn[data-tab-id="${tabId}"]`);

                if (decisionDropdown && finaliseBtn) {
                  decisionDropdown.addEventListener('change', (e) => {
                    const selected = e.target.value;

                    if (selected.includes('Mitigating Circumstances')) {
                      commentBox.classList.remove('d-none');
                    } else {
                      commentBox.classList.add('d-none');
                    }

                    if (selected !== "") {
                      finaliseBtn.disabled = false;
                      finaliseBtn.classList.remove('btn-secondary');
                      finaliseBtn.classList.add('btn-primary');
                    } else {
                      finaliseBtn.disabled = true;
                      finaliseBtn.classList.remove('btn-primary');
                      finaliseBtn.classList.add('btn-secondary');
                    }
                  });

                  // Handle Finalise submission/click
                  finaliseBtn.addEventListener('click', async () => {
                    const selectedOutcome = decisionDropdown.value;
                    const mitigatingComment = tabPane.querySelector(`#mitigatingComment-${tabId}`)?.value || "";

                    if (selectedOutcome === "") {
                      let errorDiv = document.getElementById("progressionError");
                      errorDiv.textContent = 'Please select a progression outcome.';
                      errorDiv.classList.remove("d-none");
                      return;
                    }
                    if (selectedOutcome.includes('Mitigating Circumstances') && mitigatingComment.trim() === "") {
                      let errorDiv = document.getElementById("progressionError");
                      errorDiv.textContent = 'Please provide details for mitigating circumstances.';
                      errorDiv.classList.remove("d-none");
                      return;
                    }

                    const payload = {
                      progression_result: selectedOutcome,
                      mitigating_circumstances: mitigatingComment || null,
                      student_id: studentId,
                      academic_year_id: grades[0]?.academic_year_id
                    };

                    try {
                      console.log("Submitting progression:", payload);
                      const response = await fetch('/grademanagement/finalise-progression', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                      });

                      const result = await response.json();

                      // Disable finalise button after click to prevent double submit attempts
                      finaliseBtn.disabled = false;

                      if (response.ok) {
                        successDiv.textContent = 'Progression finalised successfully!';
                        successDiv.classList.remove("d-none");

                        setTimeout(() => {
                          successDiv.classList.add("d-none");
                          successDiv.textContent = "";
                          window.location.href = "/grademanagement/";
                        }, 3000);

                        // $('#progressionModal').modal('hide');
                      } else {

                        let errorDiv = document.getElementById("progressionError");
                        errorDiv.textContent = result.error || 'Failed to finalise progression.';
                        errorDiv.classList.remove("d-none");
                      }
                    } catch (error) {
                      let errorDiv = document.getElementById("progressionError");
                      errorDiv.textContent = error.message || 'Failed to finalise progression.';
                      errorDiv.classList.remove("d-none");
                      // console.error('Error submitting progression:', error);
                      // alert('Network error finalising progression.');
                    }
                  });
                }

              } else {
                loadingDiv.textContent = progressionData.error || "Failed to fetch progression.";
              }
            } catch (err) {
              console.error("Error fetching progression:", err);
              loadingDiv.textContent = "Error loading progression.";
            }
          }

          tabContent.appendChild(tabPane);
          isFirst = false;



        }

        progressionModalBody.appendChild(tabNav);
        progressionModalBody.appendChild(tabContent);

        $('#progressionModal').modal('show');
      } catch (err) {
        console.error("Error opening progression modal:", err);
        errorDiv.textContent = "Failed to load progression modal.";
      }
    });
  });
});

// // Handle dropdown selection within progression modal
// document.getElementById(`progressionDecision-${tabId}`).addEventListener('change', (e) => {
//   const selected = e.target.value;
//   const commentBox = document.getElementById(`mitigatingCommentBox-${tabId}`);
//   const finaliseBtn = document.querySelector(`.finalise-progression-btn[data-tab-id="${tabId}"]`);

//   if (selected === "Progress with Mitigating Circumstances") {
//     commentBox.classList.remove('d-none');
//   } else {
//     commentBox.classList.add('d-none');
//   }

//   // Enable Finalise button if a choice is made
//   if (selected !== "") {
//     finaliseBtn.disabled = false;
//     finaliseBtn.classList.remove('btn-secondary');
//     finaliseBtn.classList.add('btn-primary');
//   } else {
//     finaliseBtn.disabled = true;
//     finaliseBtn.classList.remove('btn-success');
//     finaliseBtn.classList.add('btn-secondary');
//   }
// });

// // Handle Finalise click
// document.querySelector(`.finalise-progression-btn[data-tab-id="${tabId}"]`).addEventListener('click', async () => {
//   const decision = document.getElementById(`progressionDecision-${tabId}`).value;
//   const comment = document.getElementById(`mitigatingComment-${tabId}`)?.value || "";
//   const studentId = studentId;
//   const acadYearId = grades[0].academic_year_id;

//   if (decision === "") {
//     alert("Please select a progression outcome.");
//     return;
//   }
//   if (decision === "Progress with Mitigating Circumstances" && comment.trim() === "") {
//     alert("Please provide details for mitigating circumstances.");
//     return;
//   }

//   try {
//     const response = await fetch('/grademanagement/finalise-progression', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         student_id: studentId,
//         academic_year_id: acadYearId,
//         overall_result: decision,
//         comment: comment
//       })
//     });

//     const result = await response.json();

//     if (response.ok) {
//       alert("Progression finalised successfully!");
//       $('#progressionModal').modal('hide');
//     } else {
//       alert(result.error || "Error finalising progression.");
//     }
//   } catch (err) {
//     console.error("Error finalising progression:", err);
//     alert("Something went wrong. Please try again.");
//   }
// });



// Pahtway filtering dropdown
document.addEventListener("DOMContentLoaded", () => {
  const pathwaySelect = document.getElementById("pathwayFilter");

  if (pathwaySelect) {
    pathwaySelect.addEventListener("change", () => {
      const selectedPathway = pathwaySelect.value;
      document.querySelectorAll(".student-card").forEach(card => {
        const cardPathway = card.getAttribute("data-pathway");
        const shouldShow = selectedPathway === "all" || cardPathway === selectedPathway;
        card.style.display = shouldShow ? "block" : "none";
      });
    });
  }
});

// Search function
const searchInput = document.getElementById("studentSearch");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".student-card").forEach(card => {
      const cardText = card.textContent.toLowerCase();
      const matches = cardText.includes(query);

      // Combine with pathway filter (if any)
      const pathwayFilter = document.getElementById("pathwayFilter").value;
      const cardPathway = card.getAttribute("data-pathway");
      const pathwayMatches = pathwayFilter === "all" || pathwayFilter === cardPathway;

      card.style.display = (matches && pathwayMatches) ? "block" : "none";
    });
  });
}

// Drag and Drop Script
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileElem');
const importButton = document.getElementById('importButton');

let selectedFile = null;

// Open file dialog
dropArea.addEventListener('click', () => fileInput.click());

// Handle file input selection
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    selectedFile = fileInput.files[0];
    importButton.disabled = false;
    dropArea.querySelector('p.fw-semibold').textContent = selectedFile.name;
  }
});

// Drag over styling
dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('dragover');
});

// Handle drop
dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    selectedFile = file;
    importButton.disabled = false;
    dropArea.querySelector('p.fw-semibold').textContent = selectedFile.name;
  } else {
    alert('Please drop a valid .csv file.');
  }
});

// Import button click
importButton.addEventListener('click', () => {
  if (selectedFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const csvText = e.target.result;
      // console.log('CSV Content:', text); // Process file here


      Papa.parse(csvText, {
        header: true, // optional - makes output an array of objects using the first row as keys
        skipEmptyLines: true,
        complete: function (results) {
          const data = results.data;

          // Send to server
          fetch('/grademanagement/upload-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)  // Send array of row objects
          })
          .then(res => res.json())
          .then(response => {
            console.log('Server response:', response);
            alert('CSV imported successfully!');
          })
          .catch(err => {
            console.error('Upload error:', err);
            alert('Error uploading CSV data.');
          });
        }
      });
    };
    reader.readAsText(selectedFile);
  }
});


