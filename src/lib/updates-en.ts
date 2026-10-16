import type { Post } from "./updates";

/** Index em inglês: as mesmas publicações (mesmo slug e data), traduzidas. */
export const POSTS_EN: Post[] = [
  {
    slug: "archray-mapa-de-danos-com-ia",
    title: "ArchRay: from damage pointed out to report ready",
    summary:
      "Oraclo is now ArchRay. Rectified facades from a single photo, automatic budgets, GUT priority, a project dashboard, PDF reports and a cleaner workspace.",
    date: "2026-10-15",
    category: "Product",
    banner: "Oraclo is now ArchRay — see everything that changed on the platform.",
    intro: [
      "Putting together a damage map with quantities, a budget and a report usually takes days: photos in a folder, drawings in CAD, sums in a spreadsheet and the final text in a word processor. Every hand-off from one program to the next is a chance for errors and rework.",
      "Over the last few weeks we rebuilt the platform around a simple idea: the building appears on screen, you point out the damage on top of it, and the rest — measurements, cost, priority and report — comes out on its own. Along with this change, the product got a new name: ArchRay.",
    ],
    sections: [
      {
        id: "novo-nome",
        title: "A new name for a new focus",
        blocks: [
          { p: "Oraclo started as a 3D survey and BIM modelling platform. Testing made it clear that the value was somewhere else: in the diagnosis. People working in restoration, retrofit and building inspection need to know what is damaged, how much it costs to treat and what to do first — and they need it in a document the client understands." },
          { p: "ArchRay brings together architecture (arch) and the gaze that goes beneath the surface (ray). Your address and your account stay the same; nothing needs to be redone." },
          { callout: "ArchRay is a visual diagnosis hub for existing buildings: you point, the platform measures, prices, prioritises and documents." },
        ],
      },
      {
        id: "fachada-retificada",
        title: "A facade to scale from an ordinary photo",
        blocks: [
          { p: "The new Facade view turns a phone photo into a flat, scaled image. You drag four points to the corners of a real rectangle on the wall — the whole facade, a large window, a panel — and enter the width and height measured with a tape. The perspective correction happens right in the browser, with nothing sent off for processing and at no cost." },
          { p: "Besides the rectified facade, there are two more kinds of view:" },
          {
            list: [
              "Plan: floor plans, sections and elevations as images, calibrated in the editor against a known dimension.",
              "Scaled image: ready-made orthophotos from drones, photogrammetry or laser scanning, with the mm per pixel entered on upload.",
            ],
          },
          { p: "Each view belongs to a survey (a visit on a given date) and, optionally, to an area of the building, so you can come back to the same building months later and compare." },
        ],
      },
      {
        id: "orcamento",
        title: "Automatic treatment budget",
        blocks: [
          { p: "The old damage library became Damage and prices. Each damage type now has a recommended treatment and a unit price, editable by the firm. The unit follows the shape of the damage: areas are priced per m², lines (such as cracks) per metre and points per unit." },
          { p: "In the editor, the cost of each damage and the view's budget appear in real time as you draw. The default values are marked as suggested and are only a starting point — adjust them to your region and your method." },
          {
            table: {
              head: ["Damage shape", "Measured quantity", "Price unit"],
              rows: [
                ["Area", "m² of the drawn region", "R$/m²"],
                ["Line", "length in metres", "R$/m"],
                ["Point", "number of occurrences", "R$/unit"],
              ],
              caption: "The budget is the measured quantity multiplied by the treatment's unit price.",
            },
          },
        ],
      },
      {
        id: "gut",
        title: "Priority with the GUT matrix",
        blocks: [
          { p: "Besides severity, each damage gets an urgency and a trend score. The product of the three (from 1 to 125) sets the priority, with fixed bands so that two technicians reach the same conclusion:" },
          {
            table: {
              head: ["GUT", "Priority"],
              rows: [
                ["64 to 125", "Immediate"],
                ["27 to 63", "Short term"],
                ["12 to 26", "Medium term"],
                ["1 to 11", "Monitor"],
              ],
            },
          },
          { p: "Severity ranges from 2 (low) to 5 (critical); urgency and trend go from 1 to 5." },
        ],
      },
      {
        id: "painel",
        title: "A dashboard for every project",
        blocks: [
          { p: "The project page became a diagnosis dashboard. At the top, the indicators: number of damages, affected area, crack length, total budget and how many damages have immediate priority. Below them, the view thumbnails, charts of cost by damage type, priority and severity, cost by area of the building and the priority list — each row opens the damage directly in its view." },
          { p: "A survey filter shows the numbers for a specific visit, and the Generate report button produces the document for that selection." },
        ],
      },
      {
        id: "laudo",
        title: "Condition report in PDF",
        blocks: [
          { p: "The report comes out ready, in A4, to hand to the client:" },
          {
            list: [
              "Cover with the main indicators.",
              "Building identification and methodology.",
              "Diagnosis summary and breakdown by priority.",
              "Each view with the damage drawn and the legend.",
              "Damage table sorted by GUT, with cause and recommendation.",
              "Budget by treatment and space for the responsible professional's signature.",
            ],
          },
          { p: "A3 PDF drawings and DXF export for CAD remain available in each view." },
        ],
      },
      {
        id: "area-de-trabalho",
        title: "A cleaner workspace",
        blocks: [
          { p: "In the damage map editor, the damage library and the budget panel can now be collapsed, like the sidebar. With everything collapsed, the image fills the whole screen; one click brings each panel back, and the editor remembers your choice." },
          { p: "We also simplified the navigation: Projects, Damage maps, Damage and prices and Team. The screens tied to the old BIM and photogrammetry workflow, which were no longer part of the product, are gone." },
        ],
      },
      {
        id: "campo",
        title: "Field photos and 3D models",
        blocks: [
          { p: "In each survey you record detail photos with your phone. They are stored on the device and uploaded in the background: if the signal drops mid-visit, the upload resumes when the connection comes back. If you already have a 3D model (from a free phone app, a drone or a laser scanner), you can import it and generate scaled views of each wall." },
        ],
      },
      {
        id: "proximos-passos",
        title: "What comes next",
        blocks: [
          { p: "The next step is artificial intelligence in the drawing: click on a stain and get the outline ready, running right in the browser. After that come crack suggestions, comparison between surveys and custom damage types per firm." },
          { p: "If something doesn't work the way you expect, or something is missing from your workflow, use the Help button inside the platform." },
        ],
      },
    ],
    author: "The ArchRay team",
    notes: [
      "The default suggested prices are estimates to get you started with the platform, not a reference table. Review them in Damage and prices before sending budgets to clients.",
      "Four-point rectification corrects the plane of the wall. Canopies, eaves and other projecting elements may appear slightly shifted.",
    ],
  },
];
