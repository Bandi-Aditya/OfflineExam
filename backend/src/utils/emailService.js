import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Parse .env from root if not already loaded, though server.js usually does this.
// Assuming this service is called from within the running app which has env loaded.

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to 'smtp.gmail.com' or generic SMTP based on env
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // App Password for Gmail
    }
});

/**
 * Send OTP via Email
 * @param {string} email 
 * @param {string} otp 
 * @returns {Promise<boolean>}
 */
export const sendEmailOTP = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn('⚠️ EMAIL_USER or EMAIL_APP_PASSWORD not set in .env. Email sending skipped.');
        // For development, we return true so the flow isn't broken, but in prod this should be handled.
        return true;
    }

    const mailOptions = {
        from: `"Offline Exam System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Exam Login OTP',
        text: `Your OTP for login is: ${otp}. It expires in 5 minutes.`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #6366f1; padding: 24px; text-align: center;">
                    <h2 style="color: white; margin: 0; font-size: 24px;">Exam Access Verification</h2>
                </div>
                <div style="padding: 32px; background-color: #ffffff;">
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">Hello Student,</p>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 16px;">Use the following One-Time Password (OTP) to access your exam dashboard. This code is valid for <strong>5 minutes</strong>.</p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <span style="background-color: #f3f4f6; color: #1f2937; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; border-radius: 8px; border: 2px dashed #d1d5db;">
                            ${otp}
                        </span>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; text-align: center;">Never share this code with anyone, including proctors or administrators.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Exam Secure Systems. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email Service] Sent OTP to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ [Email Service] Error sending email:', error);
        return false;
    }
};

/**
 * Send Welcome Email to New Student
 */
export const sendWelcomeEmail = async (email, name, studentId, password) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return true;

    const mailOptions = {
        from: `"Offline Exam System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎓 Welcome to the Offline Exam Portal',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Welcome, ${name}!</h2>
                <p>Your account has been created on the Secure Offline Exam Portal.</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
                </div>
                <p>Please login and change your password as soon as possible.</p>
                <a href="${process.env.CLIENT_URL || '#'}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Go to Student Portal</a>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Welcome Email Error:', error);
        return false;
    }
};

/**
 * Send Exam Scheduled Email
 */
export const sendExamScheduledEmail = async (email, examDetails) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return true;

    const { session_name, start_time, lab_name, classroom, floor, block, exam_title } = examDetails;
    const date = new Date(start_time).toLocaleString();

    const mailOptions = {
        from: `"Offline Exam System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📅 New Exam Scheduled: ${exam_title}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Exam Scheduled Notice</h2>
                <p>A new exam has been scheduled for you.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-right: 4px solid #4f46e5;">
                    <p><strong>Exam:</strong> ${exam_title}</p>
                    <p><strong>Session:</strong> ${session_name}</p>
                    <p><strong>Time:</strong> ${date}</p>
                    <p><strong>Venue:</strong> ${lab_name || 'Classroom'} (${classroom || 'N/A'}, Floor: ${floor || 'N/A'}, Block: ${block || 'N/A'})</p>
                </div>
                <p style="margin-top: 20px; color: #666; font-size: 0.9em;">Please reach the venue 15 minutes before the start time.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Scheduled Email Error:', error);
        return false;
    }
};

/**
 * Send Exam Update Email
 */
export const sendExamUpdateEmail = async (email, examDetails) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return true;

    const { session_name, start_time, lab_name, classroom, floor, block, exam_title } = examDetails;
    const date = new Date(start_time).toLocaleString();

    const mailOptions = {
        from: `"Offline Exam System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `⚠️ UPDATE: Exam Details Changed - ${exam_title}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ffedd5; padding: 20px; border-radius: 10px; border: 1px solid #fb923c;">
                <h2 style="color: #c2410c;">Exam Details Updated</h2>
                <p>The details for your upcoming exam have been updated. Please check the new schedule below:</p>
                <div style="background: #fff; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316;">
                    <p><strong>Exam:</strong> ${exam_title}</p>
                    <p><strong>Session:</strong> ${session_name}</p>
                    <p><strong>New Time:</strong> ${date}</p>
                    <p><strong>New Venue:</strong> ${lab_name || 'Classroom'} (${classroom || 'N/A'}, Floor: ${floor || 'N/A'}, Block: ${block || 'N/A'})</p>
                </div>
                <p style="margin-top: 20px; color: #666;">Contact the administrator if you have any questions.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Update Email Error:', error);
        return false;
    }
};
