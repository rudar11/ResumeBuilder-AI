
const pdfParse = require('pdf-parse')
const {generateInterviewReport , generateResumePdf}= require('../services/ai.service')
const interviewReportModel = require('../models/interviewReport.models')







async function generateInterViewReportController(req, res) {
    try {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        const { selfDescription, jobDescription } = req.body;

        const rawAiResponse = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });

        // 1. AI wrap karke bhejta hai toh handle karo
        let aiData = Array.isArray(rawAiResponse) ? rawAiResponse[0] : rawAiResponse;
        if (aiData.interviewReport) {
            aiData = aiData.interviewReport;
        }

        // --- DEEP DYNAMIC MAPPING START ---
        
        // 1. Title Search (Regex for title, role, position)
        const titleKey = Object.keys(aiData).find(k => /title|role|position/i.test(k));
        
        // 2. Score Deep Search (Har kone se score nikalna)
        let finalScore = 0;
        const directScoreKey = Object.keys(aiData).find(k => /score|match/i.test(k));
        
        if (directScoreKey && typeof aiData[directScoreKey] === 'number') {
            finalScore = aiData[directScoreKey];
        } 
       

        else {
            const nestedObj = aiData.overallAssessment || aiData.overall_evaluation || aiData.matchAnalysis || aiData.overall_score;
            if (nestedObj && typeof nestedObj === 'object') {
                const nestedScoreKey = Object.keys(nestedObj).find(k => /score|match/i.test(k));
                finalScore = nestedObj[nestedScoreKey] || 0;
            } else if (typeof nestedObj === 'number') {
                finalScore = nestedObj;
            }
        }

       
        if (finalScore > 0 && finalScore <= 1) {
            finalScore = finalScore * 100;
        } else if (finalScore > 1 && finalScore <= 10) {
            finalScore = finalScore * 10;
        }

        const interviewReportData = {
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            title: aiData[titleKey] || "MERN Developer",
            matchScore: Math.round(finalScore),
            technicalQuestions: aiData.technicalQuestions || [],
            behavioralQuestions: aiData.behavioralQuestions || [],
            skillGaps: aiData.skillGaps || [],
            preparationPlan: aiData.preparationPlan || []
        };
        // --- DEEP DYNAMIC MAPPING END ---

        const interviewReport = await interviewReportModel.create(interviewReportData);
        res.status(201).json({ message: "Success", interviewReport });

    } catch (error) {
        console.error(" ERROR IN CONTROLLER:", error);
        res.status(500).json({ message: "AI Error", error: error.message });
    }
}  



/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }




