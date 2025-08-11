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

// # INITIALIZATION
export async function init(locale) {
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
            // FIXME: Throws error on iOS; TEMP OFF
            // Cross-origin redirection to https://cdn.datatables.net/plug-ins/2.3.0/i18n/cs.json denied by Cross-Origin Resource Sharing policy: Origin [IP ADDRESS:port] is not allowed by Access-Control-Allow-Origin. Status code: 301
            // language: {
            //     url: `//cdn.datatables.net/plug-ins/2.3.0/i18n/${locale == 'cs-CZ' ? 'cs' : 'en-GB'}.json`,
            // },
            columnDefs: [
                { orderable: false, targets: [3, 7] },
                // { type: 'natural-nohtml', target: '_all' },
                { type: 'natural', target: '_all' },
                { className: "dt-center", targets: [0, 7] },
                { className: "dt-right", targets: [6] },
                // { width: '40%', targets: 3 },
                // { width: '0%', targets: 6 },
            ],
            responsive: false,
            autoWidth: false,    // Fixes wonky column widths, namely Price - although apparently "not recommended - can cause a problem with columns layout"
        });
    });

}
/**
 * Layout Viewer map
 */
// WIP
// HACK: HACK! THIS IS MESSY AND AWFUL. I HATE EVERYTHING ABOUT THIS.
// TEMP: IIFE
// TODO: Move to a more sensible place
(async function LV() {
    const propertiesData = await fetchSheetData();
    if (!propertiesData) {
        console.error('Failed to fetch or parse data.');
        return
    }

    document.querySelectorAll('.layout-viewer-map path[id^="rd-path-"]').forEach((path) => {
        let box = null;
        path.addEventListener("mouseenter", (e) => {
            const matchedProperty = propertiesData.tableData.find(
            (property) => `rd-path-${property.id}` === path.getAttribute('id')
            );
            if (!matchedProperty) {
            console.warn('No matching property found for path:', path.getAttribute('id'));
            return;
            }

            box = document.querySelector("#lv-details-box").content.cloneNode(true).querySelector(".rd-details-box");
            box.querySelector(".rd-details-box__id").textContent = matchedProperty.id;
            box.querySelector(".rd-details-box__name").textContent = matchedProperty.name;
            box.querySelector(".rd-details-box__price").textContent = matchedProperty.price;
            box.querySelector(".rd-details-box__status").textContent = matchedProperty.status;
            box.querySelector(".rd-details-box__layout").textContent = matchedProperty.layout;
            box.querySelector(".rd-details-box__floors").textContent = matchedProperty.floors;
            box.querySelector(".rd-details-box__accessories").textContent = matchedProperty.accessories;
            box.querySelector(".rd-details-box__area").textContent = matchedProperty.area;
            box.querySelector(".rd-details-box__date").textContent = matchedProperty.date_completion.toLocaleDateString('cs-CZ', {
                month: 'long',
                year: 'numeric',    
            });
            document.querySelector('.layout-viewer').appendChild(box);

            //// Initial position
            // box.style.position = "absolute";
            // box.style.pointerEvents = "none";
            // box.style.zIndex = 1000;
        });

        path.addEventListener("mousemove", (e) => {
            if (box) {
            const offset = 15;
            // box.style.position = "fixed";
            box.style.left = (e.clientX + offset) + "px";
            box.style.top = (e.clientY + offset) + "px";
            }
        });

        path.addEventListener("mouseleave", () => {
            if (box) {
            box.remove();
            box = null;
            }
        });
    })
})();