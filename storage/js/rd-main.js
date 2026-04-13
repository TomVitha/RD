import { initDb } from './rd-db.js';

// * Tippy (internally imports Popper) - Styling does not get injected, needs to be imported manually (in main style .css file)
import tippy from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm'

// * Open contact form
import 'https://www.central-group.cz/storage/CG/wms3/js/lokalitni-stranka-2024/open-form.js'


// WIP !!!
export async function init(locale) {
  await initDb(locale);

  // # === Other scripts === # //

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

  // * MapBox GL Initialization
  try {
    // Observer the map container becoming visible in viewport to lazy-load MapBox
    const mapContainer = document.getElementById('map');
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const { default: mapboxgl } = await import('https://api.mapbox.com/mapbox-gl-js/v3.18.0/esm-min/mapbox-gl.js')  // Defer importing MapBox
          const { createMap } = await import(`./mapbox-data.js`)                                                               // Dynamically import map content
          // TODO: Replace with actual token
          mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN' // Set MapBox access token
          createMap(mapboxgl)                       // Load MapBox - only once the map container is visible
          observer.unobserve(mapContainer)          // Stop observing once the map is loaded          
        }
      })
    }, {
      root: null,         // use the viewport as the root
      rootMargin: "50px", // how far triggers before reaching the map
    });
    observer.observe(mapContainer);
  }
  catch (error) {
    console.error('Error initializing Mapbox:', error);
  }


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