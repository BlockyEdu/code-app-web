import { message } from "antd";
import { useEffect, useState } from "react";
import { api, type LessonSummary } from "../lib/api";
import { t } from "../lib/i18n";
import {
  formatSubmittedVersion,
  isLessonSubmitted,
  mergeLearnLink,
  shouldShowLessonSubmit,
} from "../lib/learn-link";
import { useLocaleStore } from "../lib/locale-store";
import { checkLessonStep } from "../lib/runner";
import { useWorkspaceStore } from "../stores/workspace";

export function LessonPanel() {
  useLocaleStore((s) => s.locale);
  const {
    lesson,
    lessonStepIndex,
    setLesson,
    setLessonStepIndex,
    consoleOutput,
    artifactId,
    learnLink,
    setLearnLink,
  } = useWorkspaceStore();
  const [catalog, setCatalog] = useState<LessonSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listLessons()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (lesson?.id) return;
    let cancelled = false;
    void api
      .getLesson("hello-world")
      .then((next) => {
        if (cancelled) return;
        if (useWorkspaceStore.getState().lesson?.id) return;
        setLesson(next);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [lesson?.id, setLesson]);

  const loadLesson = (id: string) => {
    void api
      .getLesson(id)
      .then((next) => {
        setLesson(next);
        setLessonStepIndex(0);
        const aid = useWorkspaceStore.getState().artifactId;
        if (!aid) return;
        void api
          .putArtifactLearnLink(aid, { workspaceLessonId: id, submissionState: "draft" })
          .then((art) => {
            setLearnLink(
              art.learnLink ??
                mergeLearnLink(useWorkspaceStore.getState().learnLink, {
                  workspaceLessonId: id,
                  submissionState: "draft",
                }),
            );
          })
          .catch(() => {
            message.error(t("lesson.bindFailed"));
          });
      })
      .catch(console.error);
  };

  const submitPinnedVersion = async () => {
    const {
      artifactId: aid,
      lesson: current,
      saveDirty,
      saveCurrentArtifact,
      learnLink: link,
    } = useWorkspaceStore.getState();
    if (
      !aid ||
      !current ||
      !shouldShowLessonSubmit({ artifactId: aid, submissionState: link?.submissionState })
    ) {
      return;
    }
    setSubmitting(true);
    try {
      if (saveDirty) {
        const ok = await saveCurrentArtifact();
        if (!ok) {
          message.error(t("lesson.submitFailed"));
          return;
        }
      }
      const version = await api.createArtifactVersion(aid, { label: "learn-submit" });
      const art = await api.putArtifactLearnLink(aid, {
        workspaceLessonId: current.id,
        submissionState: "submitted",
        submittedVersionId: version.id,
      });
      setLearnLink(
        art.learnLink ??
          mergeLearnLink(link, {
            workspaceLessonId: current.id,
            submissionState: "submitted",
            submittedVersionId: version.id,
          }),
      );
      message.success(t("lesson.submitted"));
    } catch {
      message.error(t("lesson.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!lesson) return <div className="lesson-panel muted">{t("lesson.loading")}</div>;

  const lastIndex = lesson.steps.length - 1;
  const step = lesson.steps[lessonStepIndex];
  const passed = step ? checkLessonStep(consoleOutput, step.check.value) : false;
  const skipCheck = step?.check.value === "__SKIP__";
  const isLast = lessonStepIndex >= lastIndex;
  const stepComplete = Boolean(step && (skipCheck || passed));
  const celebrated = isLast && stepComplete;
  const canSubmit = shouldShowLessonSubmit({
    artifactId,
    submissionState: learnLink?.submissionState,
  });
  const alreadySubmitted = isLessonSubmitted(learnLink?.submissionState);

  const next = () => {
    if (lessonStepIndex < lastIndex) {
      setLessonStepIndex(lessonStepIndex + 1);
    }
  };

  return (
    <div className="lesson-panel">
      <div className="panel-header">{lesson.title}</div>
      {catalog.length > 1 && (
        <label className="lesson-picker">
          {t("lesson.pick")}
          <select value={lesson.id} onChange={(event) => loadLesson(event.target.value)}>
            {catalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="lesson-progress">
        {t("lesson.stepProgress", {
          current: lessonStepIndex + 1,
          total: lesson.steps.length,
        })}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((lessonStepIndex + 1) / lesson.steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {celebrated ? (
        <div className="lesson-celebration">
          <h3>{t("lesson.celebrationTitle")}</h3>
          <p>{t("lesson.celebrationBody")}</p>
          {alreadySubmitted ? (
            <p className="lesson-submitted">
              {t("lesson.alreadySubmitted", {
                version: formatSubmittedVersion(learnLink?.submittedVersionId),
              })}
            </p>
          ) : canSubmit ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void submitPinnedVersion()}
              disabled={submitting}
            >
              {t("lesson.submit")}
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={() => setLessonStepIndex(0)}>
            {t("lesson.restart")}
          </button>
        </div>
      ) : (
        step && (
          <>
            <h3>{step.title}</h3>
            <p>{step.instruction}</p>
            {step.hint && (
              <details>
                <summary>{t("lesson.hint")}</summary>
                <code>{step.hint}</code>
              </details>
            )}
            {!skipCheck && (
              <p className={passed ? "check-pass" : "check-pending"}>
                {passed ? t("lesson.passed") : t("lesson.pending")}
              </p>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={next}
              disabled={!skipCheck && !passed && !isLast}
            >
              {isLast ? t("lesson.done") : t("lesson.next")}
            </button>
          </>
        )
      )}
    </div>
  );
}
