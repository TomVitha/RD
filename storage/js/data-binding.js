// LINK: https://dev.to/phoinixi/one-way-data-binding-in-vanilla-js-poc-4dj7

const bindAttr = 'data-bind' // attribute for binding data

const updateElement = (element, prop) => {
  // Set value - mainly for <input> elements + <textarea>
  if ("value" in element || element.tagName === 'TEXTAREA') {
    element.value = state[prop]
  }
  // Set inner text
  else {
    element.innerText = state[prop]
  }
}

const updateElementsByProperty = (property) => {
  document.querySelectorAll(`[${bindAttr}=${property}]`)?.forEach((element) => {
    updateElement(element, property)
  })
}

const setState = (state) => {
  // return new Proxy({...state}, {
  return new Proxy(state, {
    get(target, property) {
      // target: the state object
      // property: property name (e.g. quote1)
      // console.debug("GETTER: target: ", target, "property:", property);

      return target[property] ?? ''
    },
    set(target, property, value) {
      // console.debug("SETTER: target: ", target, "property: ", property, "value:", value);
      target[property] = value         // update the state object
      updateElementsByProperty(property)                // updates the view everytime the state changes
      return true;
    }
  })
}
const state = setState({
  quote1: 'You either die a hero or live long enough to see yourself become the villain.',
  quote2: 'It’s not who I am underneath, but what I do that defines me.',
  quote3: 'Sometimes the truth isn’t good enough, sometimes people deserve more. Sometimes people deserve to have their faith rewarded.',
})

// Observe DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // console.debug('DOM mutation detected:', mutation);
    // child node has been added or removed
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(bindAttr)) {
          // console.debug("added node", node);
          updateElement(node, node.getAttribute(bindAttr));
        }
      });
    }
    // attribute was modified
    else if (mutation.type === 'attributes') {
      const target = mutation.target;
      if (target.hasAttribute(bindAttr)) {
        // console.debug("target", target);
        updateElement(target, target.getAttribute(bindAttr));
      }
    }
  });
});

// Start observing the document body for changes
observer.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true
});

// Initialize elements
function init() {
  Object.keys(state).forEach(updateElementsByProperty);
}

// Init on page load
init(state)