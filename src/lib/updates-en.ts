import type { Post } from "./updates";

/** Index em inglês: as mesmas publicações (mesmo slug e data), traduzidas. */
export const POSTS_EN: Post[] = [
  {
    slug: "deteccao-automatica-de-danos",
    title: "Automatic damage detection: the AI suggests, you decide",
    summary:
      "One click and the AI scans the facade for cracks, stains, biological growth, render loss and efflorescence. You review every suggestion, and every damage now records where it came from and who validated it.",
    date: "2026-11-01",
    category: "Product",
    banner: "New: automatic damage detection — the AI suggests, you accept or reject.",
    intro: [
      "Until now ArchRay's AI worked on request: you clicked a stain and it traced the outline. Now it can also make the first pass on its own. One click scans the whole view and returns dashed suggestions over the image.",
      "The principle stays the same: the AI proposes, the professional decides. No suggestion reaches the budget, the quantities or the report until someone on the team accepts it.",
    ],
    sections: [
      {
        id: "como-usar",
        title: "How to use it",
        blocks: [
          { p: "In the damage map editor, use the new Detect damage button on the toolbar over the image. The analysis runs in your browser and takes a few seconds. When it finishes, the suggestions appear dashed on the image and listed in the right panel, most confident first." },
          {
            list: [
              "Click a suggestion to zoom in and see what the detector found.",
              "Enter accepts it as damage, Delete rejects it, and the next suggestion opens by itself.",
              "If the class is wrong (moisture instead of soiling, for example), change it before accepting.",
              "The minimum confidence control hides the more doubtful suggestions.",
            ],
          },
          { callout: "A suggestion is not a damage. It becomes one only after you accept it, and from then on it works like any other: editable vertices, GUT, cost and report." },
        ],
      },
      {
        id: "o-que-detecta",
        title: "What it looks for",
        blocks: [
          {
            table: {
              head: ["Damage", "What the detector looks at"],
              rows: [
                ["Crack", "A thin line darker than the wall on both sides; straight joints, mouldings and wires are discarded"],
                ["Moisture and soiling", "A mottled stain darker than clean render; position and colour set the class"],
                ["Biological growth and vegetation", "Greenish areas that stand out from the wall; painted doors and windows are discarded"],
                ["Render loss", "Exposed masonry, reddish compared with the render"],
                ["Efflorescence", "Light, colourless stains on the wall"],
              ],
              caption: "Openings (windows and doors) are recognised and left out of the analysis.",
            },
          },
          { p: "This first version uses classic computer vision, not a trained model. It works best on rectified facades with light render and makes more mistakes on very dark materials, strong textures and shadows. That is why each suggestion shows a confidence: an estimate from the detector, not a measured accuracy." },
        ],
      },
      {
        id: "rastreabilidade",
        title: "Every damage knows where it came from",
        blocks: [
          { p: "Every damage now records its origin (manual drawing, AI outline or automatic detection), the AI confidence when there is one, who validated it and when. This shows in the damage panel, and the report includes an automatic statement of how many damages had AI support and that all of them were reviewed by the professional in charge." },
          { p: "Authorship and technical responsibility stay with whoever signs the report. The AI maps what is visible in the image and does not replace tests, surveys or structural analysis." },
        ],
      },
      {
        id: "custo-zero",
        title: "No cost, no images sent out",
        blocks: [
          { p: "Detection runs entirely in the browser, like rectification and the AI outline. Images are not sent to any external AI service, and there is no charge per processed facade." },
        ],
      },
      {
        id: "treinar",
        title: "An AI that learns from restoration",
        blocks: [
          { p: "Every suggestion accepted, corrected or rejected is an example of what is, and what is not, damage on Brazilian heritage. Team now has an option to allow these examples to train the next version of the AI. It is off by default and only counts with an administrator's yes. The goal is to train our own segmentation model, tuned to local materials and mortars, that still runs in the browser." },
        ],
      },
    ],
    author: "The ArchRay team",
    notes: [
      "Automatic detection is a support tool. Review every suggestion before accepting it; whatever is accepted goes into the budget and the report.",
      "Training permission can be revoked at any time under Team; from then on the organisation's data stops entering the training base.",
    ],
  },
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
