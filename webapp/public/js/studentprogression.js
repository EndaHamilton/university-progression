// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {

        const res = await fetch('/studentprogression/data');
        const data = await res.json();

        const studentProfile = data.studentProfile;
        const studentGrades = data.studentGrades;
        const studentProgression = data.studentProgression;
        const gradeSummary = data.gradeSummary;
        const progressionResult = data.progressionResult;

        // Getting grades array for current / latest academic year - as studentGrades returns an object of arrays of grades grouped by academic year
        const latestYear = Object.keys(studentGrades)[0];
        const gradesArray = studentGrades[latestYear] || []; // gets first group of arrays within the array of arrays - latest academic year
        console.log("Latest Academic Year ID:", latestYear);
        console.log("Grades Array:", gradesArray);


        // Display Progression Decision
        const progressionDecision = document.getElementById('progressionDecisionArea');
        if (studentProgression && progressionDecision) {
            const canProgress = studentProgression.can_progress;
            const reasonList = Array.isArray(studentProgression.reason) ? studentProgression.reason : [];

            progressionDecision.innerHTML = canProgress
                ? `<span class="badge bg-success">Eligible to Progress</span>`
                : `<span class="badge bg-danger">Progression Currently Not Achieved</span>`;

            // List of progression reasons
            const reasonsContainer = document.createElement('div');
            reasonsContainer.classList.add('mt-2');
            reasonList.forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                reasonsContainer.appendChild(li);
            });
            progressionDecision.appendChild(reasonsContainer);

            const studentId = studentProfile.id;
            const acadYearId = gradesArray[0]?.academic_year_id;
            if (studentId && acadYearId) {
                try {
                    // const historyRes = await fetch(`/grademanagement/student-history/${studentId}/${acadYearId}`);
                    // const historyData = await historyRes.json();

                    const progressionResultArea = document.getElementById('progressionResultArea');
                    if (progressionResult && progressionResult.progression_result !== null) {
                        progressionResultArea.innerHTML = `
                        <div class="alert alert-primary">
                        Progression Result: <strong>${progressionResult.progression_result}</strong>
                        </div>
                    `;
                    } else {
                        progressionResultArea.innerHTML = `
                        <div class="alert alert-secondary">
                        Progression Result: <strong>Not finalised yet</strong> 
                        </div>
                    `;
                    }
                } catch (err) {
                    console.error("Failed fetching progression history:", err);
                    const progressionResultArea = document.getElementById('progressionResultArea');
                    progressionResultArea.innerHTML = `<div class="alert alert-warning">Error loading progression result.</div>`;
                }
            }

        }


        // Display grades summary (Credits and Average)
        const totalCreditsAttempted = document.getElementById('totalCreditsAttempted');
        const totalCreditsPassed = document.getElementById('totalCreditsPassed');
        const overallAverageGrade = document.getElementById('overallAverageGrade');

        if (gradeSummary) {
            if (studentProfile.current_level_id === 1) {
                totalCreditsAttempted.textContent = studentProgression.level1_credits_attempted || 0;
            } else if (studentProfile.current_level_id === 2) {
                totalCreditsAttempted.textContent = studentProgression.level2_credits_attempted || 0;
            }
            if (totalCreditsPassed) totalCreditsPassed.textContent = gradeSummary.total_credits_achieved || 0;
            if (overallAverageGrade) overallAverageGrade.textContent = `${gradeSummary.average_grade || 0}%`;
        }


        // Display student grades for current academic year

        const gradesTableBody = document.getElementById('moduleGradesTable');

        if (gradesTableBody && Array.isArray(gradesArray)) {
            gradesArray.forEach(grade => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
            <td>${grade.module_code || '-'}</td>
            <td>${grade.module_title || '-'}</td>
            <td>${grade.credits || '-'}</td>
            <td>${grade.semester_name || '-'}</td>
            <td>${grade.first_grade != null ? grade.first_grade : '-'}</td>
            <td>${grade.grade_result || '-'}</td>
            <td>${grade.resit_grade != null ? grade.resit_grade : '-'}</td>
            <td>${grade.resit_result || '-'}</td>
          `;

                gradesTableBody.appendChild(tr);
            });
        }


        // Populate Failed Modules Section
        const failedModulesArea = document.getElementById('failedModulesArea');

        // Check if there are any failed modules
        if ((studentProgression.failed_core_modules && studentProgression.failed_core_modules.length > 0) ||
            (studentProgression.outstanding_fails && studentProgression.outstanding_fails.length > 0)) {

            failedModulesArea.innerHTML = `
            <div class="mb-3">
                <h6><strong>Failed Core Modules:</strong></h6>
                ${studentProgression.failed_core_modules.length > 0 ? `
                    <ul class="list-group mb-3">
                    ${studentProgression.failed_core_modules.map(m => `
                        <li class="list-group-item">
                        ${m.module_code} - ${m.title} (CATS: ${m.credits})
                        </li>
                        `).join('')}
                    </ul>
                ` : `<p class="text-muted">No failed core modules.</p>`}
            </div>

            <div class="mb-3">
                <h6><strong>Outstanding Failed Modules:</strong></h6>
                ${studentProgression.outstanding_fails.length > 0 ? `
                    <ul class="list-group mb-3">
                    ${studentProgression.outstanding_fails.map(m => `
                        <li class="list-group-item">
                        ${m.module_code} - ${m.title} (CATS: ${m.credits})
                        </li>
                    `).join('')}
                    </ul>
                ` : `<p class="text-muted">No other outstanding fails.</p>`}
            </div>

            <div class="mb-3">
                <h6><strong>Modules Needing Resit:</strong></h6>
                ${studentProgression.modules_needing_resit.length > 0 ? `
                    <ul class="list-group mb-3">
                    ${studentProgression.modules_needing_resit.map(m => `
                        <li class="list-group-item">
                        ${m.module_code} - ${m.title} (CATS: ${m.credits})
                        </li>
                    `).join('')}
                    </ul>
                ` : `<p class="text-muted">No modules needing resit.</p>`}
            </div>

            <div class="mb-3">
                <h6><strong>Modules Needing Reenrollment:</strong></h6>
                ${studentProgression.modules_needing_reenrollment.length > 0 ? `
                    <ul class="list-group mb-3">
                    ${studentProgression.modules_needing_reenrollment.map(m => `
                        <li class="list-group-item">
                        ${m.module_code} - ${m.title} (CATS: ${m.credits})
                        </li>
                    `).join('')}
                    </ul>
                ` : `<p class="text-muted">No modules needing re-enrollment.</p>`}
            </div>
        `;
        } else {
            failedModulesArea.innerHTML = `<p class="text-muted">No module failures recorded.</p>`;
        }


    } catch (error) {
        console.error('Error loading progression page:', error);
        const errorMessage = document.getElementById('progressionError');
        if (errorMessage) {
            errorMessage.classList.remove('d-none');
            errorMessage.textContent = 'Failed to load your progression data. Please try again later.';
        }
    }
});
