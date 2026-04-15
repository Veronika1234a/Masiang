import type { BrowserContext, Route } from "@playwright/test";

type Role = "school" | "admin";

interface MockAccount {
  id: string;
  email: string;
  password: string;
  role: Role;
  approval_status: "pending" | "approved" | "rejected";
  school_name: string | null;
  npsn: string | null;
  contact_name: string | null;
  phone: string | null;
  address: string | null;
  education_level: string | null;
  principal_name: string | null;
  operator_name: string | null;
  district: string | null;
  avatar_path: string | null;
  created_at: string;
}

interface BookingRow {
  id: string;
  school_id: string;
  school_name: string;
  topic: string;
  category: string | null;
  date_iso: string;
  session: string;
  status: string;
  timeline: Array<Record<string, unknown>>;
  goal: string | null;
  notes: string | null;
  cancel_reason: string | null;
  rating: number | null;
  feedback: string | null;
  supervisor_notes: string | null;
  created_at: string;
}

interface DocumentRow {
  id: string;
  school_id: string;
  booking_id: string | null;
  history_id: string | null;
  file_name: string;
  storage_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  stage: string;
  review_status: string;
  reviewer_notes: string | null;
  version: number;
  parent_doc_id: string | null;
  uploaded_at: string;
  created_at: string;
}

