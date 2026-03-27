import { redirect } from "next/navigation"
import { TRAINING_URL } from "@/lib/utils/constants"

export default function TrainingPage() {
  redirect(TRAINING_URL)
}
