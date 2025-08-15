/// LINK: https://dev.to/phoinixi/one-way-data-binding-in-vanilla-js-poc-4dj7

const bindAttr = 'data-bind' // attribute for binding data

/**
 * 
 * @param {Object} obj 
 * @param {string} path 
 * @returns {string|Object|undefined}
 */
export const getNestedObjValue = (obj, path) => {
  if (!obj || typeof obj !== 'object')
    throw new TypeError("getNestedObjValue: 'obj' must be a non-null object.");

  if (!path || typeof path !== 'string')
    throw new TypeError("getNestedObjValue: 'path' must be a non-empty string.");

  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
};

/**
 * 
 * @param {Object} obj 
 * @param {String} path 
 * @param {*} value 
 */
export const setNestedObjValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => acc && acc[key], obj);
  if (lastObj && lastKey) lastObj[lastKey] = value;
}

/**
 * Updates element text or value and (re)renders it
 * @param {Node} element 
 * @param {string} propPath 
 */
export const updateElement = (element, propPath) => {
  // console.debug("updateElement propPath:", propPath);
  const value = getNestedObjValue(state, propPath);
  /// Set value - mainly for <input> elements + <textarea>
  if ("value" in element || element.tagName === 'TEXTAREA') {
    element.value = value;
  }
  /// Set inner text
  else {
    element.innerText = value;
  }
}

/**
 * Renders all elements with the given property path
 * @param {string} propertyPath 
 */
export const updateElementsByProperty = (propertyPath, scope = document) => {
  scope.querySelectorAll(`[${bindAttr}="${propertyPath}"]`)?.forEach((element) => {
    updateElement(element, propertyPath);
  });
}

function createDeepProxy(obj, path = '') {
  return new Proxy(obj, {
    get(target, property) {
      const value = target[property];
      if (Object.is(value, null) || Object.is(value, undefined)) {
        console.warn(`Value is null or undefined.`);
        return '';
      }
      if (typeof value === 'object') {
        const newPath = path ? `${path}.${property}` : property;
        return createDeepProxy(value, newPath);
      }
      return value;
    },
    set(target, property, value) {
      target[property] = value;
      const propPath = path ? `${path}.${property}` : property;
      updateElementsByProperty(propPath);
      return true;
    }
  });
}

const setState = (state) => createDeepProxy(state);

export const state = setState({
  meals: {
    'pizza': 'with pepperoni and pineapple',
    meat: {
      1: 'Chicken',
      2: 'Beef',
      3: 'Pork',
    },
    'vegetarian': 'go away',
  },
  quote1: 'You either die a hero or live long enough to see yourself become the villain.',
  quote2: 'It’s not who I am underneath, but what I do that defines me.',
  quote3: 'Sometimes the truth isn’t good enough, sometimes people deserve more. Sometimes people deserve to have their faith rewarded.',
  s: 'Something stringy',
  e: '',
  n: null,
  u: undefined,
})

/// Observe DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    /// Child node was Added (or removed)
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        // console.debug("MUTATION added node: ", node);
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Update node itself if it has bindAttr
          node.hasAttribute(bindAttr) ? updateElement(node, node.getAttribute(bindAttr)) : null;
          // Update all descendants with bindAttr
          node.querySelectorAll(`[${bindAttr}]`).forEach((child) => {
            updateElement(child, child.getAttribute(bindAttr));
          });
        }
      });
    }
    // Attribute was modified
    else if (mutation.type === 'attributes') {
      const target = mutation.target;
      if (target.hasAttribute(bindAttr)) {
        console.debug("target", target);
        updateElement(target, target.getAttribute(bindAttr));
      }
    }
  });
});

/// Start observing the document body for changes
observer.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true
});

/// Initialize elements
function init() {
  /// For each top-level key, update all nested bindings
  const traverse = (obj, prefix = '') => {
    Object.keys(obj).forEach(key => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key], path);
      } else {
        updateElementsByProperty(path);
      }
    });
  };
  traverse(state);
}

/// On page load
$(document).ready(() => {
  init(state)
})