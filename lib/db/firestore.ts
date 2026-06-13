// Firestore helper — menggantikan Prisma client
// Semua operasi database melalui file ini

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

// ─── Collection names ────────────────────────────────────

export const COL = {
  USERS: "users",
  GROUPS: "groups",
  GROUP_MEMBERS: "group_members",
  TOPICS: "topics",
  SUBTOPICS: "subtopics",
  MATERIALS: "materials",
  MATERIAL_ATTACHMENTS: "material_attachments",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  RPS: "rps",
  GRADE_MATRICES: "grade_matrices",
  GRADE_COMPONENTS: "grade_components",
  GRADE_STUDENTS: "grade_students",
  GRADE_SCORES: "grade_scores",
  SETTINGS: "settings",
  AI_USAGE_LOGS: "ai_usage_logs",
} as const;

// ─── Helpers ─────────────────────────────────────────────

export function newId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

// ─── Generic CRUD ────────────────────────────────────────

export async function getDoc<T>(collection: string, id: string): Promise<T | null> {
  const snap = await adminDb.collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function getDocs<T>(
  collection: string,
  where?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }[],
  orderBy?: { field: string; direction?: "asc" | "desc" },
  limit?: number
): Promise<T[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  if (where) {
    for (const w of where) {
      query = query.where(w.field, w.op, w.value);
    }
  }
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction ?? "asc");
  }
  if (limit) {
    query = query.limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function createDoc<T extends object>(
  collection: string,
  data: T,
  id?: string
): Promise<T & { id: string }> {
  const docId = id ?? newId();
  await adminDb.collection(collection).doc(docId).set(data);
  return { ...data, id: docId };
}

export async function updateDoc<T extends object>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await adminDb.collection(collection).doc(id).update(data as FirebaseFirestore.UpdateData<T>);
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  await adminDb.collection(collection).doc(id).delete();
}

export async function countDocs(
  collection: string,
  where?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }[]
): Promise<number> {
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  if (where) {
    for (const w of where) query = query.where(w.field, w.op, w.value);
  }
  const snap = await query.count().get();
  return snap.data().count;
}

// ─── Shorthand collections ───────────────────────────────

