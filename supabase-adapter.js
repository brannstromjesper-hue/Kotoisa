import { createClient } from "@supabase/supabase-js";

const SERVER_TIMESTAMP = Symbol("serverTimestamp");
const ARRAY_UNION = Symbol("arrayUnion");

let supabase = null;
let configuredStorageBucket = "app-images";

export function initializeApp(config) {
  if (!config?.url || !config?.anonKey) {
    throw new Error("supabase/config-missing");
  }
  configuredStorageBucket = config.storageBucket || "app-images";
  supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  return supabase;
}

export function getAuth(client = supabase) {
  return client;
}

export function getDatabase(client = supabase) {
  return client;
}

export function getStorage(client = supabase) {
  return { client, bucket: configuredStorageBucket };
}

export function onAuthStateChanged(auth, callback) {
  let cancelled = false;
  auth.auth.getSession().then(({ data, error }) => {
    if (cancelled) return;
    if (error) {
      console.error(error);
      callback(null);
      return;
    }
    callback(toAuthUser(data.session?.user));
  });
  const { data } = auth.auth.onAuthStateChange((_event, session) => {
    if (!cancelled) callback(toAuthUser(session?.user));
  });
  return () => {
    cancelled = true;
    data.subscription.unsubscribe();
  };
}

export async function createUserWithEmailAndPassword(auth, email, password) {
  const { data, error } = await auth.auth.signUp({ email, password });
  if (error) throw mapSupabaseAuthError(error);
  if (!data.user) throw new Error("auth/user-not-created");
  if (!data.session) throw new Error("auth/email-confirmation-required");
  return { user: toAuthUser(data.user) };
}

export async function signInWithEmailAndPassword(auth, email, password) {
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error) throw mapSupabaseAuthError(error);
  if (!data.user) throw new Error("auth/invalid-credential");
  return { user: toAuthUser(data.user) };
}

export async function signOut(auth) {
  const { error } = await auth.auth.signOut();
  if (error) throw error;
}

export function collection(_dbOrRef, ...segments) {
  const baseSegments = _dbOrRef?.kind === "doc" ? _dbOrRef.segments : [];
  return {
    kind: "collection",
    segments: normalizeSegments([...baseSegments, ...segments]),
  };
}

export function doc(_dbOrCollectionRef, ...segments) {
  if (_dbOrCollectionRef?.kind === "collection") {
    const id = segments.length > 0 ? String(segments[0]) : randomId();
    return {
      kind: "doc",
      segments: [..._dbOrCollectionRef.segments, id],
    };
  }
  return {
    kind: "doc",
    segments: normalizeSegments(segments),
  };
}

