import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      'Soporte Remido <onboarding@resend.dev>';

    await this.resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });
  }
}
