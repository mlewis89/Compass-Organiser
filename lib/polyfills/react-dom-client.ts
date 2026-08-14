import * as ReactDOM from "react-dom-original";
import { findDOMNode as polyfillFindDOMNode } from "find-dom-node-polyfill";

export * from "react-dom-original";
export { default } from "react-dom-original";

export function findDOMNode(
  componentOrElement: Parameters<typeof polyfillFindDOMNode>[0],
): ReturnType<typeof polyfillFindDOMNode> {
  if (typeof ReactDOM.findDOMNode === "function") {
    return ReactDOM.findDOMNode(componentOrElement);
  }
  return polyfillFindDOMNode(componentOrElement);
}
