import nodemailer from "nodemailer";
import { type NextRequest, NextResponse } from "next/server";

interface Survey {
  id: number;
  survey_id: string;
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  role: string;
  industries: string[];
  industry_other: string;
  business_goals: string[];
  business_goals_other: string;
  slowdown_issues: string[];
  slowdown_issues_other: string;
  customer_journey: string;
  customer_journey_details: string;
  sops_status: string;
  sops_details: string;
  current_tools: string[];
  current_tools_details: string;
  marketing_confidence: string;
  marketing_details: string;
  content_quality: string;
  content_details: string;
  problem_areas: string[];
  problem_areas_details: string;
  data_analytics: string;
  data_details: string;
  solution_openness: string;
  solution_details: string;
  created_at: string;
}

// Escape user-provided text before putting it in HTML.
function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "a", "a and b", "a, b, and c"
function joinList(items: string[]): string {
  const list = items.filter((item) => item && item.trim());
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

function generateEmailContent(survey: Survey): {
  subject: string;
  html: string;
} {
  const clientName = escapeHtml(survey.client_name);
  const companyName = escapeHtml(survey.company_name);

  // Pull the main challenges from the survey (arrays may be missing).
  const challenges = [
    ...(survey.slowdown_issues ?? []),
    ...(survey.problem_areas ?? []),
    ...(survey.slowdown_issues_other ? [survey.slowdown_issues_other] : []),
  ];
  const uniqueChallenges = Array.from(new Set(challenges)).slice(0, 4);

  const goals = [
    ...(survey.business_goals ?? []),
    ...(survey.business_goals_other ? [survey.business_goals_other] : []),
  ].slice(0, 3);

  const tools = (survey.current_tools ?? []).slice(0, 4);

  const subject = `Your Business Assessment Results, ${survey.client_name}`;

  const paragraphs: string[] = [];

  paragraphs.push(
    `Thank you for completing the business assessment for <strong>${companyName}</strong>. We reviewed your responses and appreciate the time you took to share where your team stands today.`,
  );

  if (uniqueChallenges.length > 0) {
    paragraphs.push(
      `You mentioned that your business is being held back by ${escapeHtml(
        joinList(uniqueChallenges),
      )}. These are common growth blockers, and they are usually fixable once the right processes and tools are in place.`,
    );
  } else {
    paragraphs.push(
      `Based on what you shared, we see clear opportunities to improve your processes, tools, and results.`,
    );
  }

  if (goals.length > 0 || tools.length > 0) {
    const goalText =
      goals.length > 0
        ? `your goals of ${escapeHtml(joinList(goals))}`
        : "your business goals";
    const toolText =
      tools.length > 0
        ? ` and the tools you already use, such as ${escapeHtml(joinList(tools))}`
        : "";
    paragraphs.push(
      `We would like to build a plan around ${goalText}${toolText}, so you get practical next steps instead of generic advice.`,
    );
  }

  paragraphs.push(
    `Let's discuss your challenges and create a tailored solution. Visit <a href="https://infinitechphil.com/contact" style="color:#667eea;">infinitechphil.com/contact</a> to schedule a consultation or get in touch with our team.`,
  );

  const emailBody = paragraphs.map((text) => `<p>${text}</p>`).join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; font-size: 15px; opacity: 0.9; }
          .content { padding: 0 20px; }
          .content p { margin: 15px 0; font-size: 15px; line-height: 1.8; }
          .content strong { color: #667eea; }
          .cta { 
            background: #667eea; 
            color: white; 
            padding: 14px 28px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 25px 0; 
            font-weight: 600;
            transition: background 0.3s;
          }
          .cta:hover { background: #764ba2; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; font-size: 12px; color: #7f8c8d; text-align: center; }
          .footer-contact { margin: 15px 0; line-height: 1.8; }
          .footer-contact strong { color: #2c3e50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Insights from Your Assessment</h1>
            <p>Personalized recommendations for ${companyName}</p>
          </div>

          <div class="content">
            <p>Hi ${clientName},</p>

            ${emailBody}

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://infinitechphil.com/contact" class="cta">Schedule Your Consultation</a>
            </div>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong style="color: #667eea;">INFINITECH TEAM</strong>
            </p>
            
            <p style="font-style: italic; color: #7f8c8d; font-size: 14px;">
              We're excited to help you transform your business. Looking forward to connecting with you soon!
            </p>
          </div>

          <div class="footer">
            <div class="footer-contact">
              <strong>Assessment Summary</strong><br>
              Client: ${clientName}<br>
              Company: ${companyName}<br>
              Submitted: ${new Date(survey.created_at).toLocaleDateString()}
            </div>
            <p>© 2026 Infinitechphil. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { survey } = body;

    if (!survey) {
      return NextResponse.json(
        { error: "Survey data is required" },
        { status: 400 },
      );
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const { subject, html } = generateEmailContent(survey);

    // Send email to the client
    await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: survey.email,
      subject: subject,
      html: html,
    });

    // Also send a copy to admin emails
    const adminEmails = (process.env.SMTP_RECEIVER || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    if (adminEmails.length > 0) {
      await transporter.sendMail({
        from: process.env.SMTP_USERNAME,
        to: adminEmails.join(","),
        subject: `[Admin Copy] ${subject}`,
        html: html,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${survey.email}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please check SMTP configuration." },
      { status: 500 },
    );
  }
}
