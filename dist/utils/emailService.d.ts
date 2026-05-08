declare const _exports: EmailService;
export = _exports;
declare class EmailService {
    transporter: any;
    getEmailTemplate(content: any): string;
    sendOTP(email: any, otp: any, purpose?: string): Promise<boolean>;
    sendWelcomeEmail(user: any): Promise<boolean>;
    sendPasswordResetConfirmation(email: any, userName: any): Promise<boolean>;
    sendAccountNotification(email: any, title: any, message: any, actionUrl?: any, actionText?: any): Promise<boolean>;
    _sendEmail(to: any, subject: any, content: any): Promise<boolean>;
    sendTestEmail(email: any): Promise<boolean>;
}
