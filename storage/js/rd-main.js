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
          const { createMap } = await import(`./mapbox-data2.js?v=1.1`)                                                   // Dynamically import map content
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


   // Dropdown <select> opens <option>'s value link in a new tab
  document.querySelectorAll('select[data-dropdown-links]').forEach(select => {
    select.addEventListener('change', function () {
      const targetUrl = this.value;
      if (targetUrl) {

        const link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.selectedIndex = 0;           // Reset the dropdown to the placeholder option
      }
    });
  });


// NOTE: Scroll k elementu podle hashe v URL adrese při načtení stránky je řešen v /storage/CG/wms3/js/app-patches.js
// TAK NE

// scroll open to #hash position directly
$(document).ready(function () {
  if (window.location.hash) {
    const hash = window.location.hash;
    const OFFSET = 80;

    function getTargetTop() {
      const $el = $(hash);
      if (!$el.length) return null;
      return $el.offset().top - OFFSET;
    }
    function smoothScrollTo(targetY) {
      $('html, body').stop().animate({
        scrollTop: targetY
      }, 300, 'swing');
    }
    function jumpTo(targetY) {
      window.scrollTo(0, targetY);
    }
    function stabilizeScroll() {
      let count = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        const targetY = getTargetTop();
        if (targetY === null) return;
        const currentY = window.scrollY;
        const diff = Math.abs(currentY - targetY);
        if (diff < 5 || count >= maxAttempts) {
          clearInterval(interval);
          return;
        }
        jumpTo(targetY);
        count++;
      }, 150);
    }
    function initScroll() {
      const targetY = getTargetTop();
      if (targetY !== null) {
        setTimeout(() => {         
          smoothScrollTo(targetY);      
          setTimeout(() => {
            stabilizeScroll();
          }, 450);
        }, 100);
        return true;
      }
      return false;
    }
    if (!initScroll()) {
      const observer = new MutationObserver(() => {
        if (initScroll()) {
          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
});

// URD gallery
(function () {
  function loadScript(src, onload) {
    if (document.querySelector('script[src="' + src + '"]')) {
      onload();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    s.onerror = function () {
      console.error('[urd-gallery] Nepoda�ilo se na��st: ' + src);
    };
    document.head.appendChild(s);
  }

  loadScript(
    'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
    function () {
      new Swiper('.urd-swiper', {
        loop: true,
        grabCursor: true,
        navigation: {
          prevEl: '.urd-swiper .swiper-button-prev',
          nextEl: '.urd-swiper .swiper-button-next',
        },
        keyboard: { enabled: true },
        a11y: {
          prevSlideMessage: 'P�edchoz� sn�mek',
          nextSlideMessage: 'N�sleduj�c� sn�mek',
        },
      });
    }
  );
}());

}