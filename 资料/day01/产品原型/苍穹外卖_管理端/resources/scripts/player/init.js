(function () {
    $.holdReady(true);

    var script = window.document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.onload = script.onreadystatechange = function (e, isAbort) {
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
            script.onload = script.onreadystatechange = null;
            script = undefined;
        }

        if (!isAbort) { $.holdReady(false); }
    }

    script.src = "data/document.js";
    window.document.head.appendChild(script);
})();