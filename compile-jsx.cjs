const https = require('https');
const vm = require('vm');
const fs = require('fs');

console.log('Compiling JSX sources to public/js...');
const ctx = vm.createContext({ console, setTimeout, clearTimeout });

https.get('https://unpkg.com/@babel/standalone@7.24.0/babel.min.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        vm.runInContext(data, ctx);
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
    const el = document.getElementById('${t.root}');
    if (el) {
        if (ReactDOM.createRoot) {
            ReactDOM.createRoot(el).render(React.createElement(${t.comp}, null));
        } else {
            ReactDOM.render(React.createElement(${t.comp}, null), el);
        }
    }
})();
`;
            fs.writeFileSync(t.dest, compiled.code + mount);
            console.log(`✓ Compiled ${t.dest} (${compiled.code.length} bytes)`);
        }
        console.log('All JSX assets successfully compiled.');
    });
});
