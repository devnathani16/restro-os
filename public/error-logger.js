window.addEventListener('error', function(e) {
    const el = document.getElementById('root') || document.body;
    if (el) el.innerHTML += `<div style="color:red; background:white; padding:20px; z-index:9999; position:relative; border: 5px solid red;">
        <h3>Error: ${e.message}</h3>
        <p>File: ${e.filename}:${e.lineno}</p>
        <pre>${e.error ? e.error.stack : ''}</pre>
    </div>`;
    else alert('Error: ' + e.message);
});
window.addEventListener('unhandledrejection', function(e) {
    const el = document.getElementById('root') || document.body;
    if (el) el.innerHTML += `<div style="color:red; background:white; padding:20px; z-index:9999; position:relative; border: 5px solid red;">
        <h3>Promise Rejection: ${e.reason}</h3>
    </div>`;
    else alert('Promise Rejection: ' + e.reason);
});
