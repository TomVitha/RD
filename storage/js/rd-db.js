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

export function populateTemplateTableWithData(data, locale = 'cs-CZ', displaySold = false) {
    const table = document.querySelector('#template-price-table').content.cloneNode(true).querySelector('table');
    const tableBody = table.querySelector('tbody');
    const tableContainer = document.querySelector('#price-table-container')

    data.forEach(property => {
        // Sold properties are not displayed
        if (!displaySold && property['status'] === 'sold')
            return;

        const row = tableBody.insertRow();
        // Set attribute data-status
        row.setAttribute('data-status', property['status']);

        // Name
        row.insertCell().innerHTML = `<i class="fa-solid fa-circle property-status ${property['status']}" aria-hidden="true"></i>` + property['name']
        // Floors (number of floors)
        row.insertCell().innerHTML = property['floors']
        // Layout (number of rooms)
        row.insertCell().innerHTML = property['layout'] + (locale.startsWith('en-') ? '+kt' : '+kk');
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
        row.insertCell().appendChild(
            document.querySelector('#price-table__detail-btn').content.cloneNode(true).querySelector('a')
        ).setAttribute('href', `/temp/B${property['id']}.pdf`);
    });

    // Append table to container (while replacing any existing content)
    tableContainer.replaceChildren(table);
    console.debug(table);
}
