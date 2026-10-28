import { redirect } from "next/navigation";

/** La vecchia pagina di firma: con la bacheca si firma tutto da /b/[slug]; i vecchi link portano lì. */
export default async function PaginaFirmaBiglietto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/b/${slug}`);
}
