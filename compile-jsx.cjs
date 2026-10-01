const https = require('https');
const vm = require('vm');
const fs = require('fs');

console.log('Compiling JSX sources to public/js...');
const ctx = vm.createContext({ console, setTimeout, clearTimeout });

function runCompilation(babelSource) {
    vm.runInContext(babelSource, ctx);
    fs.mkdirSync('public/js', { recursive: true });

    const targets = [
        { src: 'resources/jsx/CustomerApp.jsx', dest: 'public/js/customer-app.js', root: 'root', comp: 'App' },
        { src: 'resources/jsx/AdminApp.jsx', dest: 'public/js/admin-app.js', root: 'admin-root', comp: 'AdminApp' },
        { src: 'resources/jsx/KitchenApp.jsx', dest: 'public/js/kitchen-app.js', root: 'kitchen-root', comp: 'KitchenDisplay' },
        { src: 'resources/jsx/TrackApp.jsx', dest: 'public/js/track-app.js', root: 'track-root', comp: 'OrderTracker' }
    ];

    for (const t of targets) {
        let code = fs.readFileSync(t.src, 'utf8');
        // Remove any trailing ReactDOM.render
        code = code.replace(/ReactDOM\.render\([\s\S]*?\);\s*$/, '');
        const compiled = ctx.Babel.transform(code, { presets: ['react'] });

        const mount = `
(function() {
    function init() {
        const el = document.getElementById('${t.root}');
        if (!el) return;
        try {
            el.innerHTML = '';
            if (typeof ReactDOM !== 'undefined' && ReactDOM.createRoot) {
                ReactDOM.createRoot(el).render(React.createElement(${t.comp}, null));
            } else if (typeof ReactDOM !== 'undefined' && ReactDOM.render) {
                ReactDOM.render(React.createElement(${t.comp}, null), el);
            } else {
                console.error("ReactDOM is not available");
            }
        } catch (err) {
            console.error("Error mounting ${t.comp}:", err);
            el.innerHTML = '<div style="min-height:50vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:sans-serif;"><div style="background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:450px;"><h3 style="color:#dc2626;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Initialization Error</h3><p style="color:#6b7280;font-size:0.875rem;margin-bottom:1rem;">' + (err.message || 'Unknown error') + '</p><button onclick="location.reload()" style="padding:0.6rem 1.2rem;background:#ea580c;color:white;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer;">Reload Application</button></div></div>';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
`;
        fs.writeFileSync(t.dest, compiled.code + mount);
        console.log(`✓ Compiled ${t.dest} (${compiled.code.length} bytes)`);
    }
    console.log('All JSX assets successfully compiled.');
}

if (fs.existsSync('babel.min.js')) {
    const data = fs.readFileSync('babel.min.js', 'utf8');
    runCompilation(data);
} else {
    https.get('https://unpkg.com/@babel/standalone@7.24.0/babel.min.js', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => runCompilation(data));
    });
}
