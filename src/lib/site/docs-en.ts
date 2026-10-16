import type { DocStep } from "./docs";

/**
 * Documentação em inglês. O app ainda é só em português: os nomes de botões aparecem como
 * estão na tela, com o sentido em inglês entre parênteses na primeira menção.
 */

export const DOC_FLOW_EN = ["Project", "Survey", "Scaled view", "Damage", "Priority", "Budget", "Report"];

export const DOC_STEPS_EN: DocStep[] = [
  {
    id: "conta",
    title: "Create your account and log in",
    lead: "Each firm has its own organisation in ArchRay. Whoever creates the account becomes the administrator and then invites the team.",
    steps: [
      "Click Start free (or Sign up) at the top of the site.",
      "Enter your name, your firm's name, your email and a password.",
      "Done: you land on the home screen, with the project search and the shortcut to the guided demo.",
    ],
    shot: { src: "/docs/01-inicio.jpg", alt: "ArchRay home screen with the project search and the guided demo card", caption: "Home screen: search for a project, create a new one or start the guided demo." },
    tips: ["Were you invited? Use the invitation link: the account joins the right organisation automatically.", "Forgot your password? Use Esqueci minha senha (Forgot my password) on the login screen."],
  },
  {
    id: "projeto",
    title: "Register the project (the building)",
    lead: "A project is the building: a house, an apartment block, a church, a warehouse. Everything you do is stored inside it.",
    steps: [
      "Click Novo (New) in the left-hand menu.",
      "Fill in the name, the building type and the address. Heritage protection and period are optional.",
      "Save and register the areas: the parts of the building, such as the main facade, ground floor or roof. There are shortcuts with the typical areas.",
    ],
    shot: { src: "/docs/02-novo-projeto.jpg", alt: "New project form", caption: "New project: name, type and address are enough to start." },
    tips: ["Areas help organise the budget: the dashboard shows the cost of each area separately."],
  },
  {
    id: "painel",
    title: "Understand the project dashboard and surveys",
    lead: "The dashboard is the building's page. It brings together the numbers from all views, and it is where you create views and generate the report.",
    steps: [
      "At the top: Editar ficha (Edit details), Nova vista (New view) and Gerar laudo (Generate report).",
      "The cards show damages recorded, affected area, cracks, budget and how many damages have immediate priority.",
      "Under Vistorias (Surveys), create one survey for each visit to the building (e.g. Initial survey). It groups the views, damages and photos from that date.",
    ],
    shot: { src: "/docs/03-painel.jpg", alt: "Project dashboard with indicators, views and surveys", caption: "Project dashboard: indicators at the top, views on the left, surveys on the right." },
    tips: ["Use the survey filter (All / survey name) to see the numbers for a single visit — and generate its report."],
  },
  {
    id: "retificar",
    title: "Turn a facade photo into a scaled view",
    lead: "An ordinary photo has perspective: nothing can be measured in it. Rectifying means correcting the perspective and putting the image to scale, so every pixel is worth a real measurement.",
    steps: [
      "Photograph the facade as straight-on as possible, with the whole wall in frame.",
      "On the project dashboard, click Nova vista (New view) and choose Fachada (rectified photo).",
      "Choose the photo. Drag the 4 white points to the 4 corners of a real rectangle on the wall: the whole facade, a large window or a panel.",
      "Measure that same rectangle's width and height with a tape and enter the values in metres.",
      "Use the magnifier (it appears while dragging a point) and the arrow keys for fine adjustment: each point exactly on its corner.",
      "For reports, turn on professional precision: mark a check measurement (a door measured with a tape) and 2 or 3 straight lines (cornice, vertical edge) to correct the lens. The panel shows the real error in cm and the estimated precision.",
      "Check the preview. Choose Só o retângulo (rectangle only) or Parede inteira (whole wall — the view extends beyond the rectangle; adjust the margins).",
      "Click Retificar e abrir no editor (Rectify and open in the editor). The image comes out flat, to scale, and opens ready for marking damage.",
    ],
    shot: { src: "/docs/04-retificar.jpg", alt: "Rectification screen with the four corners marked on the church photo", caption: "Corners on the facade, a straight line for the lens (blue), a check measurement (yellow) and the estimated precision." },
    tips: [
      "The estimated precision (95% confidence) is stored with the view and goes into the report. With a check measurement it stops being an estimate and becomes a measurement.",
      "Extra control points (5 or more in total) enable a least-squares fit and show the error at each point — useful for long facades.",
      "The more straight-on the photo, the better the result. Very oblique photos lose detail on the far side.",
      "Have a plan, a section or a ready orthophoto (drone, photogrammetry)? Use Planta baixa (Plan) or Imagem em escala (Scaled image) instead of Fachada.",
    ],
    issues: [
      { q: "The image came out skewed or stretched.", a: "A point was off its real corner, or width and height were swapped. Go back, adjust the points and check the measurements." },
      { q: "Canopies and eaves look shifted.", a: "That is expected: the correction applies to the plane of the wall. Projecting elements end up slightly out of place." },
    ],
  },
  {
    id: "danos",
    title: "Mark the damage on the view",
    lead: "Each damage is drawn on the image as an area, a line or a point. Measurements come out on their own, in m², metres or units.",
    steps: [
      "In the damage library on the left, choose the type: crack, damp, render loss, soiling, plant growth…",
      "Areas and lines: click to place points around the damage. Double-click or Enter finishes; Backspace undoes the last point; Esc cancels.",
      "Points (such as plants or bird droppings): one click marks each occurrence.",
      "Click a damage to edit its type, severity, cause and recommendation, or drag the white vertices to adjust the drawing.",
    ],
    shot: { src: "/docs/05-editor.jpg", alt: "Damage map editor with the library, the facade and the budget panel", caption: "Editor: library on the left, the view in the middle, quantities and budget on the right." },
    tips: [
      "The mouse wheel zooms; dragging with the left button (or space + drag) pans the image.",
      "The buttons at the top collapse the library and the budget panel so the image fills the whole screen.",
    ],
  },
  {
    id: "contorno-ia",
    title: "Outline stains with AI",
    lead: "AI outlining (Contorno IA) draws the damage for you in one click. It runs in your browser: nothing is sent anywhere and there is no cost.",
    steps: [
      "Choose an area damage in the library and click the wand (Contorno IA) in the toolbar over the image.",
      "Mancha (Stain) mode follows colour — ideal for damp, soiling, biodeterioration and peeling paint. Elemento (Element) mode uses the segmentation AI — ideal for damage with sharp edges, such as gaps, render loss and glass.",
      "Click on the damage. Click again to add more parts; Shift + click removes what is not damage.",
      "In Stain mode, adjust the tolerance (or use the − and + keys) until the outline is tight. Click Salvar dano (Save damage) or press Enter.",
    ],
    shot: { src: "/docs/07-contorno-ia.jpg", alt: "AI outlining in Stain mode tracing peeling paint", caption: "Stain mode: one click on the peeling paint and the outline is ready; tolerance adjusts the reach." },
    tips: ["Zoom in before clicking: the AI analyses the visible part of the image, so more zoom means more detail.", "The first time, Element mode downloads the AI model (a few MB). After that it stays cached in the browser."],
  },
  {
    id: "gut",
    title: "Set the priority (GUT matrix)",
    lead: "Not everything needs treating now. The GUT matrix multiplies Severity × Urgency × Trend and tells you what comes first.",
    steps: [
      "Click a damage (on the image or in the list on the right).",
      "Choose the severity (Gravidade, low to critical), the urgency (Urgência, 1 to 5) and the trend (Tendência, 1 to 5).",
      "ArchRay computes a score from 1 to 125 and its band: 64 and above is priority 1 (immediate); 27 to 63, short term; 12 to 26, medium term; below 12, monitor.",
    ],
    shot: { src: "/docs/06-dano-gut.jpg", alt: "A damage's panel with severity, urgency, trend, GUT and cost", caption: "Selected damage: GUT 64 = priority 1, with the treatment cost just below." },
    tips: ["The dashboard's priority list and the report's table follow the GUT score, highest first."],
  },
  {
    id: "orcamento",
    title: "Adjust the price table and read the budget",
    lead: "Each damage type has a treatment and a price. The budget is measured quantity × price — automatic, while you draw.",
    steps: [
      "Open Danos e preços (Damage and prices) in the menu.",
      "For each damage type, check the treatment, the value and the unit (m² for areas, metre for lines, unit for points).",
      "Change whatever you need and save. The table applies to all of the firm's projects.",
    ],
    shot: { src: "/docs/08-precos.jpg", alt: "The firm's damage and price table", caption: "Damage and prices: treatment, value and unit for each damage type." },
    tips: ["Values marked as suggested are only a starting point. Review them before sending a budget to a client."],
  },
  {
    id: "laudo",
    title: "Generate the report, the drawing and the DXF",
    lead: "Once the damage is marked, the documents come out ready — nothing to assemble in a word processor or in CAD.",
    steps: [
      "Report: on the project dashboard, click Gerar laudo (Generate report). The PDF (A4) includes a cover, identification, methodology, each view with its damage, the table by GUT priority, the budget and space for a signature.",
      "PDF drawing (A3): in the editor, click Prancha PDF — the view with hatching, legend, quantities, graphic scale and title block.",
      "DXF: in the editor, click DXF. It comes in metres, one layer per damage type, with the background image (keep the ZIP's files in the same folder).",
    ],
    shot: { src: "/docs/11-painel-acoes.jpg", alt: "Edit details, New view and Generate report buttons", caption: "Gerar laudo (Generate report) is at the top of the project dashboard." },
    tips: ["Add your professional registration (CAU or CREA in Brazil) in Meu perfil (My profile) so it appears in the report and on the drawings' title block."],
  },
  {
    id: "campo",
    title: "Take field photos with your phone",
    lead: "During the visit, the team records detail photos with a phone, inside the survey. It works even without signal.",
    steps: [
      "Open the project on your phone and, in the survey, tap Fotos com o celular (Phone photos) — or Enviar fotos (Upload photos) to choose from the gallery.",
      "Photograph damage details and walls straight-on — those can become rectified views later.",
      "Photos are stored on the device and uploaded in the background. If the signal drops, the upload resumes when it comes back.",
    ],
    tips: ["On iPhone, keep the page open and the screen on until everything has uploaded.", "The camera warns you when a photo is blurry."],
  },
  {
    id: "equipe",
    title: "Invite your team",
    lead: "Each person joins with the right role, and only the administrator manages the team.",
    steps: [
      "Open Equipe (Team) in the menu and invite by email.",
      "Choose the role: Administrator (everything), Technician (creates projects, marks damage, edits prices and generates reports), Field team (only uploads photos) or Viewer (only views and downloads).",
      "The person receives the invitation link and creates their own password.",
    ],
    shot: { src: "/docs/09-equipe.jpg", alt: "Team screen with invitations and roles", caption: "Team: invitations, roles and access." },
  },
  {
    id: "demonstracao",
    title: "Practise with the guided demo",
    lead: "The best way to learn is by doing. The guided demo takes you through the whole workflow on a real case — the Carmo Church in Horta (Azores) — in 13 missions.",
    steps: [
      "On the app's home screen, click Aprenda na prática: demonstração guiada (Learn by doing: guided demo) — or Ajuda › Demonstração guiada.",
      "ArchRay creates a demo project with the real 2010 photo. A panel shows the current mission and highlights the right button on each screen.",
      "Each mission only counts when you actually do it: place the corners, correct the lens, check the scale on the central door, rectify, mark damage, use the AI, set the GUT, look at the prices and generate the report. Each one is worth XP.",
      "At the end, click Refazer do zero (Start over): everything done in the demo is erased and you start again from mission 1 — as many times as you like.",
    ],
    shot: { src: "/docs/10-missoes.jpg", alt: "Guided demo missions panel over the editor", caption: "Mission 8 of 13: the panel explains what to do and highlights the AI outlining wand." },
    tips: ["The demo doesn't touch your other projects. You can leave at any time (the panel's X) and come back later."],
  },
];

