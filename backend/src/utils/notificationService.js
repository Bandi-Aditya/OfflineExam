import ExamSession from '../models/ExamSession.js';
import { sendExamScheduledEmail } from './emailService.js';

/**
 * Check for sessions starting in 2 hours and send reminders.
 * This runs periodically.
 */
export const checkAndSendReminders = async () => {
    try {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoHoursAndTenMins = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000);

        // Find sessions starting between 1h 50m and 2h from now
        // This prevents double sending if run every 10 mins
        const sessions = await ExamSession.find({
            start_time: {
                $gte: twoHoursFromNow,
                $lt: twoHoursAndTenMins
            }
        }).populate('exam', 'title').populate('assignments.student', 'email name');

        if (sessions.length === 0) return;

        console.log(`[Task] Found ${sessions.length} sessions for 2-hour reminders.`);

        for (const session of sessions) {
            for (const assignment of session.assignments) {
                if (assignment.student?.email) {
                    await sendExamScheduledEmail(assignment.student.email, {
                        session_name: session.session_name,
                        start_time: session.start_time,
                        lab_name: session.lab_name,
                        classroom: session.classroom,
                        floor: session.floor,
                        block: session.block,
                        exam_title: session.exam?.title
                    });
                }
            }
        }
    } catch (error) {
        console.error('[Task] Reminder Error:', error);
    }
};
