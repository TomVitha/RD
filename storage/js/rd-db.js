// fetch Google Sheets data
const url = 'https://docs.google.com/spreadsheets/d/1C7FJ0qQUQHuUrgXZ9eyC9LPq12UmR3BUcL5uiRCPEic/gviz/tq?sheet=RD_DB';

// Fetch data from Google Sheets and parse it as JSON
export async function fetchSheetData() {
  try {
    const response = await fetch(url);
    const responseText = await response.text();
    // Extract the JSON part from the response (Google's response has a prefix we need to remove)
    const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);

    // Extract headers from column labels
    const headers = data.table.cols.map(col => col.label);

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

export function populateTemplateTableWithData(propertiesData, locale = 'cs-CZ', displaySold = false) {
  const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
  const tableBody = table.querySelector('tbody');
  const tableContainer = document.querySelector('#price-table-container')

  propertiesData.forEach(property => {
    // Sold properties are not displayed
    if (!displaySold && property['status'] === 'sold')
      return;

    // Create and insert row
    const row = tableBody.insertRow();

    // Set attribute data-status to row
    row.setAttribute('data-status', property['status']);

    /// CELLS
    // Name
    //// row.insertCell().innerHTML = `<i class="fa-solid fa-circle property-status" aria-hidden="true"></i>` + property['name']
    // row.insertCell().innerHTML = `<i class="fa-solid fa-circle property-status ${property['status']}" aria-hidden="true"></i>` + property['name']
    row.insertCell().innerHTML = `<span class="property-status ${property['status']} dot" aria-hidden="true">${property['status']}</span>` + property['name']
    // Floors (number of floors)
    row.insertCell().innerHTML = property['floors']
    // Layout (number of rooms)
    row.insertCell().innerHTML = property['layout'] + (locale.startsWith('en') ? '+kt' : '+kk');
    // Accessories
    row.insertCell().innerHTML = property['accessories']
    // Area (internal)
    row.insertCell().innerHTML = property['area'] + ' m²'
    // Completion date
    row.insertCell().innerHTML = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(property['date_completion']);
    // Price
    row.insertCell().innerHTML = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(property['price']);
    // Detail PDF Card
    // TEMP File URL
    row.insertCell().appendChild(
      document.querySelector('#price-table__detail-btn').content.cloneNode(true).querySelector('a')
    ).setAttribute('href', `./temp/B1.pdf`);
  });

  // Append table to container (while replacing any existing content)
  tableContainer.replaceChildren(table);
}

function stripHTMLTags(string) {
  return string.replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ');
}

// Mustache
function mustacheReplace(html, object) {
  Object.entries(object).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    html = html.replace(new RegExp(placeholder, 'g'), value);
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


/**
 * Layout Viewer map
 */
// WIP
// TODO: Move to a more sensible place ?
async function LV(propertiesData, locale) {

  // NOTE: Pass as a DEEP COPY !
  const propertiesDataFormatted = formatData(JSON.parse(JSON.stringify(propertiesData.tableData)), locale);

  // console.debug("propertiesData: ", propertiesData);
  // console.debug("propertiesDataFormatted: ", propertiesDataFormatted);

  let box = null;

  /**
   * Create box, fill with data, append
   * @param {Object} property 
   * @returns {Element} box
   */
  function createFillAppendBox(property) {
    box = document.querySelector("#lv-details-box").content.cloneNode(true).querySelector(".lv-details-box");
    box.setAttribute('id', `lv-details-box-${property.id}`);
    box.innerHTML = mustacheReplace(box.innerHTML, property)
    document.querySelector('.layout-viewer').appendChild(box);
    return box;
  }

  // MOUSE POINTERS
  // ? Use mobile behavior for desktop as well ?
  // Box shows while hovering over a path
  //// TEMP
  //if (false) {
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
  // TOUCH SCREENS
  // Box shows on click; clicking again or outside closes box
  else {

    document.addEventListener("click", (e) => {

      const closestPath = e.target.closest(`path[id^="rd-path"]`) // NOTE: .closest() requires a selector
      const boxExists = box ? true : false
      let isSamePropertyAsOpenBox = false
      let matchingProperty = null;

      // * Determine if we clicked on a path, and the path is different than current (=> will create a new box)

      /// If click on a path, or inside it
      if (closestPath) {
        const path = closestPath;
        console.debug("Clicked on this path: ", path);

        /// Get matching property (and validate)
        matchingProperty = propertiesDataFormatted.find(
          (property) => `rd-path-${property.id}` === path.getAttribute('id')
        );
        if (!matchingProperty) {
          console.log("No matching property for path this path:", path.id);
        } else {
          isSamePropertyAsOpenBox = (box?.id === `lv-details-box-${matchingProperty.id}`) ? true : false;
          console.debug("Matching property: ", matchingProperty);
        }

      }

      box = removeBox(box);

      /**
       * Conditions to create a new box:
       * - We clicked on, or inside a path
       * - Clicked path has a matching property
       * - Matching property is not the same as the open box's property
       */
      if (closestPath && matchingProperty && !isSamePropertyAsOpenBox) {
        console.debug("CREATING A NEW BOX FOR PROPERTY: ", matchingProperty.id);
        box = createFillAppendBox(matchingProperty);
        // WIP: Position
        box.style.position = "fixed";
        box.style.left = 0 + "px";
        box.style.right = 0 + "px";
        box.style.bottom = 0 + "px";
        console.debug("BOX CREATED: ", box);
      } else {
        console.debug("Box NOT created")
      }

    });
    // End of document click handler

    document.querySelectorAll('.layout-viewer-map path[id^="rd-path-"]').forEach((path) => {

      // Click on path
      path.addEventListener("click", (event) => {
        // Prevent redirect
        event.preventDefault();
      });

    });

  }
}

function initDataTable(locale) {
  function naturalSort(a, b, multiplier = 1) {
    a = stripHTMLTags(a)
    b = stripHTMLTags(b)
    // console.debug('Natural sort: ', a, b);
    const out = a.localeCompare(b, locale, { numeric: true, ignorePunctuation: true });
    return out * multiplier;
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
    // FIXME: Throws following error on iOS: Cross-origin redirection to https://cdn.datatables.net/plug-ins/2.3.0/i18n/cs.json denied by Cross-Origin Resource Sharing policy: Origin [IP ADDRESS:port] is not allowed by Access-Control-Allow-Origin. Status code: 301\
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
    autoWidth: false,    // Fixes wonky column widths, namely Price - although apparently "not recommended - can cause a problem with columns layout"
  });
}

// # navigation Fix
// TODO: Move to separate file ?
function navigationFix() {

  // Prevents page reload on:
  // Links with no href, links with empty href, links with href starting with # (anchor links)
  document.querySelectorAll('a:not([href]), a[href=""], a[href^="#"]').forEach(element => {
    element.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });

  // Anchor links navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {

      e?.preventDefault();     // Redundant - already prevented by preventDefaults()

      let ele = document.querySelector(this.getAttribute("href"));
      let fragment = this.getAttribute("href");

      // history.pushState({}, "", fragment)      // Adds entry to the browser's session history
      history.replaceState({}, "", fragment)      // Replaces current history entry

      if (ele) {
        ele.scrollIntoView();
      }

    });
  });
}

// # INITIALIZATION
export async function init(locale = 'cs-CZ') {

  const propertiesData = await fetchSheetData();
  if (!propertiesData) {
    console.error('Failed to fetch or parse data.');
    return
  }
  // console.debug('Fetched data: ', propertiesData.tableData);

  populateTemplateTableWithData(propertiesData.tableData, locale, false);
  const priceTable = document.querySelector('.price-table');
  if (!priceTable) {
    console.error("Table .price-table not found after populating data.");
    return
  }

  $(document).ready(function () {
    initDataTable(locale)
    LV(propertiesData, locale);
    navigationFix()
  });

}