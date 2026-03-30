"use client";

import { useActionState } from "react";
import PhoneInput from "@/components/shared/phone-input";
import { submitTrainingRequest, type ContactFormState } from "@/lib/actions/contact-forms";

const initialState: ContactFormState = { success: false };

export default function TrainingForm({ className, inputClassName, buttonClassName, disclaimerClassName }: {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  disclaimerClassName?: string;
}) {
  const [state, formAction, isPending] = useActionState(submitTrainingRequest, initialState);

  if (state.success) {
    return (
      <div className={className}>
        <p style={{ color: "#5b328a", fontWeight: 600, fontSize: "1.1rem" }}>
          Заявка отправлена! Мы свяжемся с вами для записи на курс.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={className}>
      <input type="text" name="name" placeholder="Имя" required className={inputClassName} />
      <PhoneInput name="phone" required className={inputClassName} />
      {state.error && <p style={{ color: "#e6610d", fontSize: "0.9rem" }}>{state.error}</p>}
      <button type="submit" className={buttonClassName} disabled={isPending}>
        {isPending ? "Отправка..." : "Записаться на курс"}
      </button>
      <p className={disclaimerClassName}>
        Нажимая на кнопку, вы принимаете{" "}
        <a href="/Политика конфиденциальности.pdf" target="_blank" rel="noopener noreferrer">
          политику конфиденциальности
        </a>{" "}
        и{" "}
        <a href="/Политика обработки персональных данных пользователей сайта.pdf" target="_blank" rel="noopener noreferrer">
          правила обработки персональных данных
        </a>
      </p>
    </form>
  );
}
