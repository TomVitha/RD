// ?  FANCYBOX  ? //
try {
    // Initialization
    Fancybox.bind('[data-fancybox]', {
        Carousel: {
            transition: "slide",
        },
        dragToClose: false,
        l10n: Fancybox.l10n.cs,     // Czech language for UI
        Thumbs: {
            showOnStart: false,
            type: "classic",
        },
        Toolbar: {
            display: {
                left: [
                    "thumbs",
                    "infobar",
                ],
                middle: [
                    "zoomIn",
                    "zoomOut",
                ],
                right: [
                    "close"
                ],
            },
        },
    });
} catch (error) {
    console.warn('Fancybox failed', error);
}


$(document).ready(function () {

    //* Expand button for layout viewer
    $('[data-lv-expand]').on('click', function (event) {
        console.log($(this))
        event.preventDefault();                                             // Prevent default action for <a> elements
        event.stopPropagation();                                            // Prevent event from bubbling up
        const parentLV = $(this).parents('.layout-viewer')[0]               // Get the closest
        console.log(parentLV)                          // Log the parent layout viewer element
        $(parentLV).toggleClass('expanded')                 // Toggle the expanded class on the layout viewer
        $(this).children('[class*="fa-"]').toggleClass('fa-expand fa-compress');
    })

    
})


// fetch Google Sheets data, parse and display it in table
const url = 'https://docs.google.com/spreadsheets/d/1C7FJ0qQUQHuUrgXZ9eyC9LPq12UmR3BUcL5uiRCPEic/gviz/tq?sheet=RD_DB';

// Fetch data from Google Sheets and parse it as JSON
async function fetchSheetData() {
    try {
        const response = await fetch(url);
        const responseText = await response.text();
        // Extract the JSON part from the response (Google's response has a prefix we need to remove)
        const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);

        // console.debug("Raw data:", data);
        
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
        
        // console.debug("Headers:", headers);
        // console.debug("Data sample:", tableData.slice(0, 2));
        
        return { headers, tableData };
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Display data in a table format
function generateTableWithData(headers, tableData, locale = 'cs-CZ', displaySold = false, displayHeader = true) {
    const table = document.createElement('table');
    const container = document.querySelector('#price-table-container');
    table.className = 'price-table';

    // Create table head
    if (displayHeader) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        const detailTh = document.createElement('th');
        headerRow.appendChild(detailTh);

        table.appendChild(thead);
        thead.appendChild(headerRow);
    }

    // Create table body
    const tbody = document.createElement('tbody');
    tableData.forEach(row => {
        // If status is sold, skip this row
        if (!displaySold && row.status.toString() === 'sold') {
            return;
        }

        const tr = document.createElement('tr');
        headers.forEach(header => {

            const td = document.createElement('td');
            let cellData = row[header];

            // Convert date cells to locale-formatted strings
            if (cellData instanceof Date) {
                cellData = new Intl.DateTimeFormat(locale, {
                    month: 'long',
                    year: 'numeric',
                }).format(cellData);
            }

            // Format 'price' cell as currency
            if (header.startsWith('price') && typeof cellData === 'number') {
                cellData = new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'CZK',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(cellData);
            }

            // Prepend 'name' with fa status icon
            if (header === 'name') {
                cellData = `<i class="fa-solid fa-circle property-status ${row.status}"></i> ${cellData}`;
                td.innerHTML = cellData; // Set innerHTML to allow HTML content
            }

            // Suffix area units
            if (header.startsWith('area')) {
                cellData += ' m²';
            }

            // Suffix layout
            if (header === 'layout') {
                if (locale === 'cs-CZ') 
                    cellData += '+kk';   
                else
                    cellData += '+kt';
            }

            td.innerHTML = cellData;

            tr.appendChild(td);
        });

        // Add the action button cell at the end of the row
        const detailTd = document.createElement('td');

        const btnDetail = document.getElementById('price-table__detail-btn').content.cloneNode(true).querySelector('a');
        btnDetail.setAttribute('href', row.id);

        detailTd.appendChild(btnDetail);
        tr.appendChild(detailTd);
        
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    // Append the table to the container
    container.innerHTML = '';               // Clear existing content
    container.appendChild(table);

}

function populateTemplateTableWithData(data, locale = 'cs-CZ') {
    const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
    const tableBody = table.querySelector('tbody');
    const tableContainer = document.querySelector('#price-table-container')

    data.forEach(property => {
          const row = tableBody.insertRow();

          row.insertCell().innerHTML = property['name']
          
          row.insertCell().innerHTML = property['floors']

          const layoutCell = row.insertCell();
          layoutCell.innerHTML = property['layout'] + (locale.startsWith('en-') ? '+kt' : '+kk');

          row.insertCell().innerHTML = property['accessories']

          row.insertCell().innerHTML = property['area'] + ' m²'

          row.insertCell().innerHTML = new Intl.DateTimeFormat(locale, {
                                          month: 'long',
                                          year: 'numeric',
                                      }).format(property['date_completion']);

          row.insertCell().innerHTML = new Intl.NumberFormat(locale, {
                                          style: 'currency',
                                          currency: 'CZK',
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                      }).format(property['price']);

          const detailsBtn = document.getElementById('price-table__detail-btn').content.cloneNode(true).querySelector('a');
          detailsBtn.setAttribute('href', `/temp/B${property['id']}.pdf`);
          row.insertCell().appendChild(detailsBtn);
    });

    tableContainer.innerHTML = '';      // Clear existing content
    tableContainer.appendChild(table);
    console.debug(table);

}

// Example usage
async function initializeData() {
    const propertiesData = await fetchSheetData();
    if (propertiesData) {
        //// generateTableWithData(propertiesData.headers, propertiesData.tableData);
        populateTemplateTableWithData(propertiesData.tableData);
    }
}

// Call the function
initializeData();