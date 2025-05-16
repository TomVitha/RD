import { fetchSheetData, populateTemplateTableWithData } from './rd-db.js';


// ! NOTE: This will change depending on the CZ or EN version of the script
const locale = 'cs-CZ';
// const locale = 'en-US';



async function init(locale) {
    const propertiesData = await fetchSheetData();
    if (!propertiesData) {
        console.error('Failed to fetch or parse data.');
        return 
    }
    console.debug('Fetched data: ', propertiesData.tableData);
    populateTemplateTableWithData(propertiesData.tableData, locale, true);
    const priceTable = document.querySelector('.price-table');
    if (!priceTable) {
        console.error("Table .price-table not found after populating data.");
        return
    }

    $(document).ready( function () {

        function naturalSort(a, b, multiplier = 1) {
            let alpha = a.replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' '); // Remove HTML tags, replace non-breaking spaces
            let beta  = b.replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' '); // Remove HTML tags, replace non-breaking spaces
            console.debug('Natural sort: ', alpha, beta);
            const out = alpha.localeCompare(beta, locale, {numeric: true, ignorePunctuation: true});
            return out * multiplier;
        }

        $.extend( DataTable.ext.type.order, {
            "natural-asc": function ( a, b ) {
            return naturalSort(a, b);
            },
        
            "natural-desc": function ( a, b ) {
            return naturalSort(a, b, -1);
            }
        });

        DataTable.defaults.column.orderSequence = ['asc', 'desc'];

        $('.price-table').DataTable( {
            order: [[6, 'asc']],       // Sort by Price by default sort on initialization
            paging: false,
            searching: false,
            info: false,
            language: {
                url: `//cdn.datatables.net/plug-ins/2.3.0/i18n/${locale == 'cs-CZ' ? 'cs' : 'en-GB'}.json`,
            },
            columnDefs: [
                { orderable: false, targets: [3, 7] },
                // { type: 'natural-nohtml', target: '_all' },
                { type: 'natural', target: '_all' },
                { className: "dt-center", targets: [0, 7] },
                { className: "dt-right", targets: [6] },
                // { width: '100%', targets: 3 },
                // { width: '0%', targets: 6 },
            ],
            responsive: false,
        });
    } );
    
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