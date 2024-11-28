import { useEffect } from "react";
import { api } from "../lib/api";
import { checkLessonStep } from "../lib/runner";
import { useWorkspaceStore } from "../stores/workspace";

export function LessonPanel() {
  const { lesson, lessonStepIndex, setLesson, setLessonStepIndex, consoleOutput } =
    useWorkspaceStore();

  useEffect(() => {
    let cancelled = false;
    api
      .getLesson("hello-world")
      .then((lesson) => {
        if (!cancelled) setLesson(lesson);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [setLesson]);

  if (!lesson) return <div className="lesson-panel muted">加载练习...</div>;

  const step = lesson.steps[lessonStepIndex];
  const passed = step ? checkLessonStep(consoleOutput, step.check.value) : false;

  const next = () => {
    if (lessonStepIndex < lesson.steps.length - 1) {
      setLessonStepIndex(lessonStepIndex + 1);
    }
  };

  return (
    <div className="lesson-panel">
      <div className="panel-header">{lesson.title}</div>
      <div className="lesson-progress">
        步骤 {lessonStepIndex + 1} / {lesson.steps.length}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((lessonStepIndex + 1) / lesson.steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {step && (
        <>
          <h3>{step.title}</h3>
          <p>{step.instruction}</p>
          {step.hint && (
            <details>
              <summary>提示</summary>
              <code>{step.hint}</code>
            </details>
          )}
          {step.check.value !== "__SKIP__" && (
            <p className={passed ? "check-pass" : "check-pending"}>
              {passed ? "✓ 已通过本步检查" : "○ 运行代码以完成本步"}
            </p>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={next}
            disabled={
              step.check.value !== "__SKIP__" &&
              !passed &&
              lessonStepIndex < lesson.steps.length - 1
            }
          >
            {lessonStepIndex >= lesson.steps.length - 1 ? "已完成" : "下一步"}
          </button>
        </>
      )}
    </div>
  );
}
