export {
  checkLessonStep,
  runJavascript,
  runPython,
  runTypescriptSync as runTypescript,
} from '../plugins/runners';

/** @deprecated 使用 runLanguageCode('javascript', code) */
export { runJavascript as runJavaScript } from '../plugins/runners';
