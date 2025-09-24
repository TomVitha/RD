/// LINK: https://dev.to/phoinixi/one-way-data-binding-in-vanilla-js-poc-4dj7

const bindAttr = 'data-bind' // attribute for binding data
const bindAttrPrefix = 'data-bind-' // prefix for attribute binding

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
export const setNestedObjValue = (path, value, obj = state) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => acc && acc[key], obj);
  if (lastObj && lastKey) lastObj[lastKey] = value;
}

/**
 * Updates an element's content or attribute based on state data
 * @param {Node} element - The element to update
 * @param {string} propPath - The property path in state
 * @param {string|null} attrName - Optional attribute name to update (if null, updates element content)
 */
export const updateElement = (element, propPath, attrName = null) => {
  const value = getNestedObjValue(state, propPath);
  
  // If attrName is provided, update that attribute
  if (attrName) {
    element.setAttribute(attrName, value);
    return;
  }
  
  // Otherwise update element content (original behavior)
  if ("value" in element || element.tagName === 'TEXTAREA') {
    element.value = value;
  } else {
    element.innerText = value;
  }
}

/**
 * Gets all elements with attributes that start with the given prefix
 * @param {string} prefix - The attribute name prefix to search for
 * @param {Document|Element} scope - The root element to search in
 * @returns {Element[]} Array of matching elements
 */
const getElementsWithAttrPrefix = (prefix, scope = document) => {
  return Array.from(scope.querySelectorAll('*')).filter(el => {
    return Array.from(el.attributes).some(attr => attr.name.startsWith(prefix));
  });
};

/**
 * Renders all elements with the given property path
 * @param {string} propertyPath 
 * @param {Document|Element} scope 
 */
export const updateElementsByProperty = (propertyPath, scope = document) => {
  // Update regular data-bind elements
  scope.querySelectorAll(`[${bindAttr}="${propertyPath}"]`)?.forEach((element) => {
    updateElement(element, propertyPath);
  });

  // Update attribute bindings - find all elements with our prefix
  getElementsWithAttrPrefix(bindAttrPrefix, scope).forEach(element => {
    // Check each attribute to see if it matches our prefix and propertyPath
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith(bindAttrPrefix) && attr.value === propertyPath) {
        const attrName = attr.name.substring(bindAttrPrefix.length);
        updateElement(element, propertyPath, attrName);
      }
    });
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
      /// Store old value to check if it's an object (for cleanup)
      /// - Compare with the new value to detect what changed
      /// - Handle cleanup of any references or listeners attached to properties of the old object
      /// - Potentially optimize updates by only updating paths that actually changed
      // const oldValue = target[property];
      
      // Set the new value
      target[property] = value;
      
      // Calculate the property path
      const propPath = path ? `${path}.${property}` : property;
      
      // Update elements with this exact property path
      updateElementsByProperty(propPath);
      
      // If the new value is an object, we need to update all its nested properties
      if (typeof value === 'object' && value !== null) {
        // Recursively find all nested properties and update them
        const updateNestedProps = (obj, objPath) => {
          Object.keys(obj).forEach(key => {
            const nestedPath = `${objPath}.${key}`;
            updateElementsByProperty(nestedPath);
            // Recursively update nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              updateNestedProps(obj[key], nestedPath);
            }
          });
        };
        updateNestedProps(value, propPath);
      }
      return true;
    }
  });
}

const setState = (state) => createDeepProxy(state);

// * State * //
export const state = setState({
  //// Testing data of various types
  // meals: {
  //   'pizza': 'with pepperoni and pineapple',
  //   meat: {
  //     1: 'Chicken',
  //     2: 'Beef',
  //     3: 'Pork',
  //   },
  //   'vegetarian': 'go away',
  // },
  // quote1: 'You either die a hero or live long enough to see yourself become the villain.',
  // quote2: 'It’s not who I am underneath, but what I do that defines me.',
  // quote3: 'Sometimes the truth isn’t good enough, sometimes people deserve more. Sometimes people deserve to have their faith rewarded.',
  // s: 'Something stringy',
  // f: 3.14159,
  // i: 69,
  // e: '',
  // n: null,
  // u: undefined,
  // a: ['one', 'two', 'three'],
  // obj: {
  //   "id": 1,
  //   "name": "A1",
  //   "price": 3500000,
  //   "status": "available",
  //   "layout": 3,
  //   "floors": 2,
  //   "amenities": {
  //     1: "Air conditioner",
  //     2: "Water heater",
  //     3: "Smart home system",
  //   },
  //   "area": 405,
  //   "date_completion": "2026-11-30"
  // },
})

/// Observe DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // * Child node was Added (or removed)
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        // console.debug("MUTATION added node: ", node);
        if (node.nodeType === Node.ELEMENT_NODE) {
          /// Update node itself if it has bindAttr
          node.hasAttribute(bindAttr) ? updateElement(node, node.getAttribute(bindAttr)) : null;
          
          /// Update node attribute bindings
          for (const attr of node.attributes) {
            if (attr.name.startsWith(bindAttrPrefix)) {
              const attrName = attr.name.substring(bindAttrPrefix.length);
              updateElement(node, attr.value, attrName);
            }
          }
          
          /// Update all descendants with bindAttr
          node.querySelectorAll(`[${bindAttr}]`).forEach((child) => {
            updateElement(child, child.getAttribute(bindAttr));
          });
          
          /// Update all descendants with attribute bindings
          getElementsWithAttrPrefix(bindAttrPrefix, node).forEach(child => {
            Array.from(child.attributes).forEach(attr => {
              if (attr.name.startsWith(bindAttrPrefix)) {
                const attrName = attr.name.substring(bindAttrPrefix.length);
                updateElement(child, attr.value, attrName);
              }
            });
          });
        }
      });
    }
    // * Attribute was modified
    else if (mutation.type === 'attributes') {
      const target = mutation.target;
      if (target.hasAttribute(bindAttr)) {
        updateElement(target, target.getAttribute(bindAttr));
      } else if (mutation.attributeName.startsWith(bindAttrPrefix)) {
        const attrName = mutation.attributeName.substring(bindAttrPrefix.length);
        updateElement(target, target.getAttribute(mutation.attributeName), attrName);
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