import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Expertise } from "@/components/expertise"
import { Projects } from "@/components/projects"
import { TestLab } from "@/components/test-lab"
import { Artifacts } from "@/components/artifacts"
import { Experience } from "@/components/experience"
import { Contact } from "@/components/contact"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Expertise />
        <Projects />
        <TestLab />
        <Artifacts />
        <Experience />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  )
}