function randomId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    try {
      return c.randomUUID();
    } catch {
      // Fall through to a non-crypto id for insecure local contexts.
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function query(collectionRef, ...constraints) {
  return {
    ...collectionRef,
    constraints,
  };
}

export function where(field, operator, value) {
  return { field, operator, value };
}

export function serverTimestamp() {
  return { __op: SERVER_TIMESTAMP };
}

export function arrayUnion(...values) {
  return { __op: ARRAY_UNION, values };
}

export async function addDoc(collectionRef, data) {
  const docRef = doc(collectionRef);
  await setDoc(docRef, data);
  return docRef;
}

export async function setDoc(docRef, data) {
  const row = rowFromDocRef(docRef, data);
  const { error } = await supabase.from("documents").upsert(row, { onConflict: "path" });
  if (error) throw error;
}

export async function updateDoc(docRef, patch) {
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("not-found");
  const nextData = applyPatch(snap.data(), patch);
  await setDoc(docRef, nextData);
}

export async function deleteDoc(docRef) {
  const { error } = await supabase.from("documents").delete().eq("path", pathFromSegments(docRef.segments));
  if (error) throw error;
}

export async function getDoc(docRef) {
  const { data, error } = await supabase
    .from("documents")
    .select("doc_id,data")
    .eq("path", pathFromSegments(docRef.segments))
    .maybeSingle();
  if (error) throw error;
  return createDocumentSnapshot(data, docRef.segments.at(-1));
}

export async function getDocs(collectionRef) {
  let request = supabase
    .from("documents")
    .select("doc_id,data")
    .eq("collection_path", pathFromSegments(collectionRef.segments));

  for (const constraint of collectionRef.constraints || []) {
    if (constraint.operator !== "==") {
      throw new Error(`unsupported-query-operator/${constraint.operator}`);
    }
    request = request.eq(`data->>${constraint.field}`, String(constraint.value));
  }

  const { data, error } = await request;
  if (error) throw error;
  return createQuerySnapshot(data || []);
}

export function onSnapshot(ref, callback) {
  let active = true;
  const channel = supabase.channel(`documents:${ref.kind}:${pathFromSegments(ref.segments)}`);
  const load = async () => {
    if (!active) return;
    try {
      if (ref.kind === "doc") {
        callback(await getDoc(ref));
      } else {
        callback(await getDocs(ref));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filter =
    ref.kind === "doc"
      ? `path=eq.${pathFromSegments(ref.segments)}`
      : `collection_path=eq.${pathFromSegments(ref.segments)}`;

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter,
      },
      () => {
        void load();
      }
    )
    .subscribe();

  void load();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export function writeBatch() {
  const operations = [];
  return {
    set(ref, data) {
      operations.push(() => setDoc(ref, data));
    },
    delete(ref) {
      operations.push(() => deleteDoc(ref));
    },
    async commit() {
      for (const operation of operations) {
        await operation();
      }
    },
  };
}

export function ref(storage, path) {
  return {
    storage,
    path,
  };
}

export async function uploadBytes(storageRef, file, options = {}) {
  const { error } = await storageRef.storage.client.storage
    .from(storageRef.storage.bucket)
    .upload(storageRef.path, file, {
      contentType: options.contentType || file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) throw error;
}

export function getDownloadURL(storageRef) {
  const { data } = storageRef.storage.client.storage
    .from(storageRef.storage.bucket)
    .getPublicUrl(storageRef.path);
  return data.publicUrl;
}

function toAuthUser(user) {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
  };
}

function mapSupabaseAuthError(error) {
  const code = (error.code || "").toLowerCase();
  const message = (error.message || "").toLowerCase();
  if (
    code.includes("email_exists") ||
    code.includes("user_already") ||
    code.includes("already_registered") ||
    code.includes("email_already") ||
    code.includes("identity_already")
  ) {
    return new Error("auth/email-already-in-use");
  }
  if (message.includes("invalid login credentials")) {
    return new Error("auth/invalid-credential");
  }
  if (message.includes("password")) {
    return new Error("auth/weak-password");
  }
  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists") ||
    message.includes("user already") ||
    message.includes("email exists")
  ) {
    return new Error("auth/email-already-in-use");
  }
  return error;
}

function normalizeSegments(segments) {
  return segments.flat().map(String).filter(Boolean);
}

function pathFromSegments(segments) {
  return normalizeSegments(segments).join("/");
}

function rowFromDocRef(docRef, data) {
  const segments = normalizeSegments(docRef.segments);
  return {
    path: pathFromSegments(segments),
    collection_path: pathFromSegments(segments.slice(0, -1)),
    doc_id: segments.at(-1),
    data: normalizeData(data),
  };
}

function normalizeData(value) {
  if (isServerTimestamp(value)) return new Date().toISOString();
  if (Array.isArray(value)) return value.map(normalizeData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, normalizeData(nestedValue)])
  );
}

function applyPatch(currentData, patch) {
  const nextData = { ...currentData };
  for (const [key, value] of Object.entries(patch || {})) {
    if (isArrayUnion(value)) {
      const existing = Array.isArray(nextData[key]) ? nextData[key] : [];
      nextData[key] = [...new Set([...existing, ...value.values])];
    } else {
      nextData[key] = normalizeData(value);
    }
  }
  return nextData;
}

function isServerTimestamp(value) {
  return value?.__op === SERVER_TIMESTAMP;
}

function isArrayUnion(value) {
  return value?.__op === ARRAY_UNION;
}

function createDocumentSnapshot(row, fallbackId) {
  return {
    id: row?.doc_id || fallbackId || "",
    exists: () => !!row,
    data: () => ({ ...(row?.data || {}) }),
  };
}

function createQuerySnapshot(rows) {
  return {
    empty: rows.length === 0,
    docs: rows.map((row) => createDocumentSnapshot(row)),
  };
}