export const DOC_GLOSSARY_EN: { term: string; def: string }[] = [
  { term: "Project", def: "The building: house, apartment block, church, warehouse." },
  { term: "Area", def: "A part of the building: north facade, ground floor, roof, nave…" },
  { term: "Survey", def: "A visit to the building on a given date. It groups that day's views, damages and photos." },
  { term: "View", def: "The scaled image where damage is marked: rectified facade, plan or scaled image." },
  { term: "Rectify", def: "Correct a photo's perspective and put it to real scale." },
  { term: "mm/pixel", def: "The view's scale: how many real millimetres each pixel of the image represents." },
  { term: "GUT matrix", def: "Severity × Urgency × Trend, from 1 to 125. Sets each damage's priority." },
  { term: "Drawing (prancha)", def: "The A3 PDF sheet with the view, the hatched damage, the legend and the title block." },
  { term: "DXF", def: "Drawing file for AutoCAD and other CAD programs." },
];

export const DOC_FAQ_EN: { q: string; a: string }[] = [
  { q: "Do I need to install anything?", a: "No. ArchRay runs in the browser, on computers and phones — including the AI outlining." },
  { q: "Do I need a drone or a laser scanner?", a: "No. A phone photo and a tape measure are enough for a rectified facade. If you already have an orthophoto or a 3D model, you can use those too." },
  { q: "Are the measurements reliable?", a: "They depend on the photo and the tape measurement used for rectification. Add a check measurement: the real error appears in cm, and the precision goes into the report." },
  { q: "Are the suggested prices an official table?", a: "No. They are starting values to get you going. Adjust them in Damage and prices for your region and your method." },
  { q: "Is the app available in English?", a: "The site and the documentation are. The app itself is currently in Portuguese — the button names in this guide appear as they are on screen, with the English meaning in parentheses." },
  { q: "Can other firms see my data?", a: "No. Each organisation can only access its own projects." },
];
