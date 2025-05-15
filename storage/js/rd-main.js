console.info('TEST - Loading main script...');

import { fetchSheetData, populateTemplateTableWithData } from './rd-db.js'; // Adjust the path as necessary

async function initialize(locale) {
    const propertiesData = await fetchSheetData();

    if (!propertiesData) {
        console.error('Failed to fetch or parse data.');
        return 
    }

    populateTemplateTableWithData(propertiesData.tableData, locale, true);

    const table = document.querySelector('.price-table');

    if (!table) {
        console.error("Table .price-table not found after populating data.");
        return
    }
    
    // Now it's safe to call clickableTh
    cellsFunctionality(table); 
}

// Example usage with a specific locale
initialize(); 


function sortTable(n, table, dir = "asc") {
  // Get all rows except the header row
  const rows = Array.from(table.rows).slice(1);
  
  // Sort the rows
  rows.sort((rowA, rowB) => {
    // Get cell contents
    const cellA = rowA.cells[n].textContent.trim();
    const cellB = rowB.cells[n].textContent.trim();
    
    // Use natural sort comparison
    const result = naturalCompare(cellA, cellB);
    
    // Apply sorting direction
    return dir === "asc" ? result : -result;
  });
  
  // Remove rows from DOM and re-append in sorted order
  const parent = rows[0].parentNode;
  const fragment = document.createDocumentFragment();
  rows.forEach(row => fragment.appendChild(row));
  parent.appendChild(fragment);
}

// Natural sort comparison function
function naturalCompare(a, b) {
  // Split strings into chunks of text and numbers
  const chunker = /(\d+|\D+)/g;
  
  const aChunks = String(a).match(chunker) || [];
  const bChunks = String(b).match(chunker) || [];
  
  // Compare each chunk until we find a difference
  for (let i = 0; i < Math.min(aChunks.length, bChunks.length); i++) {
    // Check if chunks are numeric
    const aIsNum = !isNaN(aChunks[i]);
    const bIsNum = !isNaN(bChunks[i]);
    
    // If both are numbers, compare numerically
    if (aIsNum && bIsNum) {
      const numA = parseInt(aChunks[i], 10);
      const numB = parseInt(bChunks[i], 10);
      if (numA !== numB) {
        return numA - numB;
      }
    }
    // If types differ, numbers come before strings
    else if (aIsNum !== bIsNum) {
      return aIsNum ? -1 : 1;
    }
    // Both are strings, compare case-insensitively
    else if (aChunks[i].toLowerCase() !== bChunks[i].toLowerCase()) {
      return aChunks[i].toLowerCase() < bChunks[i].toLowerCase() ? -1 : 1;
    }
  }
  
  // If we get here, the common parts are equal, so compare lengths
  return aChunks.length - bChunks.length;
}

function cellsFunctionality(table) {
    $(".price-table th.sortable").on("click", function() {
        // Handle column header status and sort direction
        let dir;
        
        if (!$(this).hasClass("active")) {
            // New column selected - reset siblings and set ascending
            dir = "asc";
            $(this).siblings().removeClass("active asc desc");
            $(this).addClass("active asc");
        } else {
            // Toggle between ascending and descending
            dir = $(this).hasClass("asc") ? "desc" : "asc";
            $(this).toggleClass("asc desc");
        }
        
        // Get column index and sort the table
        const index = $(".price-table th").index(this);
        sortTable(index, table, dir);

        // Remove existing cell highlighting
        const activeCells = table.querySelectorAll('tbody td');
        activeCells.forEach(cell => cell.classList.remove('active'));
        
        // Highlight cells in sorted column
        table.querySelectorAll("tbody tr").forEach(row => {
            row.querySelectorAll('td')[index].classList.add('active');
        });
    });
}

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