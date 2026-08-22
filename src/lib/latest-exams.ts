import { adminDB } from "@/lib/firebase/firebase-admin";
import { getCache, CacheKeys } from "@/lib/cache-strategy";

export async function updateLatestExamsConfig(examId: string, examData: any) {
  try {
    const isPublished = examData.isPublished === true;
    const category = String(examData.category || "SEBI").trim().toUpperCase();
    
    const configRef = adminDB.collection("system_config").doc("latest_exams");
    const configDoc = await configRef.get();
    let configData = configDoc.exists ? configDoc.data() : { categories: {} };
    if (!configData) configData = { categories: {} };
    if (!configData.categories) configData.categories = {};

    const isActive = examData.isActive !== false && examData.emergencyStopped !== true;

    if (isPublished && isActive) {
      configData.categories[category] = {
        examId,
        title: examData.title,
        isLocked: examData.isLocked === true,
        isPremium: examData.isPremium === true,
        category,
        publishedAt: new Date().toISOString(),
      };
    } else {
      // If unpublished or inactive, remove it if it matches
      const current = configData.categories[category];
      if (current && current.examId === examId) {
        delete configData.categories[category];
      }
    }
    
    await configRef.set(configData, { merge: true });
    getCache().invalidate(CacheKeys.latestExams());
  } catch (error) {
    console.error("Error updating latest exams config:", error);
  }
}

export async function removeLatestExamConfig(examId: string, category?: string) {
  try {
    const configRef = adminDB.collection("system_config").doc("latest_exams");
    const configDoc = await configRef.get();
    if (!configDoc.exists) return;

    let configData = configDoc.data();
    if (!configData || !configData.categories) return;

    let changed = false;

    if (category) {
      const normalizedCategory = category.trim().toUpperCase();
      const current = configData.categories[normalizedCategory];
      if (current && current.examId === examId) {
        delete configData.categories[normalizedCategory];
        changed = true;
      }
    } else {
      // Search all categories
      for (const cat in configData.categories) {
        if (configData.categories[cat]?.examId === examId) {
          delete configData.categories[cat];
          changed = true;
        }
      }
    }

    if (changed) {
      await configRef.set(configData, { merge: true });
      getCache().invalidate(CacheKeys.latestExams());
    }
  } catch (error) {
    console.error("Error removing deleted exam from latest config:", error);
  }
}
