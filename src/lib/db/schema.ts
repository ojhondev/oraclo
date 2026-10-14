import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  bigint,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/* ───────────────────────── Conta ───────────────────────── */

export const roleEnum = pgEnum("role", ["admin", "tecnico", "campo", "leitor"]);
export type Role = (typeof roleEnum.enumValues)[number];

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("ateliê"),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("tecnico"),
  /** Registro profissional (CAU/CREA) — vai no carimbo das pranchas. */
  professionalId: text("professional_id"),
  /** Quando concluiu (ou pulou) o tour guiado do primeiro acesso. */
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

/* ───────────────────────── Bens ───────────────────────── */

export const siteKindEnum = pgEnum("site_kind", [
  "igreja", "capela", "convento", "casarao", "edificio_publico", "conjunto", "monumento", "outro",
]);
export const protectionEnum = pgEnum("protection_level", [
  "federal", "estadual", "municipal", "em_estudo", "nenhuma",
]);

/** Bem patrimonial (igreja, casarão, conjunto…). */
export const sites = pgTable("sites", {
  id: id(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: siteKindEnum("kind").notNull().default("igreja"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  lat: real("lat"),
  lng: real("lng"),
  protection: protectionEnum("protection").notNull().default("nenhuma"),
  /** Órgão de proteção (IPHAN, CONDEPHAAT, IEPHA, INEPAC, IPAC…). */
  protectionBody: text("protection_body"),
  processNumber: text("process_number"),
  period: text("period"),
  description: text("description"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sites_org_idx").on(t.orgId)]);

export const elementKindEnum = pgEnum("element_kind", [
  "fachada", "interior", "cobertura", "torre", "elemento_artistico", "terreno", "outro",
]);

/** Parte do bem: fachada principal, nave, sacristia, retábulo-mor… */
export const elements = pgTable("elements", {
  id: id(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: elementKindEnum("kind").notNull().default("fachada"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("elements_site_idx").on(t.siteId)]);

/* ───────────────────────── Captura ───────────────────────── */

export const purposeEnum = pgEnum("campaign_purpose", ["levantamento", "monitoramento", "obra", "outro"]);

/** Ida a campo em uma data — agrupa as capturas daquele dia/objetivo. */
export const campaigns = pgTable("campaigns", {
  id: id(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  purpose: purposeEnum("purpose").notNull().default("levantamento"),
  date: date("date").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("campaigns_site_idx").on(t.siteId)]);

export const captureModeEnum = pgEnum("capture_mode", ["fotos", "video", "lidar", "drone", "laser"]);
export const captureStatusEnum = pgEnum("capture_status", [
  "rascunho", "enviando", "na_fila", "processando", "concluida", "falhou",
]);
export type CaptureStatus = (typeof captureStatusEnum.enumValues)[number];

export const captures = pgTable("captures", {
  id: id(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  elementId: uuid("element_id").references(() => elements.id, { onDelete: "set null" }),
  mode: captureModeEnum("mode").notNull().default("fotos"),
  status: captureStatusEnum("status").notNull().default("rascunho"),
  device: text("device"),
  fileCount: integer("file_count").notNull().default(0),
  totalBytes: bigint("total_bytes", { mode: "number" }).notNull().default(0),
  /** Itens do roteiro de campo marcados (alvos posicionados, luz, etc.). */
  checklist: jsonb("checklist").$type<Record<string, boolean>>(),
  notes: text("notes"),
  /** Quando a equipe de campo concluiu e mandou para processamento. */
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("captures_campaign_idx").on(t.campaignId)]);

export const fileKindEnum = pgEnum("file_kind", ["foto", "video", "nuvem", "pontos_gnss", "outro"]);

/** Arquivo bruto enviado (no R2; aqui só metadados). */
export const captureFiles = pgTable("capture_files", {
  id: id(),
  captureId: uuid("capture_id").notNull().references(() => captures.id, { onDelete: "cascade" }),
  kind: fileKindEnum("kind").notNull().default("foto"),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  bytes: bigint("bytes", { mode: "number" }).notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  /** Nota de nitidez 0–1 calculada no celular/servidor; baixa = descartar. */
  sharpness: real("sharpness"),
  url: text("url"),
  contentType: text("content_type"),
  /** Volta do roteiro: 1 = de longe (conjunto), 2 = de perto (detalhes). */
  pass: integer("pass"),
  /** Id gerado no celular — evita registrar a mesma foto duas vezes ao retomar o envio. */
  clientId: text("client_id"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("capture_files_capture_idx").on(t.captureId), uniqueIndex("capture_files_client_idx").on(t.captureId, t.clientId)]);

/** Medida de trena entre dois alvos — dá escala e mede o erro do modelo. */
export const controlDistances = pgTable("control_distances", {
  id: id(),
  captureId: uuid("capture_id").notNull().references(() => captures.id, { onDelete: "cascade" }),
  targetA: text("target_a").notNull(),
  targetB: text("target_b").notNull(),
  measuredMm: integer("measured_mm").notNull(),
  /** Preenchidos pelo processamento. */
  modelMm: integer("model_mm"),
  residualMm: integer("residual_mm"),
});

/* ───────────────────────── Processamento ───────────────────────── */

export const jobStageEnum = pgEnum("job_stage", [
  "triagem", "alinhamento", "escala", "nuvem_densa", "malha", "splat", "otimizacao", "concluido",
]);
export const jobStatusEnum = pgEnum("job_status", ["na_fila", "rodando", "concluido", "falhou"]);

export const processingJobs = pgTable("processing_jobs", {
  id: id(),
  captureId: uuid("capture_id").notNull().references(() => captures.id, { onDelete: "cascade" }),
  stage: jobStageEnum("stage").notNull().default("triagem"),
  status: jobStatusEnum("status").notNull().default("na_fila"),
  progress: integer("progress").notNull().default(0),
  gpuSeconds: integer("gpu_seconds").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0),
  error: text("error"),
  log: text("log"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const outputKindEnum = pgEnum("output_kind", ["nuvem", "malha", "splat", "ortofoto", "dxf", "pdf"]);

/** Produto gerado ou importado (nuvem E57/LAS/COPC, malha GLB, DXF, PDF…). */
export const outputs = pgTable("outputs", {
  id: id(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  captureId: uuid("capture_id").references(() => captures.id, { onDelete: "set null" }),
  kind: outputKindEnum("kind").notNull(),
  format: text("format").notNull(),
  name: text("name").notNull(),
  storageKey: text("storage_key").notNull(),
  url: text("url"),
  bytes: bigint("bytes", { mode: "number" }).notNull().default(0),
  pointCount: bigint("point_count", { mode: "number" }),
  /** Sistema de coordenadas (EPSG), ex.: 31983 = SIRGAS 2000 / UTM 23S. */
  epsg: integer("epsg"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
}, (t) => [index("outputs_site_idx").on(t.siteId)]);

export const qualityReports = pgTable("quality_reports", {
  id: id(),
  captureId: uuid("capture_id").notNull().references(() => captures.id, { onDelete: "cascade" }),
  photosUsed: integer("photos_used").notNull().default(0),
  photosDiscarded: integer("photos_discarded").notNull().default(0),
  reprojectionErrorPx: real("reprojection_error_px"),
  rmsResidualMm: real("rms_residual_mm"),
  maxResidualMm: real("max_residual_mm"),
  /** Selo "apto para levantamento cadastral" (erro ≤ 30 mm). */
  approved: boolean("approved").notNull().default(false),
  createdAt: createdAt(),
});

/* ───────────────────────── Ortofotos e danos ───────────────────────── */

export const orthophotos = pgTable("orthophotos", {
  id: id(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  elementId: uuid("element_id").references(() => elements.id, { onDelete: "set null" }),
  outputId: uuid("output_id").references(() => outputs.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  /** Plano de projeção no sistema do modelo: origem, normal e eixo "para cima". */
  plane: jsonb("plane").$type<{ origin: number[]; normal: number[]; up: number[] }>(),
  /** Escala da imagem. Nulo = ainda não calibrada (sem áreas/comprimentos). */
  mmPerPixel: real("mm_per_pixel"),
  /** Calibração feita no editor: dois pontos (px) e a distância real entre eles. */
  calibration: jsonb("calibration").$type<{ a: [number, number]; b: [number, number]; meters: number }>(),
  widthPx: integer("width_px").notNull(),
  heightPx: integer("height_px").notNull(),
  /** Imagem (JPG/PNG) no object storage. */
  url: text("url").notNull(),
  storageKey: text("storage_key"),
  contentType: text("content_type").notNull().default("image/jpeg"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("orthophotos_site_idx").on(t.siteId)]);

export const geometryKindEnum = pgEnum("geometry_kind", ["area", "linha", "ponto"]);
export type GeometryKind = (typeof geometryKindEnum.enumValues)[number];

/** Biblioteca de danos. orgId nulo = padrão do Oraclo; com orgId = personalizado. */
export const damageTypes = pgTable("damage_types", {
  id: id(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
  /** Hachura usada na prancha e na camada DXF. */
  pattern: text("pattern").notNull().default("solido"),
  geometry: geometryKindEnum("geometry").notNull().default("area"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("damage_types_org_idx").on(t.orgId)]);

export const severityEnum = pgEnum("severity", ["baixa", "media", "alta", "critica"]);

export const damages = pgTable("damages", {
  id: id(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  orthophotoId: uuid("orthophoto_id").references(() => orthophotos.id, { onDelete: "cascade" }),
  elementId: uuid("element_id").references(() => elements.id, { onDelete: "set null" }),
  typeId: uuid("type_id").notNull().references(() => damageTypes.id, { onDelete: "restrict" }),
  /** Coordenadas em pixels da ortofoto ([x,y][]); ponto 3D opcional no modelo. */
  geometry: jsonb("geometry").$type<{ points: [number, number][]; point3d?: [number, number, number] }>(),
  severity: severityEnum("severity").notNull().default("media"),
  areaM2: real("area_m2"),
  lengthM: real("length_m"),
  cause: text("cause"),
  recommendation: text("recommendation"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("damages_site_idx").on(t.siteId)]);

/* ───────────────────────── Convites e senhas ───────────────────────── */

/** Convite para entrar numa organização. Guarda só o hash do token enviado no link. */
export const invitations = pgTable("invitations", {
  id: id(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("tecnico"),
  tokenHash: text("token_hash").notNull(),
  invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("invitations_org_idx").on(t.orgId), uniqueIndex("invitations_token_idx").on(t.tokenHash)]);

/** Pedido de redefinição de senha (link de uso único, expira em 1 hora). */
export const passwordResets = pgTable("password_resets", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("password_resets_token_idx").on(t.tokenHash), index("password_resets_user_idx").on(t.userId)]);
