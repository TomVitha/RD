$(document).ready(function () {
    // Top menu options dropdown
    $("li.mm-product").on('click', function () {
        $(this).toggleClass('menu-top-visible');
        $(this).children('ul.mm-level-1').toggleClass('active')
    });
    // Bottom menu options dropdown
    $('.mm-main-item').on('click', function () {
        $(this).toggleClass('menu-top-visible');
        $(this).children('ul.mm-level-1').toggleClass('active')
    });
    // Mobile hamburger
    $('.nav-brand.hd-va-center').on('click', function () {
        $(this).toggleClass('open');
        $(this).children('i').toggleClass('fa-bars fa-xmark');
    });
});