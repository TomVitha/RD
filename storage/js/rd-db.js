// UNUSED
import * as databind from './data-binding.js'

// GLOBAL variable for locale
let locale = 'cs-CZ' 

// fetch Google Sheets data
const sheetURL = 'https://docs.google.com/spreadsheets/d/1C7FJ0qQUQHuUrgXZ9eyC9LPq12UmR3BUcL5uiRCPEic/gviz/tq?sheet=RD_DB';

/**
 * Fetch data from Google Sheets and parse it as JSON
 * @param {string} url URL of the Google Sheet
 * @returns {Object|null} Parsed JSON data
 */
export async function fetchSheetData(url) {
  try {
    const response = await fetch(url);
    const responseText = await response.text();

    // Extract the JSON part from the response (Google's response has a prefix we need to remove)
    const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);

    // Extract headers from column labels
    const headers = data.table.cols.map(col => col.label);

    // TODO: Refactor/untangle?
    // Extract and format rows
    const tableData = data.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, index) => {
        let cellValue = cell ? cell.v : '';
        // Check if the cell value is a date string
        if (typeof cellValue === 'string' && cellValue.startsWith('Date(') && cellValue.endsWith(')')) {
          const parts = cellValue.substring(5, cellValue.length - 1).split(',');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);           // Month from Sheets (1-12)
            const day = parseInt(parts[2], 10);
            cellValue = new Date(year, month - 1, day);     // JavaScript months are 0-indexed (0-11), so subtract 1 from the month
          }
        }
        obj[headers[index]] = cellValue;
      });
      return obj;
    });

    // console.debug("Headers:", headers)
    // console.debug("Data sample:", tableData.slice(0, 2))
    return { headers, tableData };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

export function populatePriceTableWithData(propertiesData, displaySold = false) {
  // Format data to human-readable for display
  const properties = formatData(JSON.parse(JSON.stringify(propertiesData.tableData)), locale);

  const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
  const tableBody = table.querySelector('tbody');
  const tableContainer = document.querySelector('#price-table-container')

  properties.forEach(property => {

    // Sold properties are not displayed
    if (!displaySold && property['status'] === 'sold')
      return;

    const row = document.querySelector('#template-price-table-tr').content.cloneNode(true).querySelector('tr');
    row.innerHTML = mustacheReplace(row.innerHTML, property)
    tableBody.appendChild(row)
  });

  // Append table to container (while replacing any existing content)
  tableContainer.replaceChildren(table);
}

// Mustache
function mustacheReplace(html, object) {
  Object.entries(object).forEach(([key, value]) => {
    const regex = new RegExp(`{\\s*${key}\\s*}`, 'g');
    html = html.replace(regex, value);
  });
  return html;
}

function formatData(properties, locale) {
  properties.forEach(property => {

    // Price => CZK currency
    property.price = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(property['price']);

    // TODO? Untangle this mess
    // Completion date => [long month] [year] 
    if (property.date_completion) {
      // Convert to ISO string if possible, then create new Date from it
      let dateObj;
      if (typeof property.date_completion === 'object' && property.date_completion instanceof Date) {
        dateObj = property.date_completion;
      } else if (typeof property.date_completion === 'string' || typeof property.date_completion === 'number') {
        // Try to convert to Date via ISO string
        try {
          dateObj = new Date(property.date_completion);
        } catch (e) {
          dateObj = null;
        }
      }
      if (dateObj && !isNaN(dateObj)) {
        property.date_completion = dateObj.toLocaleDateString(locale, {
          month: 'long',
          year: 'numeric',
        });
      }
    }
    // Other
    property.area += ' m²';
    property.layout = property.layout + (locale.startsWith('en') ? '+kt' : '+kk');

  })
  return properties
}

function removeBox(box) {
  if (box) {
    box.remove();
    box = null;
  }
  return box;
}


// TODO: Move to a more sensible place ?
/**
 * Layout Viewer map
 */
