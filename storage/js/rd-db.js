// DIY two-way data binding
import * as databind from './data-binding.js'

// GLOBAL variable for locale
let locale = 'cs-CZ'

// URL to Google Sheets data as JSON
const sheetURL = 'https://docs.google.com/spreadsheets/d/1C7FJ0qQUQHuUrgXZ9eyC9LPq12UmR3BUcL5uiRCPEic/gviz/tq?sheet=Etapa_1';


// Close dialog by clicking outside of it
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});



/**
 * Fetch data from Google Sheets and parse it as JSON
 * 
 * @param {string} url URL of the Google Sheet
 * @returns {Object|null} Parsed JSON data
 */
export async function fetchSheetData(url) {
  try {
    const response = await fetch(url);
    const responseText = await response.text();

    // Extract the JSON part from the response (Google's response has a prefix we need to remove)
    const data = JSON.parse(responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1));

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
    return { headers, tableData };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

/**
 * Amends the original data with additional data not present in the original sheet
 * 
 * @param {Array} properties
 */
export function amendPropertiesData(properties) {

  // Text corresponding to status codes
  const statusMapping = {
    "available": {
      "cs-CZ": "Volný",
      "en-US": "Available"
    },
    "under-offer": {
      "cs-CZ": "V jednání",
      "en-US": "Under offer"
    },
    "sold": {
      "cs-CZ": "Prodaný",
      "en-US": "Sold"
    },
    "unknown": {
      "cs-CZ": "Neznámý",
      "en-US": "Unknown"
    },
  };

  // Amend each property
  properties.forEach(property => {
    // New property: status_text - Human-readable text of Status
    property.status_text = statusMapping[property.status]?.[locale] ?? statusMapping.unknown[locale];
    // New property: card_url - URL to property card (PDF)
    property.card_url = `https://www.central-group.cz/storage/CG/194-RD/karty-domu/194-RD-${property.name}.pdf`;
  });

  console.debug('Amended data:', properties);
}

/**
 * Primitive DYI Templating
 * (Imitating template syntax in Vue.js, Mustache.js, Handlebars.js etc.)
 * 
 * @param {string} html 
 * @param {object} object 
 * @returns 
 */
function mustacheReplace(html, object) {
  Object.entries(object).forEach(([key, value]) => {
    const regex = new RegExp(`{\\s*${key}\\s*}`, 'g');
    html = html.replace(regex, value);
  });
  return html;
}

/**
 * Creates a table row for each property
 * Replaces template variables in the row and creates icons for amenities and special equipment
 * 
 * @param {object} data 
 * @param {boolean} displaySold 
 */
export function populatePriceTableWithData(data, displaySold = false) {

  const properties = formatData(JSON.parse(JSON.stringify(data)), locale);
  const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
  const tableBody = table.querySelector('tbody');
  const tableContainer = document.querySelector('#price-table-container')

  // Row for each property
  properties.forEach(property => {

    // ! Sold properties are not displayed
    if (!displaySold && property['status'] === 'sold')
      return;

    const row = document.querySelector('#template-price-table-tr').content.cloneNode(true).querySelector('tr');


    // * Amenities (Příslušenství)
    // Associates font awesome icon class, and name with tooltip text in both locales
    const amenitiesConfig = {
      "B": {
        icon: "fa-solid fa-square-b",
        name: {
          "cs-CZ": "Balkón",
          "en-US": "Balcony"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje balkón",
          "en-US": "Property includes a balcony"
        }
      },
      "G": {
        icon: "fa-solid fa-square-g",
        name: {
          "cs-CZ": "Garáž",
          "en-US": "Garage"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje uzavřené garážové stání",
          "en-US": "Property includes a garage"
        }
      },
      "P": {
        icon: "fa-solid fa-square-p",
        name: {
          "cs-CZ": "Parkování",
          "en-US": "Parking"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje parkovací stání",
          "en-US": "Property includes parking space"
        }
      },
      "S": {
        icon: "fa-solid fa-square-s",
        name: {
          "cs-CZ": "Sklep",
          "en-US": "Cellar"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje sklep",
          "en-US": "Property includes a cellar"
        }
      },
      "T": {
        icon: "fa-solid fa-square-t",
        name: {
          "cs-CZ": "Terasa",
          "en-US": "Terrace"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje terasu",
          "en-US": "Property includes a terrace"
        }
      },
      "Z": {
        icon: "fa-solid fa-square-z",
        name: {
          "cs-CZ": "Zahrada",
          "en-US": "Garden"
        },
        tooltip: {
          "cs-CZ": "Nemovitost zahrnuje zahradu",
          "en-US": "Property includes a garden"
        }
      },
    };

    // Creates and displays icons for amenities (instead of text)
    property.amenities.forEach(acc => {
      if (property.amenities.includes(acc)) {
        const icon = document.createElement('i');
        icon.className = amenitiesConfig[acc].icon;
        icon.setAttribute('title', amenitiesConfig[acc].tooltip[locale]);
        icon.setAttribute('data-tippy-content', amenitiesConfig[acc].tooltip[locale]);
        row.querySelector('[data-icons="amenities"]').appendChild(icon);
      }
    });


    // * Special equipment (Speciální vybavení)
    // Associates with icon's filename, and tooltip text in both locales
    const specialEquipmentConfig = {
      "klima": {
        filename: "klima",
        tooltip: {
          "cs-CZ": "V ceně je klimatizace.",
          "en-US": "Air conditioning included."
        }
      },
      "rekuperace": {
        filename: "rekuperace",
        tooltip: {
          "cs-CZ": "V ceně je rekuperace bez dochlazování.",
          "en-US": "Price includes heat recovery without after cooling."
        }
      },
      "rolety": {
        filename: "zaluzie",
        tooltip: {
          "cs-CZ": "V ceně jsou předokenní rolety.",
          "en-US": "Price includes external blinds."
        }
      },
      "rolety-priprava": {
        filename: "zaluzie-priprava",
        tooltip: {
          "cs-CZ": "V ceně je elektropříprava pro venkovní rolety.",
          "en-US": "Price includes wiring for external roller shutters."
        }
      },
      "rolety-priprava-cast": {
        filename: "zaluzie-priprava-cast",
        tooltip: {
          "cs-CZ": "V ceně je elektropříprava pro venkovní rolety u části oken.",
          "en-US": "Price includes wiring for external roller shutters for some windows."
        }
      },
    }

    // Creates and displays icons for special equipment (instead of text)
    property.special_equipment.forEach(eq => {
      if (property.special_equipment.includes(eq)) {
        const img = document.createElement('img');
        img.setAttribute('src', `https://www.central-group.cz/storage/CG/194-RD/img/icons/${specialEquipmentConfig[eq].filename}.svg`);
        img.setAttribute('height', '12');
        img.setAttribute('title', specialEquipmentConfig[eq].tooltip[locale]);
        img.classList.add('price-table__icon');
        row.querySelector('[data-icons="special_equipment"]').appendChild(img);
      }
    });

    row.innerHTML = mustacheReplace(row.innerHTML, property)  // Replace template variables
    tableBody.appendChild(row)                                // Append row to table body
  });

  // Append table to container (while replacing any existing content)
  tableContainer.replaceChildren(table);
}

/**
 * Formats raw data into human-readable like: Adding currency symbols, units
 * 
 * @param {*} properties 
 * @param {*} locale 
 * @returns {Object} properties
 */
function formatData(properties, locale) {
  properties.forEach(property => {

    // * Multiple options into array
    const multiOptions = ['amenities', 'orientation', 'special_equipment']
    multiOptions.forEach(option => {
      property[option] = property[option] ? property[option].split(',').map(o => o.trim()).sort() : [];
    })

    // * Price => CZK currency
    const prices = ['price_house', 'price_extras', 'price_total'];
    prices.forEach(price => {
      property[price] = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(property[price]);
    })


    // * Completion date => [long month] [year] 
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

    // * Other - suffix with units
    property.area_int += ' m²';
    property.area_ext += ' m²';
    property.layout = property.layout + (locale.startsWith('en') ? '+kt' : '+kk');

  })
  return properties
}



/**
 * Layout Viewer
 * Handles displaying details box. On desktop: 
 * 
 * @param {Object} data - Properties data
 */
async function LV(data) {

  const propertiesDataFormatted = formatData(JSON.parse(JSON.stringify(data)), locale);   // ! Must be passed as a DEEP COPY !

  // Assign status class to paths
  data.forEach((property) => {
    document.getElementById(`rd-path-${property.id}`)?.classList.add(`${property.status}`)
  })

  let box = null;
  let matchingProperty = null;

  // Create box from <template>, fill with data, and append
  function createBox(property) {
    box = document.querySelector("#lv-details-box").content.cloneNode(true).querySelector(".lv-details-box");
    box.setAttribute('id', `lv-details-box-${property.id}`);
    box.innerHTML = mustacheReplace(box.innerHTML, property);
    box.style.position = "fixed";
    box.style.zIndex = 10;
    document.querySelector('.layout-viewer-wrapper').appendChild(box);
    return box;
  }

  // Remove existing box
  function removeBox(box) {
    if (box) {
      box.remove();
      box = null;
    }
    return box;
  }

  // * MOUSE POINTERS -- Box shows while hovering over a path
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
        box = createBox(matchingProperty);
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
  // * TOUCH SCREENS -- Box as <dialog>
  else {
    document.querySelectorAll('.layout-viewer-map path[id^="rd-path-"]').forEach((path) => {
      path.addEventListener("click", (event) => {

        /// Prevent opening link on click
        event.preventDefault();

        /// Get matching property (according to ID)
        matchingProperty = propertiesDataFormatted.find(
          (property) => `rd-path-${property.id}` === path.getAttribute('id')
        );

        if (!matchingProperty)
          return;

        // Bind elements
        databind.state.selectedproperty = matchingProperty;
        document.querySelector("#lv-details-box-dialog").showModal();
      });
    });
  }
}



/**
 * Initializes DataTables on the Price Table
 * 
 * @see {@link https://datatables.net/}
 */
function initDataTables() {

  // Helper function to remove HTML tags (and replace non-breaking space with regular space)
  function stripHTMLTags(string) {
    return string.replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ');
  }

  // Custom sort function
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

  // Initialization
  $('#price-table').DataTable({
    order: [[0, 'asc']],       // Default column to sort by
    columnDefs: [
      { type: 'natural', target: '_all' },                              // Sorty by Natural sort
      { orderable: false, targets: [6, 11] },                           // Disable ordering
      { className: "dt-center", targets: [0, 1, 2, 5, 6, 11] },         // Center align text
      { className: "dt-right", targets: [3, 4, 7, 8, 9, 10] },          // Right align text
      { className: "bold", targets: [10] },                             // Final price is always bold
    ],
    // BUG: Cross-origin redirection to https://cdn.datatables.net/plug-ins/2.3.0/i18n/cs.json denied by Cross-Origin Resource Sharing policy: Origin [IP ADDRESS:port] is not allowed by Access-Control-Allow-Origin. Status code: 301\
    // NOTE: Likely happens when not using https (like on localhost)
    // language: {
    //     url: `//cdn.datatables.net/plug-ins/2.3.0/i18n/${locale == 'cs-CZ' ? 'cs' : 'en-GB'}.json`,
    // },
    responsive: false,
    autoWidth: false,    // Fix: Corrects weird column widths
    paging: false,
    searching: false,
    info: false,
  });
}


// ! NOT USED
/**
 * Initializes Panzoom on Layout Viewer map
 * 
 * @see {@link https://github.com/timmywil/panzoom}
 * @see {@link https://timmywil.com/panzoom/demo/}
 */
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

  // Controls
  const controls = document.getElementById('lv-pz-controls');
  const btnZoomIn = document.getElementById('lv-pz-zoom-in');
  const btnZoomOut = document.getElementById('lv-pz-zoom-out');
  const btnReset = document.getElementById('lv-pz-reset');

  btnZoomIn?.addEventListener('click', panzoom.zoomIn)
  btnZoomOut?.addEventListener('click', panzoom.zoomOut)
  btnReset?.addEventListener('click', panzoom.reset)


  // Unhide controls
  controls.removeAttribute('hidden')

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
    // Enables zoom with mouse wheen (only) while holding Ctrl
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


// # PAGE LOAD INITIALIZATION
/**
 * Initializes the page
 * 
 * @param {string} loc - Locale 'cs-CZ' or 'en-US' (defaults to 'cs-CZ')
 */
export async function init(loc = 'cs-CZ') {

  // Set global locale value
  locale = loc; 

  // Fetch data
  const propertiesData = await fetchSheetData(sheetURL);
  if (!propertiesData) {
    console.error('Failed to fetch or parse data.');
    return
  }
  console.debug('Fetched RAW data: ', propertiesData.tableData);

  // * Initialize the rest
  $(document).ready(function () {
    amendPropertiesData(propertiesData.tableData);
    populatePriceTableWithData(propertiesData.tableData, false);
    initDataTables()
    LV(propertiesData.tableData)
    // initPanzoom();     // We won't be using Panzoom
  });
}