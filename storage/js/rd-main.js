console.info('TEST - Loading main script...');

import { fetchSheetData, populateTemplateTableWithData } from './rd-db.js'; // Adjust the path as necessary

async function initialize(locale) {
    const propertiesData = await fetchSheetData();
    if (propertiesData) {
        populateTemplateTableWithData(propertiesData.tableData, locale);
    }
}

// Example usage with a specific locale
initialize(); 


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