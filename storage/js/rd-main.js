import { init } from './rd-db.js';

// * Initialize the table
init('cs-CZ'); 






// TODO: Move all following code code elsewhere
// # FANCYBOX # //
// try {
//     // Initialization
//     Fancybox.bind('[data-fancybox]', {
//         Carousel: {
//             transition: "slide",
//         },
//         dragToClose: false,
//         l10n: Fancybox.l10n.cs,     // Czech language for UI
//         Thumbs: {
//             showOnStart: false,
//             type: "classic",
//         },
//         Toolbar: {
//             display: {
//                 left: [
//                     "thumbs",
//                     "infobar",
//                 ],
//                 middle: [
//                     "zoomIn",
//                     "zoomOut",
//                 ],
//                 right: [
//                     "close"
//                 ],
//             },
//         },
//     });
// } catch (error) {
//     console.warn('Fancybox failed', error);
// }