async function LV(propertiesData) {

  // ! Pass as a DEEP COPY !
  const propertiesDataFormatted = formatData(JSON.parse(JSON.stringify(propertiesData.tableData)), locale);

  // Assign status classes to property paths
  propertiesData.tableData.forEach((property) => {
    const ele = document.getElementById(`rd-path-${property.id}`)
    ele.classList.add(`${property.status}`)
  })

  let box = null;
  let dialogBox = null;

  /**
   * Create box, fill with data, append
   * @param {Object} property 
   * @returns {Element} box
   */
  function createFillAppendBox(property) {
    box = document.querySelector("#lv-details-box").content.cloneNode(true).querySelector(".lv-details-box");
    box.setAttribute('id', `lv-details-box-${property.id}`);
    box.innerHTML = mustacheReplace(box.innerHTML, property);
    box.style.position = "fixed";
    box.style.zIndex = 10;
    document.querySelector('.layout-viewer-wrapper').appendChild(box);
    return box;
  }

  // * MOUSE POINTERS
  // ? Use mobile behavior for desktop as well ?
  // Box shows while hovering over a path
  if (window.matchMedia("(pointer: fine)").matches) {

    document.querySelectorAll('.layout-viewer-map path[id^="rd-path-"]').forEach((path) => {

      // Mouse enter (create box)
      path.addEventListener("mouseenter", (e) => {
        const matchingProperty = propertiesDataFormatted.find(
          (property) => `rd-path-${property.id}` === path.getAttribute('id')
        );
        if (!matchingProperty) {
          return;
        }
        box = createFillAppendBox(matchingProperty);
      });

      // Mouse move (reposition box)
      path.addEventListener("mousemove", (e) => {
        if (box) {
          box.style.left = (e.clientX + 15) + "px";
          box.style.top = (e.clientY + 15) + "px";
        }
      });

      // Mouse leave (remove box)
      path.addEventListener("mouseleave", () => {
        box = removeBox(box);
      });

    })

  }
  // * TOUCH SCREENS
  // Box shows on click; clicking again or outside closes box
  else {

    document.addEventListener("click", (e) => {

      const closestPath = e.target.closest(`path[id^="rd-path"]`) // NOTE: .closest() requires a selector
      const boxExists = box ? true : false
      let isSamePropertyAsOpenBox = false
      let matchingProperty = null;

      /// If click on a path, or inside it
      if (closestPath) {
        const path = closestPath;
        // console.debug("Clicked on this path: ", path);

        /// Get matching property (and validate)
        matchingProperty = propertiesDataFormatted.find(
          (property) => `rd-path-${property.id}` === path.getAttribute('id')
        );
        if (!matchingProperty) {
          console.log("No matching property for path this path:", path.id);
        } else {
          isSamePropertyAsOpenBox = (box?.id === `lv-details-box-${matchingProperty.id}`) ? true : false;
          // console.debug("Matching property: ", matchingProperty);
        }
      }

      // Remove box
      box = removeBox(box);

      // TODO: BOX AS DIALOG (on mobile)
      // WIP: BOX AS DIALOG (on mobile)


      /**
       * Conditions to create a new box:
       * - We clicked on, or inside a path
       * - Clicked path has a matching property
       * - Matching property is not the same as the open box's property
       */
      if (closestPath && matchingProperty && !isSamePropertyAsOpenBox) {
        // console.debug("CREATING A NEW BOX FOR PROPERTY: ", matchingProperty.id);
        box = createFillAppendBox(matchingProperty);
        // TODO: Avoid hard-coding positioning in JS?
        box.style.position = "fixed";
        box.style.left = 0 + "px";
        box.style.right = 0 + "px";
        box.style.bottom = 0 + "px";
        // console.debug("BOX CREATED: ", box);
      }

    });
    // End of document click handler

    // Prevent redirecting (opening link) on click
    document.querySelectorAll('.layout-viewer-map path[id^="rd-path-"]').forEach((path) => {
      path.addEventListener("click", (event) => {
        event.preventDefault();
      });

    });

  }
}

