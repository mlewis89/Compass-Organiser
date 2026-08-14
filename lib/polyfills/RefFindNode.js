import _inheritsLoose from "@babel/runtime/helpers/esm/inheritsLoose";
import * as React from "react";
import { findDOMNode } from "find-dom-node-polyfill";
import { handleRef } from "@fluentui/react-component-ref/dist/es/utils";

function isFiberRef(node) {
  if (node === null) {
    return false;
  }

  if (node instanceof Element || node instanceof Text) {
    return false;
  }

  return !!(node.type && node.tag);
}

export const RefFindNode = /*#__PURE__*/ (function (_React$Component) {
  _inheritsLoose(RefFindNode, _React$Component);

  function RefFindNode() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
    _this.prevNode = void 0;
    return _this;
  }

  var _proto = RefFindNode.prototype;

  _proto.componentDidMount = function componentDidMount() {
    var currentNode = findDOMNode(this);

    if (process.env.NODE_ENV !== "production") {
      if (isFiberRef(currentNode)) {
        currentNode = null;
      }
    }

    this.prevNode = currentNode;
    handleRef(this.props.innerRef, currentNode);
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var currentNode = findDOMNode(this);

    if (process.env.NODE_ENV !== "production") {
      if (isFiberRef(currentNode)) {
        currentNode = null;
      }
    }

    if (this.prevNode !== currentNode) {
      this.prevNode = currentNode;
      handleRef(this.props.innerRef, currentNode);
    }

    if (prevProps.innerRef !== this.props.innerRef) {
      handleRef(this.props.innerRef, currentNode);
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    handleRef(this.props.innerRef, null);
    delete this.prevNode;
  };

  _proto.render = function render() {
    return this.props.children;
  };

  return RefFindNode;
})(React.Component);

export default RefFindNode;
