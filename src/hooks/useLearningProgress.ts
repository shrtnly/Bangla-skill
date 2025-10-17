// /src/hooks/useLearningProgress.ts
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ProgressState = {
  modules: any[];
  chapters: any[];
  moduleProgress: any[];
  chapterProgress: any[];
  fetchedAt?: string | null;
};

export const useLearningProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressState>({
    modules: [],
    chapters: [],
    moduleProgress: [],
    chapterProgress: [],
    fetchedAt: null,
  });

  const fetchFullProgress = useCallback(
    async (courseId?: string) => {
      if (!user) return;

      try {
        // 1) fetch modules (optionally filtered by course)
        const { data: modules } = await supabase
          .from("modules")
          .select("*")
          .maybeSingle() // fallback if no courseId provided (we handle below)
          .limit(1);

        // We'll fetch modules properly depending on courseId
        const { data: modulesData } = await supabase
          .from("modules")
          .select("*")
          .order("order_index")
          .maybeSingle();

        // Actually query modules (course-scoped)
        const q = supabase.from("modules").select("*").order("order_index");
        if (courseId) q.eq("course_id", courseId);
        const { data: modulesList } = await q;

        const modulesArr = modulesList || [];

        // 2) fetch module_progress for this user
        const { data: moduleProgress } = await supabase
          .from("module_progress")
          .select("*")
          .eq("user_id", user.id);

        // 3) fetch chapters for these modules
        const moduleIds = modulesArr.map((m: any) => m.id);
        const { data: chapters } =
          moduleIds.length > 0
            ? await supabase
                .from("chapters")
                .select("*")
                .in("module_id", moduleIds)
                .order("order_index")
            : { data: [] };

        // 4) fetch chapter_progress for user
        const { data: chapterProgress } = await supabase
          .from("chapter_progress")
          .select("*")
          .eq("user_id", user.id);

        setProgress({
          modules: modulesArr,
          chapters: chapters || [],
          moduleProgress: moduleProgress || [],
          chapterProgress: chapterProgress || [],
          fetchedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("useLearningProgress: fetchFullProgress error", err);
        // don't toast here, let pages decide UI errors
      }
    },
    [user]
  );

  const refresh = useCallback(
    async (courseId?: string) => {
      await fetchFullProgress(courseId);
    },
    [fetchFullProgress]
  );

  // helper: is chapter completed
  const isChapterCompleted = (chapterId: string) =>
    progress.chapterProgress.some((p) => p.chapter_id === chapterId && p.completed);

  // helper: is module learning completed
  const isModuleLearningCompleted = (moduleId: string) =>
    progress.moduleProgress.some((p) => p.module_id === moduleId && p.learning_completed);

  // mark a chapter completed (creates or updates)
  const markChapterComplete = useCallback(
    async (chapterId: string, moduleId?: string) => {
      if (!user) return { success: false };

      try {
        // upsert chapter_progress
        const { error: upsertError } = await supabase.from("chapter_progress").upsert({
          user_id: user.id,
          chapter_id: chapterId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
        if (upsertError) throw upsertError;

        // refresh local progress
        await fetchFullProgress();

        // after refreshing, check if all chapters of the module are complete
        if (moduleId) {
          const moduleChapters = progress.chapters.filter((c) => c.module_id === moduleId);
          const allCompleted = moduleChapters.length > 0 && moduleChapters.every((c) => progress.chapterProgress.some((p) => (p.chapter_id === c.id && p.completed) || c.id === chapterId));
          if (allCompleted) {
            // set module_progress.learning_completed = true
            const { error: moduleError } = await supabase
              .from("module_progress")
              .upsert({
                user_id: user.id,
                module_id: moduleId,
                learning_completed: true,
                updated_at: new Date().toISOString(),
              }, { onConflict: ["user_id", "module_id"] });
            if (moduleError) throw moduleError;
            await fetchFullProgress();
          }
        }

        return { success: true };
      } catch (err) {
        console.error("markChapterComplete error", err);
        return { success: false, error: err };
      }
    },
    [user, fetchFullProgress, progress.chapters, progress.chapterProgress]
  );

  // mark module practice completed (used by Practice)
  const markModulePracticeComplete = useCallback(
    async (moduleId: string) => {
      if (!user) return { success: false };
      try {
        const { error } = await supabase
          .from("module_progress")
          .upsert({
            user_id: user.id,
            module_id: moduleId,
            practice_completed: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: ["user_id", "module_id"] });
        if (error) throw error;
        await fetchFullProgress();
        return { success: true };
      } catch (err) {
        console.error("markModulePracticeComplete error", err);
        return { success: false, error: err };
      }
    },
    [user, fetchFullProgress]
  );

  return {
    progress,
    fetchFullProgress,
    refresh,
    isChapterCompleted,
    isModuleLearningCompleted,
    markChapterComplete,
    markModulePracticeComplete,
  };
};