function initDataTables() {

  function stripHTMLTags(string) {
    return string.replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ');
  }

  function naturalSort(a, b, m = 1) {
    a = stripHTMLTags(a)
    b = stripHTMLTags(b)
    const out = a.localeCompare(b, locale, { numeric: true, ignorePunctuation: true });
    return out * m;
  }

  $.extend(DataTable.ext.type.order, {
    "natural-asc": function (a, b) {
      return naturalSort(a, b);
    },

    "natural-desc": function (a, b) {
      return naturalSort(a, b, -1);
    }
  });

  DataTable.defaults.column.orderSequence = ['asc', 'desc'];

  $('.price-table').DataTable({
    order: [[6, 'asc']],       // Sort by Price on init
    paging: false,
    searching: false,
    info: false,
    // BUG: Cross-origin redirection to https://cdn.datatables.net/plug-ins/2.3.0/i18n/cs.json denied by Cross-Origin Resource Sharing policy: Origin [IP ADDRESS:port] is not allowed by Access-Control-Allow-Origin. Status code: 301\
    // NOTE: Likely happens when not https (like localhost)
    // language: {
    //     url: `//cdn.datatables.net/plug-ins/2.3.0/i18n/${locale == 'cs-CZ' ? 'cs' : 'en-GB'}.json`,
    // },
    columnDefs: [
      { orderable: false, targets: [3, 7] },
      { type: 'natural', target: '_all' },
      { className: "dt-center", targets: [0, 7] },
      { className: "dt-right", targets: [6] },
    ],
    responsive: false,
    autoWidth: false,    // Fix: Corrects weird column widths, namely Price - although apparently "not recommended - can cause a problem with columns layout"
  });
}

// TODO: REPLACE WITH FANCYAPPS PANZOOM ?
// LINK: https://fancyapps.com/panzoom/guides/custom-controls/

// Panzoom
function initPanzoom(elemId = 'lv') {
  const elem = document.getElementById(elemId)
  const panzoom = Panzoom(elem, {
    cursor: 'inherit',
    pinchAndPan: true,
    panOnlyWhenZoomed: true,
    startScale: 1,
    minScale: 1,
    contain: 'outside',
    // canvas: false,
    // touchAction: 'pan-y',
  })

  // * CONTROLS
  const btnZoomIn = document.getElementById('lv-pz-zoom-in');
  const btnZoomOut = document.getElementById('lv-pz-zoom-out');
  const btnReset = document.getElementById('lv-pz-reset');

  btnZoomIn?.addEventListener('click', panzoom.zoomIn)
  btnZoomOut?.addEventListener('click', panzoom.zoomOut)
  btnReset?.addEventListener('click', panzoom.reset)


  const mapLinks = document.querySelectorAll('.layout-viewer-map a')

  // Helper function to update UI based on zoom level
  function updateZoomUI(scale) {
    const isZoomedIn = scale > 1.01;
    panzoom.setOptions({ cursor: isZoomedIn ? 'grab' : 'default' });
    if (btnReset) {
      isZoomedIn ? btnReset.classList.remove('hidden') : btnReset.classList.add('hidden');
    }
  }

  // Handle zoom events
  elem.addEventListener('panzoomzoom', (event) => {
    updateZoomUI(panzoom.getScale());
  });

  // Reset event
  elem.addEventListener('panzoomreset', (event) => {
    updateZoomUI(1); // After reset, scale is always 1
  });

  // Start grabbing
  elem.addEventListener('panzoomstart', (event) => {
    if (panzoom.getScale() > 1.01) {
      panzoom.setOptions({ cursor: 'grabbing' });
    }
  });

  // End grabbing
  elem.addEventListener('panzoomend', (event) => {
    updateZoomUI(panzoom.getScale());
  });


  // BUG: When panning with cursor over link, link is activated on click up
  elem.parentElement.addEventListener('wheel', function (event) {
    console.log(event);
    // Enables zoom with mouse wheen while holding Ctrl
    if (event.ctrlKey) {
      panzoom.zoomWithWheel(event)
    }
    // Without Ctrl, we scroll can the page
  })

  // When fully zoomed out, disable panning (allow scrolling the page)
  // FIXME: Buggy on iPad
  // NOTE: touchAction is a CSS property: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
  // BUG: Minor - Behavior doesn't work on page init, only kicks in after a touch move
  elem.addEventListener('touchmove', function (event) {
    // Allow panning
    if (panzoom.getScale() <= 1.01) {
      panzoom.setOptions({ disablePan: true, touchAction: 'pan-y' });
    }
    // Disallow panning, allows page scroll
    else {
      panzoom.setOptions({ disablePan: false, touchAction: 'none' });
    }
  })


}


// # INITIALIZATION
export async function init(loc = 'cs-CZ') {

  locale = loc; // Set global locale value

  const propertiesData = await fetchSheetData(sheetURL);
  if (!propertiesData) {
    console.error('Failed to fetch or parse data.');
    return
  }
  // console.debug('Fetched RAW data: ', propertiesData.tableData);


  $(document).ready(function () {
    populatePriceTableWithData(propertiesData, false);
    initDataTables()
    LV(propertiesData)
    initPanzoom();
  });
}