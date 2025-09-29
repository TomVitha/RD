import { loadAllScripts } from './scripts-loader.js';
import { initDb } from './rd-db.js';

// * Initialize the table
// init('cs-CZ');


// WIP !!!
export async function initialize(locale) {
  await loadAllScripts();
  await initDb(locale);

  // * === Other scripts === * //

  // * Close dialog by clicking outside of it
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  // * Hotspots - Switch content
  document.querySelectorAll('.hotspots__switches .btn').forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-hotspots-target")
      document.querySelectorAll('.hotspots__content').forEach((element) => {
        if (element.id === target) {
          element.removeAttribute('hidden')
        }
        else {
          element.setAttribute('hidden', '')
        }
      })
      // Toggle active class
      document.querySelectorAll('.hotspots__switches .btn').forEach((b) => {
        b.classList.remove('btn-secondary')
        b.classList.add('btn-white')
      })
      btn.classList.remove('btn-white')
      btn.classList.add('btn-secondary')
    })
  })


  // * Initialize Tippy for tooltips
  // HACK: Delay init to ensure Tippy is fully loaded
  setTimeout(() => {
    tippy('[data-tippy-content]', {
      animation: "shift-away",
      theme: 'tippy-main-theme',
      onCreate(instance) {
        instance.reference.removeAttribute('title');  // Remove title attribute to prevent conflict with default browser tooltip
      },
    });
  }, 1500);
}