export const db = {
  users: {
    get: (id: string) => getDoc(COL.USERS, id),
    list: (where?: Parameters<typeof getDocs>[1]) => getDocs(COL.USERS, where),
    findByEmail: async (email: string) => {
      const docs = await getDocs<{ id: string; email: string }>(COL.USERS, [
        { field: "email", op: "==", value: email },
      ]);
      return docs[0] ?? null;
    },
    findByNim: async (nim: string) => {
      const docs = await getDocs<{ id: string; nim: string }>(COL.USERS, [
        { field: "nim", op: "==", value: nim },
      ]);
      return docs[0] ?? null;
    },
    create: (data: object, id?: string) => createDoc(COL.USERS, data, id),
    update: (id: string, data: object) => updateDoc(COL.USERS, id, data),
    delete: (id: string) => deleteDoc(COL.USERS, id),
  },
  groups: {
    get: (id: string) => getDoc(COL.GROUPS, id),
    list: (where?: Parameters<typeof getDocs>[1]) => getDocs(COL.GROUPS, where),
    findByCode: async (code: string) => {
      const docs = await getDocs<{ id: string; code: string }>(COL.GROUPS, [
        { field: "code", op: "==", value: code },
      ]);
      return docs[0] ?? null;
    },
    create: (data: object, id?: string) => createDoc(COL.GROUPS, data, id),
    update: (id: string, data: object) => updateDoc(COL.GROUPS, id, data),
    delete: (id: string) => deleteDoc(COL.GROUPS, id),
  },
  groupMembers: {
    get: (id: string) => getDoc(COL.GROUP_MEMBERS, id),
    list: (where?: Parameters<typeof getDocs>[1]) => getDocs(COL.GROUP_MEMBERS, where),
    create: (data: object, id?: string) => createDoc(COL.GROUP_MEMBERS, data, id),
    delete: (id: string) => deleteDoc(COL.GROUP_MEMBERS, id),
    deleteWhere: async (userId: string, groupId: string) => {
      const snap = await adminDb
        .collection(COL.GROUP_MEMBERS)
        .where("userId", "==", userId)
        .where("groupId", "==", groupId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },
  topics: {
    get: (id: string) => getDoc(COL.TOPICS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.TOPICS, where),
    create: (data: object, id?: string) => createDoc(COL.TOPICS, data, id),
    update: (id: string, data: object) => updateDoc(COL.TOPICS, id, data),
    delete: (id: string) => deleteDoc(COL.TOPICS, id),
  },
  subtopics: {
    get: (id: string) => getDoc(COL.SUBTOPICS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.SUBTOPICS, where),
    create: (data: object, id?: string) => createDoc(COL.SUBTOPICS, data, id),
    update: (id: string, data: object) => updateDoc(COL.SUBTOPICS, id, data),
    delete: (id: string) => deleteDoc(COL.SUBTOPICS, id),
  },
  materials: {
    get: (id: string) => getDoc(COL.MATERIALS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.MATERIALS, where),
    create: (data: object, id?: string) => createDoc(COL.MATERIALS, data, id),
    update: (id: string, data: object) => updateDoc(COL.MATERIALS, id, data),
    delete: (id: string) => deleteDoc(COL.MATERIALS, id),
  },
  materialAttachments: {
    get: (id: string) => getDoc(COL.MATERIAL_ATTACHMENTS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.MATERIAL_ATTACHMENTS, where),
    create: (data: object, id?: string) => createDoc(COL.MATERIAL_ATTACHMENTS, data, id),
    delete: (id: string) => deleteDoc(COL.MATERIAL_ATTACHMENTS, id),
    deleteByMaterial: async (materialId: string) => {
      const snap = await adminDb
        .collection(COL.MATERIAL_ATTACHMENTS)
        .where("materialId", "==", materialId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },
  quizzes: {
    get: (id: string) => getDoc(COL.QUIZZES, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.QUIZZES, where),
    create: (data: object, id?: string) => createDoc(COL.QUIZZES, data, id),
    update: (id: string, data: object) => updateDoc(COL.QUIZZES, id, data),
    delete: (id: string) => deleteDoc(COL.QUIZZES, id),
  },
  quizAttempts: {
    get: (id: string) => getDoc(COL.QUIZ_ATTEMPTS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.QUIZ_ATTEMPTS, where),
    create: (data: object, id?: string) => createDoc(COL.QUIZ_ATTEMPTS, data, id),
    update: (id: string, data: object) => updateDoc(COL.QUIZ_ATTEMPTS, id, data),
  },
  rps: {
    get: (id: string) => getDoc(COL.RPS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.RPS, where),
    create: (data: object, id?: string) => createDoc(COL.RPS, data, id),
    update: (id: string, data: object) => updateDoc(COL.RPS, id, data),
    delete: (id: string) => deleteDoc(COL.RPS, id),
  },
  gradeMatrices: {
    get: (id: string) => getDoc(COL.GRADE_MATRICES, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.GRADE_MATRICES, where),
    create: (data: object, id?: string) => createDoc(COL.GRADE_MATRICES, data, id),
    update: (id: string, data: object) => updateDoc(COL.GRADE_MATRICES, id, data),
    delete: (id: string) => deleteDoc(COL.GRADE_MATRICES, id),
  },
  gradeComponents: {
    get: (id: string) => getDoc(COL.GRADE_COMPONENTS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.GRADE_COMPONENTS, where),
    create: (data: object, id?: string) => createDoc(COL.GRADE_COMPONENTS, data, id),
    update: (id: string, data: object) => updateDoc(COL.GRADE_COMPONENTS, id, data),
    delete: (id: string) => deleteDoc(COL.GRADE_COMPONENTS, id),
    deleteByMatrix: async (gradeMatrixId: string) => {
      const snap = await adminDb
        .collection(COL.GRADE_COMPONENTS)
        .where("gradeMatrixId", "==", gradeMatrixId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },
  gradeStudents: {
    get: (id: string) => getDoc(COL.GRADE_STUDENTS, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.GRADE_STUDENTS, where),
    create: (data: object, id?: string) => createDoc(COL.GRADE_STUDENTS, data, id),
    update: (id: string, data: object) => updateDoc(COL.GRADE_STUDENTS, id, data),
    delete: (id: string) => deleteDoc(COL.GRADE_STUDENTS, id),
    deleteByMatrix: async (gradeMatrixId: string) => {
      const snap = await adminDb
        .collection(COL.GRADE_STUDENTS)
        .where("gradeMatrixId", "==", gradeMatrixId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },
  gradeScores: {
    get: (id: string) => getDoc(COL.GRADE_SCORES, id),
    list: (where?: Parameters<typeof getDocs>[1]) => getDocs(COL.GRADE_SCORES, where),
    create: (data: object, id?: string) => createDoc(COL.GRADE_SCORES, data, id),
    update: (id: string, data: object) => updateDoc(COL.GRADE_SCORES, id, data),
    upsertByComponentAndStudent: async (
      componentId: string,
      studentId: string,
      score: number | null
    ) => {
      const existing = await getDocs<{ id: string }>(COL.GRADE_SCORES, [
        { field: "componentId", op: "==", value: componentId },
        { field: "studentId", op: "==", value: studentId },
      ]);
      if (existing.length > 0) {
        await updateDoc(COL.GRADE_SCORES, existing[0].id, { score });
        return { ...existing[0], score };
      }
      return createDoc(COL.GRADE_SCORES, { componentId, studentId, score });
    },
    deleteByComponent: async (componentId: string) => {
      const snap = await adminDb
        .collection(COL.GRADE_SCORES)
        .where("componentId", "==", componentId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
    deleteByStudent: async (studentId: string) => {
      const snap = await adminDb
        .collection(COL.GRADE_SCORES)
        .where("studentId", "==", studentId)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },
  },
  settings: {
    get: (key: string) => getDoc(COL.SETTINGS, key),
    set: async (key: string, value: string) => {
      await adminDb
        .collection(COL.SETTINGS)
        .doc(key)
        .set({ value, updatedAt: now() }, { merge: true });
    },
  },
  aiUsageLogs: {
    create: (data: object, id?: string) => createDoc(COL.AI_USAGE_LOGS, data, id),
    list: (where?: Parameters<typeof getDocs>[1]) =>
      getDocs(COL.AI_USAGE_LOGS, where),
  },
};
