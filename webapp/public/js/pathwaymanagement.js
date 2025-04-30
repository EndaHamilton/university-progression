document.addEventListener("DOMContentLoaded", function () {
    const assignButtons = document.querySelectorAll(".assign-btn");
    const assignForm = document.getElementById("assignModuleForm");
    const errorBox = document.getElementById("assignModalError");
    const globalSuccess = document.getElementById("assignSuccess");
    const globalError = document.getElementById("assignError");

    const isCoreSelect = document.getElementById("is_core");
    const isOptionalCoreGroup = document.getElementById("optionalCoreGroup");
    const optionalCoreSelect = document.getElementById("is_optional_core");
    const optionalAmountGroup = document.getElementById("optionalAmountGroup");

    // When core is selected
    isCoreSelect.addEventListener("change", function () {
        const isCore = this.value === "1";
        isOptionalCoreGroup.classList.toggle("d-none", !isCore);
        if (!isCore) {
            optionalCoreSelect.value = "";
            optionalAmountGroup.classList.add("d-none");
            document.getElementById("optional_amount").value = "";
        }
    });

    // When optional core is selected
    optionalCoreSelect.addEventListener("change", function () {
        const isOptCore = this.value === "1";
        optionalAmountGroup.classList.toggle("d-none", !isOptCore);
        if (!isOptCore) {
            document.getElementById("optional_amount").value = "";
        }
    });

    assignButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const pathwayId = btn.dataset.id;
            const pathwayName = btn.dataset.name;

            document.getElementById("assign-pathway-id").value = pathwayId;
            document.getElementById("assignModuleModalLabel").textContent = `Assign Module to ${pathwayName}`;
            errorBox.classList.add("d-none");
            optionalCoreGroup.classList.add("d-none");
            optionalAmountGroup.classList.add("d-none");
            assignForm.reset();

            $("#assignModuleModal").modal("show");
        });
    });

    assignForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        errorBox.classList.add("d-none");
        globalError.classList.add("d-none");
        globalSuccess.classList.add("d-none");

        const formData = new FormData(assignForm);
        const payload = Object.fromEntries(formData.entries());

        payload.is_core = parseInt(payload.is_core);
        payload.is_optional_core = payload.is_optional_core !== undefined && payload.is_optional_core !== ""
            ? parseInt(payload.is_optional_core)
            : null;

        // Handle optional core and amount logic
        if (payload.is_core === 0) {
            // Not core: optional fields irrelevant
            payload.is_optional_core = null;
            payload.optional_amount = null;
        } else {
            if (payload.is_optional_core === 0) {
                payload.optional_amount = null;
            } else {
                payload.optional_amount = payload.optional_amount ? parseInt(payload.optional_amount) : null;
            }
        }


        try {
            const response = await fetch("/pathwaymanagement/assign-module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "An error occurred");
            }

            $("#assignModuleModal").modal("hide");
            globalSuccess.textContent = result.message || "Module assigned successfully!";
            globalSuccess.classList.remove("d-none");

            setTimeout(() => window.location.reload(), 2000);

        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.classList.remove("d-none");
        }
    });
});
