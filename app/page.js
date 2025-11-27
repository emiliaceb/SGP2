"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import ProvidersSection from "@/components/providers/providers-section"
import OrdersSection from "@/components/orders/orders-section"
import ProductsSection from "@/components/products/products-section"
import TechniciansSection from "@/components/technicians/technicians-section"
import RatingsSection from "@/components/ratings/ratings-section"
import ReportsSection from "@/components/Reports/Reports-section"
import InformationSection from "@/components/Information/Information-section"
import ReclamosSection from "@/components/reclamos/reclamos-section"
import IntervencionSection from "@/components/Intervencion/Intervencion-section"
import ContratosSection from "@/components/contratos/contratos-section"

export default function Home() {
  const [activeSection, setActiveSection] = useState("proveedores")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "proveedores" && <ProvidersSection />}
          {activeSection === "ordenes" && <OrdersSection />}
          {activeSection === "productos" && <ProductsSection />}
          {activeSection === "tecnicos" && <TechniciansSection />}
          {activeSection === "calificaciones" && <RatingsSection />}
          {activeSection === "reportes" && <ReclamosSection />}
          {activeSection === "intervencion" && <IntervencionSection />}
          {activeSection === "contratos" && <ContratosSection />}
          {activeSection === "informes" && <InformationSection />}
        </main>
      </div>
    </div>
  )
}
