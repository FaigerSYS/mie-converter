'use strict';

function showElements() {
    for (var i = 0; i < arguments.length; i++) {
        document.getElementById(arguments[i]).style.display = "block";
    }
}

function hideElements() {
    for (var i = 0; i < arguments.length; i++) {
        document.getElementById(arguments[i]).style.display = "none";
    }
}

function showError(str) {
    hideElements("success");
    showElements("error");
    document.getElementById("error").innerText = str;
}

window.onload = function() {
    showElements("upload");
};

function processFile(elm) {
    hideElements("error", "success");

    const bw_old = document.getElementById("upload.width").value;
    const bh_old = document.getElementById("upload.height").value;
    const bw = parseInt(bw_old, 10);
    const bh = parseInt(bh_old, 10);
    if (bw_old != bw.toString(10) || bh_old != bh.toString(10) || bw < 1 || bh < 1 || bw > 0x7fffffff || bh > 0x7fffffff) {
        showError("Invalid size");
        return;
    }

    let file = elm.files[0];
    elm.value = "";
    let filename = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const elem = document.createElement("canvas");
            elem.width = bw * 128;
            elem.height = bh * 128;
            const ctx = elem.getContext("2d");
            ctx.drawImage(img, 0, 0, bw * 128, bh * 128);
            
            let buffer = new Uint8Array(16 + 8 + bw * bh * (128 * 128 * 4 + 8));

            let uuid = new Uint8Array(16);
            let pos = 0;
            window.crypto.getRandomValues(uuid);
            for (; pos < 16; pos++) {
                buffer[pos] = uuid[pos];
            }

            buffer[pos++] = bw >> 12 & 0xff;
            buffer[pos++] = bw >> 8 & 0xff;
            buffer[pos++] = bw >> 4 & 0xff;
            buffer[pos++] = bw & 0xff; // width
            buffer[pos++] = bh >> 12 & 0xff;
            buffer[pos++] = bh >> 8 & 0xff;
            buffer[pos++] = bh >> 4 & 0xff;
            buffer[pos++] = bh & 0xff; // height

            for (let by = 0; by < bh; by++) {
                for (let bx = 0; bx < bw; bx++) {
                    pos += 3; 
                    buffer[pos++] = 128;
                    pos += 3;
                    buffer[pos++] = 128;
                    let block = ctx.getImageData(bx * 128, by * 128, 128, 128).data;
                    for (let bi = 0; bi < (128 * 128 * 4); bi++) {
                        buffer[pos + bi] = block[bi];
                    }
                    pos += 128 * 128 * 4;
                }
            }
            buffer = pako.deflate(buffer);

            const dot = filename.lastIndexOf(".");
            if (dot != -1) {
                filename = filename.substring(0, dot);
            }
            filename += "_" + bw + "x" + bh + ".miei";

            let header = new Uint8Array(4 + 4 + 1);
            pos = 0;
            header[pos++] = 0x4d;
            header[pos++] = 0x49;
            header[pos++] = 0x45;
            header[pos++] = 0x49; // MIEI
            pos += 3;
            header[pos++] = 2; // ver
            header[pos++] = 1; // iscompressed

            saveAs(new Blob([header, buffer], {
                type: 'application/octet-stream'
            }), filename);
            hideElements("progress");
            showElements("upload", "success");
        },
        img.onerror = error => {
            hideElements("progress");
            showElements("upload");
            showError("Image load error");
            console.log(error);
        };
        img.src = event.target.result;
    };
    reader.onerror = error => {
        showElements("upload");
        showError("Unknown error");
        console.log(error);
    };
    reader.readAsDataURL(file);
    hideElements("upload");
    showElements("progress");
}
