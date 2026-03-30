"use server";

import { z } from "zod";
import nodemailer from "nodemailer";

const smtpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const serviceSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(5, "Введите номер телефона"),
  email: z.string().email("Введите корректный email").optional().or(z.literal("")),
  address: z.string().optional(),
});

const trainingSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(5, "Введите номер телефона"),
});

export type ContactFormState = {
  success: boolean;
  error?: string;
};

export async function submitServiceRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const { name, phone, email, address } = parsed.data;

  try {
    await smtpTransporter.sendMail({
      from: `"10кофе" <${process.env.SMTP_EMAIL}>`,
      to: "10coffee@mail.ru",
      subject: "Заявка на сервисное обслуживание",
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h2 style="margin-bottom:16px">Новая заявка на сервис</h2>
          <p><strong>Имя:</strong> ${name}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
          ${address ? `<p><strong>Адрес:</strong> ${address}</p>` : ""}
          <hr style="margin-top:24px;border:none;border-top:1px solid #eee"/>
          <p style="color:#999;font-size:12px">Отправлено с сайта 10coffee.ru</p>
        </div>
      `,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка. Попробуйте позже." };
  }
}

export async function submitTrainingRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = trainingSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const { name, phone } = parsed.data;

  try {
    await smtpTransporter.sendMail({
      from: `"10кофе" <${process.env.SMTP_EMAIL}>`,
      to: "10coffee@mail.ru",
      subject: "Заявка на обучение бариста",
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h2 style="margin-bottom:16px">Новая заявка на обучение</h2>
          <p><strong>Имя:</strong> ${name}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          <hr style="margin-top:24px;border:none;border-top:1px solid #eee"/>
          <p style="color:#999;font-size:12px">Отправлено с сайта 10coffee.ru</p>
        </div>
      `,
    });
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка. Попробуйте позже." };
  }
}
