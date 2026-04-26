package com.smartcampus.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends OTP emails using Spring JavaMailSender (Gmail SMTP).
 * The recipient is ALWAYS the dynamic "toEmail" parameter — never hardcoded.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    /**
     * Sends a beautifully styled HTML OTP email to the given address.
     *
     * @param toEmail the user's email address (dynamic — the email they typed in the form)
     * @param otp     the 6-digit code to include in the email
     */
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("SmartCampus Hub <" + fromEmail + ">");
            helper.setTo(toEmail); // ← ALWAYS the user's own email address
            helper.setSubject("🔐 Your SmartCampus Verification Code");
            helper.setText(buildHtmlTemplate(otp, toEmail), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP email to " + toEmail, e);
        }
    }

    private String buildHtmlTemplate(String otp, String toEmail) {
        String[] digits = otp.split("");
        StringBuilder digitBoxes = new StringBuilder();
        for (String digit : digits) {
            digitBoxes.append("""
                    <td style="padding: 0 6px;">
                      <div style="
                        width: 52px; height: 64px;
                        background: linear-gradient(135deg, #1e1b4b 0%%, #312e81 100%%);
                        border-radius: 14px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 32px; font-weight: 800;
                        color: #ffffff;
                        letter-spacing: 0;
                        text-align: center;
                        line-height: 64px;
                        box-shadow: 0 4px 15px rgba(99,102,241,0.4);
                      ">%s</div>
                    </td>
                    """.formatted(digit));
        }

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>SmartCampus OTP</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f0f0f7;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f0f7;padding:40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0" style="
                            background:#ffffff;
                            border-radius:24px;
                            overflow:hidden;
                            box-shadow:0 20px 60px rgba(0,0,0,0.10);
                            max-width:560px; width:100%%;
                          ">
                          <!-- Header gradient banner -->
                          <tr>
                            <td style="
                                background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 50%%, #a21caf 100%%);
                                padding: 48px 40px 40px;
                                text-align: center;
                              ">
                              <!-- Logo mark -->
                              <div style="
                                  display:inline-block;
                                  background:rgba(255,255,255,0.15);
                                  border-radius:20px;
                                  padding:14px 20px;
                                  margin-bottom:20px;
                                ">
                                <span style="font-size:28px;">🎓</span>
                              </div>
                              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                                SmartCampus Hub
                              </h1>
                              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                                Verification Code
                              </p>
                            </td>
                          </tr>

                          <!-- Body -->
                          <tr>
                            <td style="padding:44px 40px 36px;">
                              <p style="margin:0 0 6px;font-size:15px;color:#6b7280;font-weight:500;">Hello,</p>
                              <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111827;line-height:1.3;">
                                Here's your one-time<br/>verification code
                              </h2>
                              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
                                Enter this code on the SmartCampus login screen to complete your
                                authentication. The code is valid for <strong style="color:#4f46e5;">10 minutes</strong>.
                              </p>

                              <!-- OTP digit boxes -->
                              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                                <tr>
                                  %s
                                </tr>
                              </table>

                              <!-- Security notice -->
                              <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="
                                      background:#fef9ff;
                                      border:1.5px solid #e9d5ff;
                                      border-radius:14px;
                                      padding:16px 20px;
                                    ">
                                    <p style="margin:0;font-size:13px;color:#7c3aed;font-weight:600;">
                                      🛡️ Security Notice
                                    </p>
                                    <p style="margin:6px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                                      This code was requested for <strong style="color:#374151;">%s</strong>.
                                      If you did not request this, please ignore this email — your account is safe.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                            <td style="
                                background:#f9fafb;
                                border-top:1px solid #f3f4f6;
                                padding:24px 40px;
                                text-align:center;
                              ">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">
                                © 2025 SmartCampus Operations Hub · All rights reserved
                              </p>
                              <p style="margin:6px 0 0;font-size:12px;color:#d1d5db;">
                                This is an automated message — please do not reply.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(digitBoxes.toString(), toEmail);
    }
}
