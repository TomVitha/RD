export function loadScript(url, isDefer = false, isAsync = false, location = document.body) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.defer = isDefer
        script.async = isAsync
        location ? location.appendChild(script) : document.body.appendChild(script);    // Fallback to body if invalid or no location is provided
        script.onload = () => resolve();
        script.onerror = () => {
            // reject();
            // NOTE: Instead of rejecting, which would stop the chain, we just log the error and continue
            console.error('Failed to load script:', url);
            resolve();
        };
        console.debug(script);
    })
}

export async function loadAllScripts() {
    console.debug('Loading all scripts...');
    try {
        await loadScript('https://cdn.datatables.net/2.3.2/js/dataTables.js');              // DataTables
        await loadScript('https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js'); // Popper
        await loadScript('https://unpkg.com/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js');  // Tippy
        await loadScript('https://api.mapbox.com/mapbox-gl-js/v3.11.1/mapbox-gl.js');       // Mapbox
        await loadScript('https://www.central-group.cz/storage/CG/194-RD/js/mapbox.js');    // Mapbox init
        await loadScript('https://www.central-group.cz/storage/CG/wms3/js/lokalitni-stranka-2024/anchor-navigation.js');    // Navigation fix
        // await loadScript('https://www.central-group.cz/storage/CG/wms3/js/lokalitni-stranka-2024/open-form.js');            // Open contact form         // TEMP disabled
        console.log('All scripts loaded.');
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}