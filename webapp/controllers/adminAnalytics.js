const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

// Module pass / fail rates view
router.get("/", async (req, res) => {
    try {
        const response = await axios.get("http://localhost:4000/grades/by-module", config);
        const moduleData = response.data;

        const statsByYear = {};


        moduleData.forEach(module => {
            module.students.forEach(student => {
                const year = student.academic_year;
                const moduleId = module.module_id;
                const result = (student.resit_result || student.grade_result || "").toLowerCase();

                // Initial object for the year and module
                if (!statsByYear[year]) statsByYear[year] = {};
                if (!statsByYear[year][moduleId]) {
                    statsByYear[year][moduleId] = {
                        module_code: module.module_code,
                        module_title: module.module_title,
                        module_subject_code: module.subject_code,
                        pass: 0,
                        fail: 0,
                        total: 0
                    };
                }

                // Count and increment
                const isPass = ["pass", "pass capped"].includes(result);
                const isFail = ["fail", "absent"].includes(result);

                if (isPass) statsByYear[year][moduleId].pass++;
                else if (isFail) statsByYear[year][moduleId].fail++;

                statsByYear[year][moduleId].total++;
            });
        });


        return res.render("adminanalytics-passfail", {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            analyticsData: statsByYear,
            currentPage: "pass-fail"
        });

    } catch (err) {
        console.error("Failed to fetch analytics data:", err.message);
        return res.status(500).send("Failed to load analytics data");
    }
});

// Pathway progression rates view
router.get("/progression", async (req, res) => {
    const response = await axios.get("http://localhost:4000/grades/progression/by-pathway-level", config);
    const progressionRows = response.data;

    const progressionStats = {};

    progressionRows.forEach(row => {
        const { academic_year, pathway_name, level_name, progression_result } = row;

        if (!progressionStats[academic_year]) progressionStats[academic_year] = {};
        if (!progressionStats[academic_year][pathway_name]) progressionStats[academic_year][pathway_name] = {};
        if (!progressionStats[academic_year][pathway_name][level_name]) {
            progressionStats[academic_year][pathway_name][level_name] = {
                progressed: 0,
                total: 0
            };
        }

        if (progression_result && progression_result.toLowerCase().startsWith("progress to")) {
            progressionStats[academic_year][pathway_name][level_name].progressed++;
        }

        progressionStats[academic_year][pathway_name][level_name].total++;
    });

    res.render("progressionanalytics", {
        user: {
            id: req.session.userID,
            email: req.session.email
        },
        progressionData: progressionStats,
        currentPage: "progression"
    });
});




module.exports = router; 