import { getCompanyById } from "@/lib/actions/companies"
import { CompanyForm } from "@/components/dashboard/company-form"
import { notFound } from "next/navigation"

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getCompanyById(id)

  if (!company) notFound()

  return (
    <CompanyForm
      mode="edit"
      companyId={company.id}
      defaultValues={{
        name: company.name,
        inn: company.inn,
        kpp: company.kpp ?? "",
        ogrn: company.ogrn ?? "",
        legal_address: company.legal_address ?? "",
        actual_address: company.actual_address ?? "",
        bank_name: company.bank_name ?? "",
        bik: company.bik ?? "",
        correspondent_account: company.correspondent_account ?? "",
        settlement_account: company.settlement_account ?? "",
        contact_person: company.contact_person ?? "",
        contact_phone: company.contact_phone ?? "",
        contact_email: company.contact_email ?? "",
      }}
    />
  )
}