interface HistoryRow {
  id: string;
  school_id: string;
  booking_id: string | null;
  date_iso: string;
  school_name: string;
  session: string;
  title: string;
  description: string;
  status: string;
  follow_up_iso: string | null;
  supervisor_notes: string | null;
  follow_up_done: boolean;
  follow_up_items: Array<Record<string, unknown>>;
  created_at: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

interface MockState {
  accounts: MockAccount[];
  bookings: BookingRow[];
  documents: DocumentRow[];
  histories: HistoryRow[];
  notifications: NotificationRow[];
  storagePaths: string[];
  counters: {
    notif: number;
    user: number;
  };
}

interface DelayRule {
  method?: string;
  pathIncludes: string;
  delayMs: number;
}

interface FailureRule {
  method?: string;
  pathIncludes: string;
  status: number;
  body: unknown;
  once: boolean;
}

function nowIso() {
  return new Date().toISOString();
}

function createAccount(overrides: Partial<MockAccount> & Pick<MockAccount, "id" | "email" | "password" | "role">): MockAccount {
  return {
    approval_status: "approved",
    school_name: null,
    npsn: null,
    contact_name: null,
    phone: null,
    address: null,
    education_level: "SMP",
    principal_name: "Ibu Kepala Sekolah",
    operator_name: "Operator Sekolah",
    district: "Tana Toraja",
    avatar_path: null,
    created_at: nowIso(),
    ...overrides,
  };
}

export function createBaseMockState(): MockState {
  return {
    accounts: [
      createAccount({
        id: "school-1",
        email: "school@example.com",
        password: "password123",
        role: "school",
        school_name: "SDN 1 Makale",
        npsn: "12345678",
        contact_name: "Sari Pateda",
        phone: "081234567890",
        address: "Jl. Pendidikan No. 1",
        education_level: "SD",
        principal_name: "Sari Pateda",
        operator_name: "Lina",
        district: "Makale",
      }),
      createAccount({
        id: "admin-1",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        school_name: "Admin MASIANG",
        contact_name: "Admin MASIANG",
      }),
    ],
    bookings: [],
    documents: [],
    histories: [],
    notifications: [],
    storagePaths: [],
    counters: {
      notif: 100,
      user: 2,
    },
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseBody(body: string | null): unknown {
  if (!body) return null;
  return JSON.parse(body);
}

function parseEq(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("eq.") ? decodeURIComponent(value.slice(3)) : null;
}

function parseIs(value: string | null): boolean | null {
  if (!value || !value.startsWith("is.")) return null;
  if (value === "is.true") return true;
  if (value === "is.false") return false;
  return null;
}

function parseNotIn(value: string | null): string[] | null {
  if (!value || !value.startsWith("not.in.")) return null;
  const match = value.match(/not\.in\.\((.*)\)/);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((item) => item.replaceAll('"', "").trim())
    .filter(Boolean);
}

function parseIn(value: string | null): string[] | null {
  if (!value || !value.startsWith("in.")) return null;
  const match = value.match(/in\.\((.*)\)/);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((item) => item.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "").trim())
    .filter(Boolean);
}

function normalizeBookingSession(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 8) {
    return trimmed;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)} - ${digits.slice(4, 6)}.${digits.slice(6, 8)} WITA`;
}

function toAuthUser(account: MockAccount) {
  return {
    id: account.id,
    aud: "authenticated",
    role: "authenticated",
    email: account.email,
    email_confirmed_at: nowIso(),
    phone: "",
    confirmed_at: nowIso(),
    last_sign_in_at: nowIso(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      role: account.role,
      approval_status: account.approval_status,
      school_name: account.school_name,
      contact_name: account.contact_name,
      npsn: account.npsn,
      phone: account.phone,
      address: account.address,
      avatar_path: account.avatar_path,
    },
    identities: [],
    created_at: account.created_at,
    updated_at: nowIso(),
  };
}

function toProfileRow(account: MockAccount) {
  return {
    id: account.id,
    role: account.role,
    approval_status: account.approval_status,
    school_name: account.school_name,
    npsn: account.npsn,
    contact_name: account.contact_name,
    email: account.email,
    phone: account.phone,
    address: account.address,
    education_level: account.education_level,
    principal_name: account.principal_name,
    operator_name: account.operator_name,
    district: account.district,
    avatar_path: account.avatar_path,
    created_at: account.created_at,
  };
}

function sortRows<T extends object>(rows: T[], order: string | null): T[] {
  if (!order) return rows;
  const [field, direction] = order.split(".");
  return [...rows].sort((a, b) => {
    const left = String((a as Record<string, unknown>)[field] ?? "");
    const right = String((b as Record<string, unknown>)[field] ?? "");
    return direction === "asc" ? left.localeCompare(right) : right.localeCompare(left);
  });
}

function shouldReturnObject(route: Route) {
  return route.request().headers()["accept"]?.includes("application/vnd.pgrst.object+json") ?? false;
}

function json(route: Route, status: number, data: unknown, headers?: Record<string, string>) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(data),
  });
}

export class MockSupabaseBackend {
  private sessions = new Map<string, string>();
  private routeInstalled = false;
  private delayRules: DelayRule[] = [];
  private failureRules: FailureRule[] = [];
  state: MockState;

  constructor(seed: MockState = createBaseMockState()) {
    this.state = deepClone(seed);
  }

  reset(seed: MockState = createBaseMockState()) {
    this.state = deepClone(seed);
    this.sessions.clear();
    this.delayRules = [];
    this.failureRules = [];
  }

  addDelayRule(rule: DelayRule) {
    this.delayRules.push(rule);
  }

  failNextRequest(rule: Omit<FailureRule, "once">) {
    this.failureRules.push({ ...rule, once: true });
  }

  failRequest(rule: FailureRule) {
    this.failureRules.push(rule);
  }

  clearNetworkRules() {
    this.delayRules = [];
    this.failureRules = [];
  }

  expireAllSessions() {
    this.sessions.clear();
  }

  async install(context: BrowserContext) {
    if (!this.routeInstalled) {
      await context.route(/\/(auth|rest|storage)\/v1\//, async (route) => {
        const url = new URL(route.request().url());
        if (await this.applyNetworkRules(route, url)) {
          return;
        }

        if (url.pathname.includes("/auth/v1/")) {
          await this.handleAuth(route, url);
          return;
        }
        if (url.pathname.includes("/rest/v1/")) {
          await this.handleRest(route, url);
          return;
        }
        if (url.pathname.includes("/storage/v1/")) {
          await this.handleStorage(route, url);
          return;
        }

        await route.fallback();
      });
      this.routeInstalled = true;
    }

    await context.addCookies([
      {
        name: "masiang-e2e-bypass",
        value: "1",
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  private matchesRule(method: string, path: string, rule: { method?: string; pathIncludes: string }) {
    if (rule.method && rule.method.toUpperCase() !== method.toUpperCase()) {
      return false;
    }

    return path.includes(rule.pathIncludes);
  }

  private async applyNetworkRules(route: Route, url: URL): Promise<boolean> {
    const method = route.request().method();
    const path = url.pathname;

    for (const rule of this.delayRules) {
      if (this.matchesRule(method, path, rule)) {
        await new Promise((resolve) => setTimeout(resolve, rule.delayMs));
      }
    }

    const failureIndex = this.failureRules.findIndex((rule) =>
      this.matchesRule(method, path, rule),
    );
    if (failureIndex === -1) {
      return false;
    }

    const failureRule = this.failureRules[failureIndex];
    if (failureRule.once) {
      this.failureRules.splice(failureIndex, 1);
    }

    await json(route, failureRule.status, failureRule.body);
    return true;
  }

  private nextNotifId() {
    this.state.counters.notif += 1;
    return `NTF-${String(this.state.counters.notif).padStart(3, "0")}`;
  }

  private findAccountByToken(authorization?: string) {
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.slice("Bearer ".length);
    const userId = this.sessions.get(token);
    return userId ? this.state.accounts.find((account) => account.id === userId) ?? null : null;
  }

  private insertNotification(notification: Omit<NotificationRow, "id" | "created_at" | "is_read"> & Partial<Pick<NotificationRow, "id" | "created_at" | "is_read">>) {
    this.state.notifications.unshift({
      id: notification.id ?? this.nextNotifId(),
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      reference_id: notification.reference_id ?? null,
      reference_type: notification.reference_type ?? null,
      is_read: notification.is_read ?? false,
      created_at: notification.created_at ?? nowIso(),
    });
  }

  private notifyAdmins(title: string, message: string, type: string, referenceId?: string | null, referenceType?: string | null) {
    this.state.accounts
      .filter((account) => account.role === "admin")
      .forEach((account) => {
        this.insertNotification({
          user_id: account.id,
          title,
          message,
          type,
          reference_id: referenceId ?? null,
          reference_type: referenceType ?? null,
        });
      });
  }

  private async handleAuth(route: Route, url: URL) {
    const method = route.request().method();

    if (method === "POST" && url.pathname.endsWith("/token") && url.searchParams.get("grant_type") === "password") {
      const body = parseBody(route.request().postData() ?? null) as { email?: string; password?: string } | null;
      const account = this.state.accounts.find(
        (candidate) =>
          candidate.email === body?.email &&
          candidate.password === body?.password,
      );

      if (!account) {
        await json(route, 400, {
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        });
        return;
      }

      const accessToken = `access-${account.id}-${Date.now()}`;
      const refreshToken = `refresh-${account.id}-${Date.now()}`;
      this.sessions.set(accessToken, account.id);

      await json(route, 200, {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: refreshToken,
        user: toAuthUser(account),
      });
      return;
    }

    if (method === "POST" && url.pathname.endsWith("/signup")) {
      const body = parseBody(route.request().postData() ?? null) as {
        email?: string;
        password?: string;
        data?: Record<string, string>;
      } | null;
      const existing = this.state.accounts.find((account) => account.email === body?.email);

      if (existing) {
        await json(route, 400, {
          error: "user_already_exists",
          error_description: "User already registered",
        });
        return;
      }

      this.state.counters.user += 1;
      const nextUserId = `school-${this.state.counters.user}`;
      const account = createAccount({
        id: nextUserId,
        email: body?.email ?? "",
        password: body?.password ?? "",
        role: "school",
        approval_status: "pending",
        school_name: body?.data?.school_name ?? "Sekolah Baru",
        npsn: body?.data?.npsn ?? "",
        contact_name: body?.data?.contact_name ?? "",
        phone: body?.data?.phone ?? "",
        address: body?.data?.address ?? "",
      });
      this.state.accounts.unshift(account);

      await json(route, 200, {
        user: toAuthUser(account),
        session: null,
      });
      return;
    }

    if (method === "GET" && url.pathname.endsWith("/user")) {
      const account = this.findAccountByToken(route.request().headers()["authorization"]);
      if (!account) {
        await json(route, 401, { error: "invalid_token", error_description: "Invalid token" });
        return;
      }

      await json(route, 200, toAuthUser(account));
      return;
    }

    if ((method === "PUT" || method === "PATCH") && url.pathname.endsWith("/user")) {
      const account = this.findAccountByToken(route.request().headers()["authorization"]);
      if (!account) {
        await json(route, 401, { error: "invalid_token", error_description: "Invalid token" });
        return;
      }

      const body = parseBody(route.request().postData() ?? null) as {
        password?: string;
        email?: string;
        data?: Record<string, unknown>;
      } | null;

      if (body?.password !== undefined) {
        account.password = String(body.password);
      }

      if (body?.email !== undefined) {
        account.email = String(body.email).trim().toLowerCase();
      }

      if (body?.data) {
        if ("avatar_path" in body.data) {
          account.avatar_path = body.data.avatar_path
            ? String(body.data.avatar_path)
            : null;
        }
        if ("school_name" in body.data) {
          account.school_name = body.data.school_name
            ? String(body.data.school_name)
            : null;
        }
        if ("contact_name" in body.data) {
          account.contact_name = body.data.contact_name
            ? String(body.data.contact_name)
            : null;
        }
      }

      await json(route, 200, { user: toAuthUser(account) });
      return;
    }

    if (method === "POST" && url.pathname.endsWith("/logout")) {
      const authorization = route.request().headers()["authorization"];
      if (authorization?.startsWith("Bearer ")) {
        this.sessions.delete(authorization.slice("Bearer ".length));
      }

      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fulfill({ status: 404, body: "" });
  }

  private filterRows<T extends object>(rows: T[], url: URL): T[] {
    let filtered = [...rows];

    for (const [key, value] of url.searchParams.entries()) {
      if (["select", "order", "limit", "offset"].includes(key)) {
        continue;
      }

      const eqValue = parseEq(value);
      if (eqValue !== null) {
        filtered = filtered.filter((row) => String((row as Record<string, unknown>)[key] ?? "") === eqValue);
        continue;
      }

      const isValue = parseIs(value);
      if (isValue !== null) {
        filtered = filtered.filter((row) => Boolean((row as Record<string, unknown>)[key]) === isValue);
        continue;
      }

      const notInValues = parseNotIn(value);
      if (notInValues) {
        filtered = filtered.filter((row) => !notInValues.includes(String((row as Record<string, unknown>)[key] ?? "")));
        continue;
      }

      const inValues = parseIn(value);
      if (inValues) {
        filtered = filtered.filter((row) => inValues.includes(String((row as Record<string, unknown>)[key] ?? "")));
      }
    }

    return sortRows(filtered, url.searchParams.get("order"));
  }

  private async handleRest(route: Route, url: URL) {
    const method = route.request().method();
    const table = url.pathname.split("/").pop();

    switch (table) {
      case "profiles":
        await this.handleProfiles(route, url, method);
        return;
      case "bookings":
        await this.handleBookings(route, url, method);
        return;
      case "documents":
        await this.handleDocuments(route, url, method);
        return;
      case "histories":
        await this.handleHistories(route, url, method);
        return;
      case "notifications":
        await this.handleNotifications(route, url, method);
        return;
      default:
        await route.fulfill({ status: 404, body: "" });
    }
  }

  private async handleProfiles(route: Route, url: URL, method: string) {
    if (method === "GET") {
      const rows = this.filterRows(
        this.state.accounts.map(toProfileRow),
        url,
      );
      if (shouldReturnObject(route)) {
        await json(route, rows[0] ? 200 : 406, rows[0] ?? { message: "No rows" });
        return;
      }
      await json(route, 200, rows);
      return;
    }

    if (method === "PATCH") {
      const updates = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      const targetId = parseEq(url.searchParams.get("id"));
      const account = this.state.accounts.find((item) => item.id === targetId);
      if (!account || !updates) {
        await json(route, 404, []);
        return;
      }

      if ("school_name" in updates) account.school_name = String(updates.school_name ?? "");
      if ("npsn" in updates) account.npsn = String(updates.npsn ?? "");
      if ("education_level" in updates) account.education_level = String(updates.education_level ?? "");
      if ("address" in updates) account.address = String(updates.address ?? "");
      if ("email" in updates) account.email = String(updates.email ?? "");
      if ("phone" in updates) account.phone = String(updates.phone ?? "");
      if ("principal_name" in updates) account.principal_name = String(updates.principal_name ?? "");
      if ("operator_name" in updates) account.operator_name = String(updates.operator_name ?? "");
      if ("district" in updates) account.district = String(updates.district ?? "");
      if ("avatar_path" in updates) {
        account.avatar_path = updates.avatar_path ? String(updates.avatar_path) : null;
      }
      if ("approval_status" in updates) {
        account.approval_status = (updates.approval_status as MockAccount["approval_status"]) ?? "pending";
      }

      await json(route, 200, []);
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  }

  private async handleBookings(route: Route, url: URL, method: string) {
    if (method === "GET") {
      const rows = this.filterRows(this.state.bookings, url);
      await json(route, 200, rows);
      return;
    }

    if (method === "HEAD") {
      const rows = this.filterRows(this.state.bookings, url);
      await route.fulfill({
        status: 200,
        headers: {
          "content-range": `0-0/${rows.length}`,
        },
        body: "",
      });
      return;
    }

    if (method === "POST") {
      const body = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      if (!body) {
        await json(route, 400, { message: "Invalid payload" });
        return;
      }

      const normalizedIncomingSession = normalizeBookingSession(String(body.session ?? ""));

      const conflicting = this.state.bookings.find(
        (booking) =>
          booking.date_iso === body.date_iso &&
          normalizeBookingSession(booking.session) === normalizedIncomingSession &&
          booking.status !== "Dibatalkan" &&
          booking.status !== "Ditolak",
      );
      if (conflicting) {
        await json(route, 409, {
          code: "23505",
          message: "duplicate key value violates unique constraint \"bookings_active_slot_unique\"",
        });
        return;
      }

      const row: BookingRow = {
        id: String(body.id),
        school_id: String(body.school_id),
        school_name: String(body.school_name),
        topic: String(body.topic),
        category: body.category ? String(body.category) : null,
        date_iso: String(body.date_iso),
        session: normalizedIncomingSession,
        status: String(body.status),
        timeline: Array.isArray(body.timeline) ? (body.timeline as Array<Record<string, unknown>>) : [],
        goal: body.goal ? String(body.goal) : null,
        notes: body.notes ? String(body.notes) : null,
        cancel_reason: null,
        rating: null,
        feedback: null,
        supervisor_notes: null,
        created_at: nowIso(),
      };
      this.state.bookings.unshift(row);
      this.notifyAdmins(
        "Booking Baru",
        `Booking ${row.id} (${row.topic}) diajukan oleh ${row.school_name}.`,
        "booking_created",
        row.id,
        "booking",
      );

      await json(route, 201, row);
      return;
    }

    if (method === "PATCH") {
      const updates = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      const rows = this.filterRows(this.state.bookings, url);
      rows.forEach((row) => {
        const previousStatus = row.status;
        Object.assign(row, updates ?? {});
        if (updates?.session !== undefined) {
          row.session = normalizeBookingSession(String(updates.session ?? ""));
        }
        if (updates?.cancel_reason !== undefined) {
          row.cancel_reason = updates.cancel_reason ? String(updates.cancel_reason) : null;
        }
        if (updates?.supervisor_notes !== undefined) {
          row.supervisor_notes = updates.supervisor_notes ? String(updates.supervisor_notes) : null;
        }
        if (updates?.rating !== undefined) {
          row.rating = Number(updates.rating);
        }
        if (updates?.feedback !== undefined) {
          row.feedback = String(updates.feedback ?? "");
        }
        if (updates?.timeline !== undefined && Array.isArray(updates.timeline)) {
          row.timeline = updates.timeline as Array<Record<string, unknown>>;
        }

        if (row.status === "Dibatalkan" && previousStatus !== "Dibatalkan") {
          this.notifyAdmins(
            "Booking Dibatalkan",
            `Booking ${row.id} dibatalkan oleh ${row.school_name}.`,
            "booking_cancelled",
            row.id,
            "booking",
          );
        }
      });

      const select = url.searchParams.get("select");
      if (select) {
        const fields = select
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean);

        const selectedRows = rows.map((row) => {
          if (fields.length === 0 || fields[0] === "*") {
            return row;
          }

          const picked: Record<string, unknown> = {};
          fields.forEach((field) => {
            picked[field] = (row as unknown as Record<string, unknown>)[field];
          });
          return picked;
        });

        await json(route, 200, selectedRows);
        return;
      }

      await json(route, 200, []);
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  }

  private async handleDocuments(route: Route, url: URL, method: string) {
    if (method === "GET") {
      const rows = this.filterRows(this.state.documents, url);
      await json(route, 200, rows);
      return;
    }

    if (method === "POST") {
      const body = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      if (!body) {
        await json(route, 400, { message: "Invalid payload" });
        return;
      }

      const row: DocumentRow = {
        id: String(body.id),
        school_id: String(body.school_id),
        booking_id: body.booking_id ? String(body.booking_id) : null,
        history_id: body.history_id ? String(body.history_id) : null,
        file_name: String(body.file_name),
        storage_path: body.storage_path ? String(body.storage_path) : null,
        file_size: body.file_size ? Number(body.file_size) : null,
        mime_type: body.mime_type ? String(body.mime_type) : null,
        stage: String(body.stage),
        review_status: body.review_status ? String(body.review_status) : "Menunggu Review",
        reviewer_notes: body.reviewer_notes ? String(body.reviewer_notes) : null,
        version: body.version ? Number(body.version) : 1,
        parent_doc_id: body.parent_doc_id ? String(body.parent_doc_id) : null,
        uploaded_at: String(body.uploaded_at),
        created_at: nowIso(),
      };
      this.state.documents.unshift(row);

      const school = this.state.accounts.find((account) => account.id === row.school_id);
      this.notifyAdmins(
        "Dokumen Diunggah",
        `Dokumen "${row.file_name}" diunggah oleh ${school?.school_name ?? "sekolah"}.`,
        "doc_uploaded",
        row.id,
        "document",
      );

      await json(route, 201, row);
      return;
    }

    if (method === "PATCH") {
      const updates = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      const rows = this.filterRows(this.state.documents, url);
      rows.forEach((row) => {
        Object.assign(row, updates ?? {});
        if (updates?.history_id !== undefined) {
          row.history_id = updates.history_id ? String(updates.history_id) : null;
        }
        if (updates?.review_status !== undefined) {
          row.review_status = String(updates.review_status);
        }
        if (updates?.reviewer_notes !== undefined) {
          row.reviewer_notes = updates.reviewer_notes ? String(updates.reviewer_notes) : null;
        }
      });
      await json(route, 200, []);
      return;
    }

    if (method === "DELETE") {
      const rows = this.filterRows(this.state.documents, url);
      const ids = new Set(rows.map((row) => row.id));
      this.state.documents = this.state.documents.filter((row) => !ids.has(row.id));
      await json(route, 200, rows);
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  }

  private async handleHistories(route: Route, url: URL, method: string) {
    if (method === "GET") {
      const rows = this.filterRows(this.state.histories, url);
      await json(route, 200, rows);
      return;
    }

    if (method === "POST") {
      const body = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      if (!body) {
        await json(route, 400, { message: "Invalid payload" });
        return;
      }

      const duplicate = this.state.histories.find((history) => history.booking_id && history.booking_id === body.booking_id);
      if (duplicate) {
        await json(route, 409, {
          code: "23505",
          message: "duplicate key value violates unique constraint \"histories_booking_id_unique\"",
        });
        return;
      }

      const row: HistoryRow = {
        id: String(body.id),
        school_id: String(body.school_id),
        booking_id: body.booking_id ? String(body.booking_id) : null,
        date_iso: String(body.date_iso),
        school_name: String(body.school_name),
        session: String(body.session),
        title: String(body.title),
        description: String(body.description),
        status: String(body.status),
        follow_up_iso: body.follow_up_iso ? String(body.follow_up_iso) : null,
        supervisor_notes: body.supervisor_notes ? String(body.supervisor_notes) : null,
        follow_up_done: Boolean(body.follow_up_done),
        follow_up_items: Array.isArray(body.follow_up_items) ? (body.follow_up_items as Array<Record<string, unknown>>) : [],
        created_at: nowIso(),
      };

      this.state.histories.unshift(row);
      await json(route, 201, row);
      return;
    }

    if (method === "PATCH") {
      const updates = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      const rows = this.filterRows(this.state.histories, url);
      rows.forEach((row) => {
        Object.assign(row, updates ?? {});
        if (updates?.follow_up_done !== undefined) {
          row.follow_up_done = Boolean(updates.follow_up_done);
        }
        if (updates?.follow_up_items !== undefined && Array.isArray(updates.follow_up_items)) {
          row.follow_up_items = updates.follow_up_items as Array<Record<string, unknown>>;
        }
        if (updates?.supervisor_notes !== undefined) {
          row.supervisor_notes = updates.supervisor_notes ? String(updates.supervisor_notes) : null;
        }
      });
      await json(route, 200, []);
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  }

  private async handleNotifications(route: Route, url: URL, method: string) {
    if (method === "GET") {
      const rows = this.filterRows(this.state.notifications, url);
      await json(route, 200, rows);
      return;
    }

    if (method === "POST") {
      const body = parseBody(route.request().postData() ?? null) as Record<string, unknown> | null;
      if (!body) {
        await json(route, 400, { message: "Invalid payload" });
        return;
      }

      const row: NotificationRow = {
        id: String(body.id),
        user_id: String(body.user_id),
        title: String(body.title),
        message: String(body.message),
        type: String(body.type),
        reference_id: body.reference_id ? String(body.reference_id) : null,
        reference_type: body.reference_type ? String(body.reference_type) : null,
        is_read: Boolean(body.is_read ?? false),
        created_at: nowIso(),
      };
      this.state.notifications.unshift(row);
      await json(route, 201, row);
      return;
    }

    if (method === "PATCH") {
      const rows = this.filterRows(this.state.notifications, url);
      rows.forEach((row) => {
        row.is_read = true;
      });
      await json(route, 200, []);
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  }

  private async handleStorage(route: Route, url: URL) {
    const method = route.request().method();
    const objectMatch = url.pathname.match(/\/storage\/v1\/object\/school-documents\/(.+)$/);
    const signMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/school-documents\/(.+)$/);

    if (method === "POST" && objectMatch) {
      const path = decodeURIComponent(objectMatch[1]);
      if (!this.state.storagePaths.includes(path)) {
        this.state.storagePaths.push(path);
      }
      await json(route, 200, {
        Id: path,
        Key: `school-documents/${path}`,
      });
      return;
    }

    if (method === "DELETE" && url.pathname.endsWith("/storage/v1/object/school-documents")) {
      const body = parseBody(route.request().postData() ?? null) as { prefixes?: string[] } | null;
      const prefixes = new Set(body?.prefixes ?? []);
      this.state.storagePaths = this.state.storagePaths.filter((path) => !prefixes.has(path));
      await json(route, 200, { data: [] });
      return;
    }

    if (method === "POST" && signMatch) {
      const path = decodeURIComponent(signMatch[1]);
      await json(route, 200, {
        signedURL: `/storage/v1/object/sign/school-documents/${path}?token=mock-token`,
      });
      return;
    }

    if (method === "GET" && signMatch) {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "mock document content",
      });
      return;
    }

    await route.fulfill({ status: 404, body: "" });
  }
}
