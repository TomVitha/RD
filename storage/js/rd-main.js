import { fetchSheetData, populateTemplateTableWithData } from './rd-db.js';

// ! NOTE: This will change depending on the CZ or EN version of the script
// const locale = 'cs-CZ';
const locale = 'en-US';

async function init(locale) {
    const propertiesData = await fetchSheetData();
    if (!propertiesData) {
        console.error('Failed to fetch or parse data.');
        return 
    }
    populateTemplateTableWithData(propertiesData.tableData, locale, true);
    const priceTable = document.querySelector('.price-table');
    if (!priceTable) {
        console.error("Table .price-table not found after populating data.");
        return
    }
    
    // Add functionality to headers to sort the table
    document.querySelectorAll('.price-table th.sortable').forEach(sortableTh => {
        sortableTh.addEventListener('click', function() {
            console.debug('This sortable table head clicked: ', this)
            sortTable(priceTable, sortableTh.cellIndex, "asc", locale)
        });
    });

    // !!! TODO: TH on click always sorts by ascending
    // !!! TODO: Cell class switching temp disabled

    // On page load, sort the table by the 7th column (price)
    sortTable(priceTable, 6, "asc", locale);
}

// Natural sorting
function naturalSortTable(table, index, dir = "asc", locale = 'cz-CZ') {
    // Get all rows from tbody only
    const rows = Array.from(table.querySelectorAll('tbody tr'));
  
    // Sort options for localeCompare
    const sortOptions = {
        numeric: true,        // Enable natural sorting for numbers
        sensitivity: 'accent',
    };

    // Sort the rows
    rows.sort((rowA, rowB) => {
        // Get cell contents
        const cellA = rowA.cells[index].textContent.trim();
        const cellB = rowB.cells[index].textContent.trim();

        // Use localeCompare with natural sorting
        const result = cellA.localeCompare(cellB, locale, sortOptions);

        // Apply sorting direction
        return dir === "asc" ? result : -result;
    });
  
    // Remove rows from DOM and re-append in sorted order
    const parent = rows[0].parentNode;
    const fragment = document.createDocumentFragment();
    rows.forEach(row => fragment.appendChild(row));
    parent.appendChild(fragment);
}

function sortTable(table, columnIndex, dir, locale = 'cs-CZ') {
    naturalSortTable(table, columnIndex, dir, locale);

    // ! Cell Formatting/Highlighting - temp off for now
    //* COPIED
    /*
    if (!thToBeSortedBy.hasClass("active")) {
        // New column selected - reset siblings and set ascending
        dir = "asc";
        thToBeSortedBy.siblings().removeClass("active asc desc");
        thToBeSortedBy.addClass("active asc");
    } else {
        // Toggle between ascending and descending
        dir = thToBeSortedBy.hasClass("asc") ? "desc" : "asc";
        thToBeSortedBy.toggleClass("asc desc");
    }

    // Remove existing cell highlighting
    table.querySelectorAll('tbody td').forEach(cell => cell.classList.remove('active'));
    
    // Highlight cells in sorted column
    table.querySelectorAll("tbody tr").forEach(row => {
        row.querySelectorAll('td')[columnIndex].classList.add('active');
    });
    */
    //* COPIED (end)
}


function cellsFunctionality(table) {
    $(".price-table th.sortable").on("click", function() {
        let dir;
        const th = $(this)

        // Get column index and sort the table
        const index = $(".price-table th").index(this);
        naturalSortTable(table, index, dir);

        if (!th.hasClass("active")) {
            // New column selected - reset siblings and set ascending
            dir = "asc";
            th.siblings().removeClass("active asc desc");
            th.addClass("active asc");
        } else {
            // Toggle between ascending and descending
            dir = th.hasClass("asc") ? "desc" : "asc";
            th.toggleClass("asc desc");
        }
        
        // Remove existing cell highlighting
        const activeCells = table.querySelectorAll('tbody td');
        activeCells.forEach(cell => cell.classList.remove('active'));
        
        // Highlight cells in sorted column
        table.querySelectorAll("tbody tr").forEach(row => {
            row.querySelectorAll('td')[index].classList.add('active');
        });
    });
}

// ! Initialize the table
init(locale); 


// # FANCYBOX # //
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
        console.debug($(this))
        event.preventDefault();                                             // Prevent default action for <a> elements
        event.stopPropagation();                                            // Prevent event from bubbling up
        const parentLV = $(this).parents('.layout-viewer')[0]               // Get the closest
        console.debug(parentLV)                          // Log the parent layout viewer element
        $(parentLV).toggleClass('expanded')                 // Toggle the expanded class on the layout viewer
        $(this).children('[class*="fa-"]').toggleClass('fa-expand fa-compress');
    })
    
})