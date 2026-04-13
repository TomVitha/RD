// // @ts-check

import DataTable from "https://esm.sh/datatables.net"

import { statusConfig, amenitiesConfig, specialEquipmentConfig } from './configs.js'

// GLOBAL variable for locale
let locale = 'cs-CZ'
// URL to Google Sheets data as JSON
const sheetURL = 'https://docs.google.com/spreadsheets/d/18gH8L3iCXtZgrqsGiRmtyctFtoxsOqVkLWT0ry4MUvo/gviz/tq?sheet=Etapa_1';

/**
 * Fetch data from Google Sheets and parse it as JSON
 * 
 * @returns {Promise<Object | null>} Parsed JSON data
 */
export async function fetchSheetData() {
  try {
    const response = await fetch(sheetURL);
    const responseText = await response.text();
    /// Extract the JSON part from the response (Google's response has a prefix we need to remove)
    const data = JSON.parse(responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1));
    // console.debug('Fetched RAW data: ', data);
    /// Extract headers from column labels
    const headers = data.table.cols.map(col => col.label);
    const tableData = data.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, index) => {
        let cellValue = cell ? cell.v : '';
        // Convert Google Sheets date string 'Date(yyyy,mm,dd)' to JS Date object
        if (typeof cellValue === 'string' && cellValue.startsWith('Date(') && cellValue.endsWith(')')) {
          const dateParts = cellValue.substring(5, cellValue.length - 1).split(',');
          cellValue = new Date(...dateParts);
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
  properties.forEach(property => {
    /// New property: status_text - Human-readable text of Status
    property.status_text = statusConfig[property.status]?.[locale] ?? statusConfig.unknown[locale];
    /// New property: card_url - URL to property card (PDF)
    property.card_url = `https://www.central-group.cz/storage/CG/194-RD/soubory/karty-domu/194-RD-${property.name}.pdf`;
  });
  // console.debug('Amended data:', properties);
  return properties
}

/**
 * Formats raw data into human-readable like: Adding currency symbols, units
 * 
 * @param {*} properties 
 * @param {*} locale 
 * @returns {Object} properties
 */
export function formatData(properties, locale) {
  properties.forEach(property => {

    // * Multiple options into array
    const multiOptions = ['amenities', 'orientation', 'special_equipment']
    multiOptions.forEach(option => {
      property[option] = property[option] ? property[option].split(',').map(o => o.trim()).sort() : [];
    })

    // * Price => CZK currency
    const prices = ['price_house', 'price_extras', 'price_total'];
    prices.forEach(price => {
      if (!property[price] || property[price] === '' || property[price] === '0') {
        property[price] = "-"
      } else {
        property[price] = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'CZK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(property[price]);
      }
    })

    // HACK - Model homes show special text instead of price_total
    if (property.status === "show") {
      property.price_total = statusConfig.show[locale]
    }

    // * Completion date => [long month] [year]
    property.date_completion = new Date(property.date_completion).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });

    // * Other - suffix with units
    property.area_int += ' m²';
    property.area_ext += ' m²';
    property.layout = property.layout + (locale.startsWith('en') ? '+kt' : '+kk');

  })
  return properties
}

// TODO: Deprecate
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

  const properties = formatData(structuredClone(data), locale);   // Passing a deep copy to prevent modifying original data
  const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
  const tableBody = table.querySelector('tbody');
  const tableContainer = document.querySelector('#price-table-container')

  console.warn("Populating price table with data:", properties);

  // Row for each property
  properties.forEach(property => {

    // ! Sold properties are not displayed
    if (!displaySold && property['status'] === 'sold') return;

    const row = document.querySelector('#template-price-table-tr').content.cloneNode(true).querySelector('tr');

    // Creates and displays icons for amenities (instead of text)
    property.amenities.forEach(am => {
      if (property.amenities.includes(am)) {
        const icon = document.createElement('i');
        icon.className = amenitiesConfig[am].icon;
        icon.setAttribute('title', amenitiesConfig[am].tooltip[locale]);
        icon.setAttribute('data-tippy-content', amenitiesConfig[am].tooltip[locale]);
        row.querySelector('[data-icons="amenities"]').appendChild(icon);
      }
    });

    // Creates and displays icons for special equipment (instead of text)
    property.special_equipment.forEach(eq => {
      if (property.special_equipment.includes(eq)) {
        const img = document.createElement('img');
        img.setAttribute('src', `https://www.central-group.cz/storage/CG/194-RD/img/icons/${specialEquipmentConfig[eq].filename}.svg`);
        img.setAttribute('height', '12');
        img.setAttribute('title', specialEquipmentConfig[eq].tooltip[locale]);
        img.setAttribute('data-tippy-content', specialEquipmentConfig[eq].tooltip[locale]);
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
 * Layout Viewer
 * Handles displaying details box. On desktop: 
 * 
 * @param {Object} data - Properties data
 */
export async function LV(data) {

  // Assign status class to paths
  data.forEach((property) => {
    document.getElementById(`rd-path-${property.id}`)?.classList.add(`${property.status}`)
  })

  let box = null;

  // Create box from <template>, fill with data, and append
  /**
   * @param {object} property
   */
  function createBox() {
    box = document.querySelector("#lv-details-box").content.cloneNode(true).querySelector(".lv-details-box");
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
        box = createBox();
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
        event.preventDefault(); // Prevent opening link on click
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
export function setupDataTables() {

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
  const table = new DataTable('#price-table', {
    order: [[0, 'asc']],                                              // Default column to sort by
    columnDefs: [                                                     // Column-specific definitions
      { type: 'natural', target: '_all' },                              // Sorty by Natural sort
      { orderable: false, targets: [2, 6, 11] },                        // Disable ordering
      { className: "dt-center", targets: [0, 1, 2, 5, 6, 11] },         // Center align text
      { className: "dt-right", targets: [3, 4, 7, 8, 9, 10] },          // Right align text
      { className: "bold", targets: [10] },                             // Final price is always bold
    ],
    // ERROR: Cross-origin redirection to https://cdn.datatables.net/plug-ins/2.3.0/i18n/cs.json denied by Cross-Origin Resource Sharing policy: Origin [IP ADDRESS:port] is not allowed by Access-Control-Allow-Origin. Status code: 301\
    // NOTE: Likely happens when not over https (like on localhost). Uncomment in PROD and it should work fine
    // language: {
    //     url: `//cdn.datatables.net/plug-ins/2.3.0/i18n/${locale == 'cs-CZ' ? 'cs' : 'en-GB'}.json`,
    // },
    responsive: false,
    autoWidth: false,    // FIX: Corrects weird column widths
    paging: false,
    searching: false,
    info: false,
  });
}


/**
 * Initializes
 * 
 * @param {string} loc - Locale 'cs-CZ' or 'en-US' (defaults to 'cs-CZ')
 */
export async function initDb(loc = 'cs-CZ') {

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
  amendPropertiesData(propertiesData.tableData);
  populatePriceTableWithData(propertiesData.tableData, false);
  setupDataTables()
  LV(propertiesData.tableData)
}

