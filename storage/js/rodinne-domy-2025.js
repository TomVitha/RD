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

console.log('sdgsfg');