/**
 * Email Service
 *
 * Centralized email dispatch utility with pluggable transports.
 * Supports SMTP (via nodemailer) and console logging for development.
 */

const { logger } = require('./Logger');

let nodemailer = null;
try {
  // Optional dependency - only required when SMTP transport is enabled.
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch (error) {
  logger.warn(
    '[EmailService] nodemailer not installed. SMTP transport will be unavailable.',
    { error: error.message }
  );
}

class EmailService {
  constructor() {
    this.transportType =
      (process.env.EMAIL_TRANSPORT || 'console').toLowerCase();
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Send a generic email message.
   * @param {Object} message - { to, subject, text, html }
   */
  async sendMail(message) {
    if (!message?.to) {
      throw new Error('Email recipient is required');
    }

    if (this.transportType === 'disable') {
      logger.info('[EmailService] Email transport disabled. Skipping send.', {
        subject: message.subject,
        to: message.to,
      });
      return { delivered: false, transport: 'disabled' };
    }

    if (this.transportType === 'smtp') {
      const transporter = await this._getSmtpTransport();
      try {
        await transporter.sendMail({
          from: this._getFromAddress(),
          ...message,
        });
        return { delivered: true, transport: 'smtp' };
      } catch (error) {
        logger.error('[EmailService] SMTP send failed', error, {
          to: message.to,
          subject: message.subject,
        });
        throw error;
      }
    }

    // Default: console logging
    logger.info('[EmailService] Console transport (development)', {
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { delivered: true, transport: 'console' };
  }

  /**
   * Specialized helper for password reset notifications.
   */
  async sendPasswordResetEmail({
    to,
    resetUrl,
    expiresAt,
    userName,
    tenantName,
    requestIp,
    userAgent,
  }) {
    const subject =
      process.env.PASSWORD_RESET_SUBJECT ||
      'Reset your intelliSPEC password';

    const greetingName = userName || to;
    const tenantLine = tenantName
      ? `for ${tenantName}`
      : 'for your intelliSPEC account';
    const expiryText = this._formatExpiry(expiresAt);

    const textBody = [
      `Hello ${greetingName},`,
      '',
      `We received a request to reset the password ${tenantLine}.`,
      'If you made this request, please use the link below:',
      '',
      resetUrl,
      '',
      `This link expires ${expiryText}.`,
      'If you did not request a password reset, you can safely ignore this email.',
      '',
      'Security details:',
      ` - Request IP: ${requestIp || 'unknown'}`,
      ` - Browser: ${userAgent || 'unknown'}`,
      '',
      'Thanks,',
      'The intelliSPEC team',
    ].join('\n');

    const htmlBody = `
      <p>Hello ${this._escapeHtml(greetingName)},</p>
      <p>We received a request to reset the password ${this._escapeHtml(
        tenantLine
      )}.</p>
      <p>If you made this request, click the secure button below:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="
          background-color:#2563eb;
          color:#fff;
          padding:12px 20px;
          border-radius:6px;
          text-decoration:none;
          font-weight:600;
          display:inline-block;
        ">
          Reset password
        </a>
      </p>
      <p>If the button does not work, copy and paste this URL into your browser:</p>
      <p style="word-break:break-word;"><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires ${this._escapeHtml(expiryText)}.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px;color:#6b7280;">
        Security details:<br/>
        Request IP: ${this._escapeHtml(requestIp || 'unknown')}<br/>
        Browser: ${this._escapeHtml(userAgent || 'unknown')}
      </p>
      <p>Thanks,<br/>The intelliSPEC team</p>
    `;

    return this.sendMail({
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
  }

  /**
   * Lazily configure SMTP transport.
   * @private
   */
  async _getSmtpTransport() {
    if (this.transporter) {
      return this.transporter;
    }

    if (!nodemailer) {
      throw new Error(
        'SMTP transport requested but nodemailer is not installed. Run `npm install nodemailer`.'
      );
    }

    const uri =
      process.env.SMTP_URI ||
      process.env.EMAIL_SMTP_URI ||
      process.env.SMTP_URL;

    if (uri) {
      this.transporter = nodemailer.createTransport(uri);
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE?.toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      throw new Error(
        'SMTP transport requested but SMTP_HOST is not configured.'
      );
    }

    const auth =
      user && pass
        ? {
            auth: { user, pass },
          }
        : {};

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...auth,
    });

    return this.transporter;
  }

  _getFromAddress() {
    return (
      process.env.EMAIL_FROM ||
      process.env.PASSWORD_RESET_FROM ||
      'notifications@intellispec.local'
    );
  }

  _formatExpiry(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return 'in 60 minutes';
    }
    return `on ${date.toLocaleString()}`;
  }

  _escapeHtml(input) {
    if (!input) return '';
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = new EmailService();
